import express from 'express';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { verifyToken, requireAdmin } from '../../auth';
import { query } from '../../db';

const router = express.Router();

// Multer для загрузки файла в память
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

interface CSVUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  price: string;
  actualPayment: string;
  city: string;
  country: string;
  productId: string;
  cohortId: string;
}

function parseCSV(content: string): CSVUser[] {
  const lines = content.split('\n').filter(line => line.trim());

  // Пропускаем заголовок
  const dataLines = lines.slice(1);

  const users: CSVUser[] = [];

  for (const line of dataLines) {
    // Парсим CSV с учетом кавычек и экранирования
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Последнее поле

    if (fields.length < 10) continue;

    const clean = (str: string) => str.replace(/^"|"$/g, '').trim();

    users.push({
      firstName: clean(fields[0]),
      lastName: clean(fields[1]),
      email: clean(fields[2]),
      phone: clean(fields[3]),
      price: clean(fields[4]),
      actualPayment: clean(fields[5]),
      city: clean(fields[6]),
      country: clean(fields[7]),
      productId: clean(fields[8]),
      cohortId: clean(fields[9])
    });
  }

  return users;
}

router.post('/import', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const users = parseCSV(content);

    if (users.length === 0) {
      return res.status(400).json({ error: 'No valid users found in CSV' });
    }

    let created = 0;
    let existing = 0;
    let enrolled = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const user of users) {
      try {
        if (!user.email) {
          errorDetails.push(`Skipped user without email: ${user.firstName} ${user.lastName}`);
          errors++;
          continue;
        }

        // Генерируем username из email
        const username = user.email.split('@')[0].toLowerCase();

        // Проверяем существует ли пользователь
        const existingUser = await query(
          'SELECT id FROM labs.users WHERE email = $1',
          [user.email]
        );

        let userId: number;

        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;

          // Обновляем данные существующего пользователя
          await query(
            `UPDATE labs.users
             SET first_name = $1, last_name = $2, phone = $3, city = $4, country = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [
              user.firstName || null,
              user.lastName || null,
              user.phone || null,
              user.city || null,
              user.country || null,
              userId
            ]
          );

          existing++;
        } else {
          // Создаем пользователя с паролем = email
          const passwordHash = await bcrypt.hash(user.email, 10);

          const result = await query(
            `INSERT INTO labs.users (username, email, password_hash, first_name, last_name, phone, city, country, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'user')
             RETURNING id`,
            [
              username,
              user.email,
              passwordHash,
              user.firstName || null,
              user.lastName || null,
              user.phone || null,
              user.city || null,
              user.country || null
            ]
          );

          userId = result.rows[0].id;
          created++;
        }

        // Проверяем существует ли enrollment для этого пользователя, продукта и потока
        const existingEnrollment = await query(
          'SELECT id FROM labs.user_enrollments WHERE user_id = $1 AND product_id = $2 AND cohort_id = $3',
          [userId, parseInt(user.productId), parseInt(user.cohortId)]
        );

        if (existingEnrollment.rows.length > 0) {
          // Обновляем actual_amount в enrollment
          await query(
            `UPDATE labs.user_enrollments
             SET actual_amount = $1
             WHERE id = $2`,
            [parseFloat(user.actualPayment) || null, existingEnrollment.rows[0].id]
          );
        } else {
          // Получаем первый доступный pricing tier
          const tierResult = await query(
            'SELECT id FROM labs.pricing_tiers ORDER BY tier_level LIMIT 1'
          );

          if (tierResult.rows.length === 0) {
            errorDetails.push(`No pricing tiers found in system (user: ${user.email})`);
            errors++;
            continue;
          }

          const pricingTierId = tierResult.rows[0].id;

          // Создаем enrollment
          await query(
            `INSERT INTO labs.user_enrollments (user_id, product_id, cohort_id, pricing_tier_id, actual_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'active')`,
            [userId, parseInt(user.productId), parseInt(user.cohortId), pricingTierId, parseFloat(user.actualPayment) || null]
          );

          enrolled++;
        }

        // Добавляем в cohort_members если еще нет
        await query(
          `INSERT INTO labs.cohort_members (cohort_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (cohort_id, user_id) DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP`,
          [parseInt(user.cohortId), userId]
        );

      } catch (error: any) {
        errorDetails.push(`Error processing ${user.email}: ${error.message}`);
        errors++;
      }
    }

    res.json({
      success: true,
      summary: {
        total: users.length,
        created,
        existing,
        enrolled,
        errors
      },
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    });

  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import users', details: error.message });
  }
});

export default router;
