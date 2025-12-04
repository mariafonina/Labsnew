import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { query } from './db';

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

function parseCSV(filePath: string): CSVUser[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Пропускаем заголовок
  const dataLines = lines.slice(1);

  const users: CSVUser[] = [];

  for (const line of dataLines) {
    // Парсим CSV с учетом кавычек
    const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 10) continue;

    const clean = (str: string) => str.replace(/^"|"$/g, '').trim();

    users.push({
      firstName: clean(matches[0]),
      lastName: clean(matches[1]),
      email: clean(matches[2]),
      phone: clean(matches[3]),
      price: clean(matches[4]),
      actualPayment: clean(matches[5]),
      city: clean(matches[6]),
      country: clean(matches[7]),
      productId: clean(matches[8]),
      cohortId: clean(matches[9])
    });
  }

  return users;
}

async function importUsers() {
  try {
    console.log('Starting user import...\n');

    const csvPath = path.join(process.cwd(), 'users.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('File users.csv not found in project root');
      process.exit(1);
    }

    const users = parseCSV(csvPath);
    console.log(`Found ${users.length} users in CSV\n`);

    let created = 0;
    let existing = 0;
    let enrolled = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (!user.email) {
          console.log(`⚠️  Skipping user without email: ${user.firstName} ${user.lastName}`);
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
          console.log(`✓ User exists: ${user.email} (ID: ${userId})`);
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
          console.log(`✓ Created user: ${user.email} (ID: ${userId})`);
          created++;
        }

        // Проверяем существует ли enrollment для этого пользователя, продукта и потока
        const existingEnrollment = await query(
          'SELECT id FROM labs.user_enrollments WHERE user_id = $1 AND product_id = $2 AND cohort_id = $3',
          [userId, parseInt(user.productId), parseInt(user.cohortId)]
        );

        if (existingEnrollment.rows.length > 0) {
          console.log(`  → Already enrolled in product ${user.productId}, cohort ${user.cohortId}`);
        } else {
          // Получаем первый доступный pricing tier
          const tierResult = await query(
            'SELECT id FROM labs.pricing_tiers ORDER BY tier_level LIMIT 1'
          );

          if (tierResult.rows.length === 0) {
            console.log(`  ⚠️  No pricing tiers found in system`);
            errors++;
            continue;
          }

          const pricingTierId = tierResult.rows[0].id;

          // Создаем enrollment
          await query(
            `INSERT INTO labs.user_enrollments (user_id, product_id, cohort_id, pricing_tier_id, status)
             VALUES ($1, $2, $3, $4, 'active')`,
            [userId, parseInt(user.productId), parseInt(user.cohortId), pricingTierId]
          );

          console.log(`  → Enrolled in product ${user.productId}, cohort ${user.cohortId}, tier ${pricingTierId}`);
          enrolled++;
        }

        console.log('');

      } catch (error: any) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
        errors++;
        console.log('');
      }
    }

    console.log('\n========== IMPORT SUMMARY ==========');
    console.log(`Total users in CSV: ${users.length}`);
    console.log(`Created new users: ${created}`);
    console.log(`Existing users: ${existing}`);
    console.log(`New enrollments: ${enrolled}`);
    console.log(`Errors: ${errors}`);
    console.log('====================================\n');

    process.exit(0);

  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  }
}

importUsers();
