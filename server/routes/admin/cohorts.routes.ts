import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();

// Настройка multer для загрузки файлов
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(`
    SELECT c.*, 
           p.name as product_name,
           p.type as product_type,
           COUNT(DISTINCT cm.user_id) as member_count
    FROM labs.cohorts c
    LEFT JOIN labs.products p ON c.product_id = p.id
    LEFT JOIN labs.cohort_members cm ON c.id = cm.cohort_id AND cm.left_at IS NULL
    GROUP BY c.id, p.name, p.type
    ORDER BY c.created_at DESC
  `);
  res.json(result.rows);
}));

router.get('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await query(`
    SELECT c.*, p.name as product_name
    FROM labs.cohorts c
    LEFT JOIN labs.products p ON c.product_id = p.id
    WHERE c.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  
  res.json(result.rows[0]);
}));

router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { product_id, name, description, start_date, end_date, is_active, max_participants } = req.body;

  if (!product_id || !name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Product ID, name, start_date, and end_date are required' });
  }

  const sanitizedName = sanitizeText(name.trim());
  const sanitizedDescription = description ? sanitizeText(description.trim()) : null;

  const result = await query(`
    INSERT INTO labs.cohorts (product_id, name, description, start_date, end_date, is_active, max_participants)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [product_id, sanitizedName, sanitizedDescription, start_date, end_date, is_active !== false, max_participants || null]);

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, start_date, end_date, is_active, max_participants } = req.body;

  const existingCohort = await query('SELECT id FROM labs.cohorts WHERE id = $1', [id]);
  if (existingCohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  let updateQuery = 'UPDATE labs.cohorts SET updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    const sanitizedName = sanitizeText(name.trim());
    params.push(sanitizedName);
    updateQuery += `, name = $${paramIndex++}`;
  }

  if (description !== undefined) {
    const sanitizedDescription = description ? sanitizeText(description.trim()) : null;
    params.push(sanitizedDescription);
    updateQuery += `, description = $${paramIndex++}`;
  }

  if (start_date !== undefined) {
    params.push(start_date);
    updateQuery += `, start_date = $${paramIndex++}`;
  }

  if (end_date !== undefined) {
    params.push(end_date);
    updateQuery += `, end_date = $${paramIndex++}`;
  }

  if (is_active !== undefined) {
    params.push(is_active);
    updateQuery += `, is_active = $${paramIndex++}`;
  }

  if (max_participants !== undefined) {
    params.push(max_participants || null);
    updateQuery += `, max_participants = $${paramIndex++}`;
  }

  params.push(id);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);
  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM labs.cohorts WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  res.json({ message: 'Cohort deleted successfully' });
}));

router.get('/:id/members', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await query(`
    SELECT cm.*, u.username, u.email, u.first_name, u.last_name
    FROM labs.cohort_members cm
    JOIN labs.users u ON cm.user_id = u.id
    WHERE cm.cohort_id = $1 AND cm.left_at IS NULL
    ORDER BY cm.joined_at DESC
  `, [id]);
  res.json(result.rows);
}));

router.post('/:id/members', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user_ids } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'user_ids array is required' });
  }

  const cohort = await query('SELECT id, max_participants FROM labs.cohorts WHERE id = $1', [id]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  if (cohort.rows[0].max_participants) {
    const currentCount = await query(`
      SELECT COUNT(*) as count FROM labs.cohort_members 
      WHERE cohort_id = $1 AND left_at IS NULL
    `, [id]);
    
    const newCount = parseInt(currentCount.rows[0].count) + user_ids.length;
    if (newCount > cohort.rows[0].max_participants) {
      return res.status(400).json({ 
        error: `Cohort capacity exceeded. Max: ${cohort.rows[0].max_participants}, Current: ${currentCount.rows[0].count}, Trying to add: ${user_ids.length}` 
      });
    }
  }

  const added = [];
  for (const userId of user_ids) {
    const result = await query(`
      INSERT INTO labs.cohort_members (cohort_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (cohort_id, user_id) 
      DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, userId]);
    added.push(result.rows[0]);
  }

  res.status(201).json({ message: `Added ${added.length} members to cohort`, members: added });
}));

router.delete('/:id/members/:userId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;

  const result = await query(`
    UPDATE labs.cohort_members 
    SET left_at = CURRENT_TIMESTAMP 
    WHERE cohort_id = $1 AND user_id = $2 AND left_at IS NULL
    RETURNING id
  `, [id, userId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Member not found in cohort' });
  }

  res.json({ message: 'Member removed from cohort successfully' });
}));

// Эндпоинт для загрузки CSV/XLS файла с пользователями
router.post('/:id/members/upload', 
  verifyToken, 
  requireAdmin, 
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const cohort = await query('SELECT id, max_participants FROM labs.cohorts WHERE id = $1', [id]);
    if (cohort.rows.length === 0) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    let emails: string[] = [];
    let usernames: string[] = [];

    try {
      // Определяем тип файла
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        // Парсинг CSV
        const text = file.buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim());
        
        // Пропускаем заголовок если есть
        const startIndex = lines[0].toLowerCase().includes('email') || lines[0].toLowerCase().includes('username') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values[0]) {
            // Проверяем, это email или username
            if (values[0].includes('@')) {
              emails.push(values[0]);
            } else {
              usernames.push(values[0]);
            }
          }
        }
      } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
        // Парсинг XLS/XLSX
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Пропускаем заголовок если есть
        const startIndex = data[0]?.some((cell: any) => 
          String(cell).toLowerCase().includes('email') || 
          String(cell).toLowerCase().includes('username')
        ) ? 1 : 0;
        
        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (row && row[0]) {
            const value = String(row[0]).trim();
            if (value.includes('@')) {
              emails.push(value);
            } else {
              usernames.push(value);
            }
          }
        }
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload CSV or XLS/XLSX file' });
      }

      // Находим пользователей по email или username
      const user_ids: number[] = [];
      const notFound: string[] = [];

      if (emails.length > 0) {
        const placeholders = emails.map((_, i) => `$${i + 1}`).join(',');
        const usersResult = await query(
          `SELECT id, email FROM labs.users WHERE email IN (${placeholders})`,
          emails
        );
        const foundEmails = new Set(usersResult.rows.map((u: any) => u.email));
        user_ids.push(...usersResult.rows.map((u: any) => u.id));
        emails.forEach(email => {
          if (!foundEmails.has(email)) {
            notFound.push(email);
          }
        });
      }

      if (usernames.length > 0) {
        const placeholders = usernames.map((_, i) => `$${i + 1}`).join(',');
        const usersResult = await query(
          `SELECT id, username FROM labs.users WHERE username IN (${placeholders})`,
          usernames
        );
        const foundUsernames = new Set(usersResult.rows.map((u: any) => u.username));
        const newUserIds = usersResult.rows.map((u: any) => u.id).filter((id: number) => !user_ids.includes(id));
        user_ids.push(...newUserIds);
        usernames.forEach(username => {
          if (!foundUsernames.has(username)) {
            notFound.push(username);
          }
        });
      }

      if (user_ids.length === 0) {
        return res.status(400).json({ 
          error: 'No users found in the file',
          notFound: notFound
        });
      }

      // Проверяем лимит участников
      if (cohort.rows[0].max_participants) {
        const currentCount = await query(`
          SELECT COUNT(*) as count FROM labs.cohort_members 
          WHERE cohort_id = $1 AND left_at IS NULL
        `, [id]);
        
        const newCount = parseInt(currentCount.rows[0].count) + user_ids.length;
        if (newCount > cohort.rows[0].max_participants) {
          return res.status(400).json({ 
            error: `Cohort capacity exceeded. Max: ${cohort.rows[0].max_participants}, Current: ${currentCount.rows[0].count}, Trying to add: ${user_ids.length}` 
          });
        }
      }

      // Добавляем пользователей в поток
      const added = [];
      for (const userId of user_ids) {
        const result = await query(`
          INSERT INTO labs.cohort_members (cohort_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT (cohort_id, user_id) 
          DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [id, userId]);
        added.push(result.rows[0]);
      }

      // Получаем информацию о продукте и тарифе потока для автоматического зачисления
      const cohortInfo = await query(`
        SELECT c.product_id, pt.id as tier_id
        FROM labs.cohorts c
        LEFT JOIN labs.pricing_tiers pt ON pt.product_id = c.product_id AND pt.tier_level = 1
        WHERE c.id = $1
      `, [id]);

      let enrolledCount = 0;
      if (cohortInfo.rows.length > 0 && cohortInfo.rows[0].product_id && cohortInfo.rows[0].tier_id) {
        const productId = cohortInfo.rows[0].product_id;
        const tierId = cohortInfo.rows[0].tier_id;

        // Зачисляем пользователей в продукт
        for (const userId of user_ids) {
          try {
            await query(`
              INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status)
              VALUES ($1, $2, $3, $4, 'active')
              ON CONFLICT (user_id, product_id, cohort_id) 
              DO UPDATE SET 
                pricing_tier_id = EXCLUDED.pricing_tier_id,
                status = 'active',
                updated_at = CURRENT_TIMESTAMP
            `, [userId, productId, tierId, id]);
            enrolledCount++;
          } catch (err) {
            console.error(`Failed to enroll user ${userId} in product ${productId}:`, err);
          }
        }
      }

      res.status(201).json({ 
        message: `Added ${added.length} members to cohort from file${enrolledCount > 0 ? `, enrolled ${enrolledCount} in product` : ''}`,
        added: added.length,
        enrolled: enrolledCount,
        notFound: notFound.length > 0 ? notFound : undefined
      });
    } catch (error: any) {
      console.error('Error processing file:', error);
      return res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
  })
);

export default router;
