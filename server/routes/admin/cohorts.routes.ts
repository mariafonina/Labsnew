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

router.get('/:id/tiers', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  console.log(`[TIERS] Fetching tiers for cohort ${id}`);
  const result = await query(`
    SELECT * FROM labs.pricing_tiers
    WHERE cohort_id = $1
    ORDER BY tier_level
  `, [id]);
  console.log(`[TIERS] Found ${result.rows.length} tiers`);
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
    SELECT cm.*, u.username, u.email, u.first_name, u.last_name,
           ue.id as enrollment_id, ue.pricing_tier_id, ue.status as enrollment_status, ue.expires_at,
           ue.actual_amount,
           pt.name as tier_name, pt.price as tier_price, pt.tier_level
    FROM labs.cohort_members cm
    JOIN labs.users u ON cm.user_id = u.id
    LEFT JOIN labs.user_enrollments ue ON ue.cohort_id = cm.cohort_id AND ue.user_id = cm.user_id AND ue.status = 'active'
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE cm.cohort_id = $1 AND cm.left_at IS NULL
    ORDER BY cm.joined_at DESC
  `, [id]);
  res.json(result.rows);
}));

router.post('/:id/members', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { user_ids, user_id, pricing_tier_id, expires_at, actual_amount } = req.body;

  // Get cohort with product_id
  const cohort = await query('SELECT id, product_id, max_participants FROM labs.cohorts WHERE id = $1', [id]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  const cohortData = cohort.rows[0];

  // Single user with tier (new format)
  if (user_id && pricing_tier_id) {
    // Validate tier belongs to this cohort
    const tier = await query('SELECT id FROM labs.pricing_tiers WHERE id = $1 AND cohort_id = $2', [pricing_tier_id, id]);
    if (tier.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing tier not found for this cohort' });
    }

    // Check capacity
    if (cohortData.max_participants) {
      const currentCount = await query(`
        SELECT COUNT(*) as count FROM labs.cohort_members 
        WHERE cohort_id = $1 AND left_at IS NULL
      `, [id]);
      
      if (parseInt(currentCount.rows[0].count) >= cohortData.max_participants) {
        return res.status(400).json({ error: 'Cohort capacity exceeded' });
      }
    }

    // Add to cohort_members
    await query(`
      INSERT INTO labs.cohort_members (cohort_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (cohort_id, user_id) 
      DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP
    `, [id, user_id]);

    // Create/update enrollment with actual_amount
    const enrollment = await query(`
      INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status, expires_at, actual_amount)
      VALUES ($1, $2, $3, $4, 'active', $5, $6)
      ON CONFLICT (user_id, product_id, cohort_id) 
      DO UPDATE SET 
        pricing_tier_id = EXCLUDED.pricing_tier_id,
        status = 'active',
        expires_at = EXCLUDED.expires_at,
        actual_amount = EXCLUDED.actual_amount,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [user_id, cohortData.product_id, pricing_tier_id, id, expires_at || null, actual_amount !== undefined && actual_amount !== null && actual_amount !== '' ? actual_amount : null]);

    return res.status(201).json({ 
      message: 'Member added to cohort with tier', 
      enrollment: enrollment.rows[0] 
    });
  }

  // Batch add users without tier (legacy format)
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'Either user_id with pricing_tier_id, or user_ids array is required' });
  }

  if (cohortData.max_participants) {
    const currentCount = await query(`
      SELECT COUNT(*) as count FROM labs.cohort_members 
      WHERE cohort_id = $1 AND left_at IS NULL
    `, [id]);
    
    const newCount = parseInt(currentCount.rows[0].count) + user_ids.length;
    if (newCount > cohortData.max_participants) {
      return res.status(400).json({ 
        error: `Cohort capacity exceeded. Max: ${cohortData.max_participants}, Current: ${currentCount.rows[0].count}, Trying to add: ${user_ids.length}` 
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

router.put('/:id/members/:userId', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;
  const { pricing_tier_id, expires_at, status, actual_amount } = req.body;

  // Get cohort with product_id
  const cohort = await query('SELECT id, product_id FROM labs.cohorts WHERE id = $1', [id]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  // Check member exists
  const member = await query(`
    SELECT id FROM labs.cohort_members 
    WHERE cohort_id = $1 AND user_id = $2 AND left_at IS NULL
  `, [id, userId]);
  if (member.rows.length === 0) {
    return res.status(404).json({ error: 'Member not found in cohort' });
  }

  // Validate tier if provided
  if (pricing_tier_id) {
    const tier = await query('SELECT id FROM labs.pricing_tiers WHERE id = $1 AND cohort_id = $2', [pricing_tier_id, id]);
    if (tier.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing tier not found for this cohort' });
    }
  }

  // Update or create enrollment with actual_amount
  const enrollment = await query(`
    INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status, expires_at, actual_amount)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, product_id, cohort_id) 
    DO UPDATE SET 
      pricing_tier_id = COALESCE(EXCLUDED.pricing_tier_id, labs.user_enrollments.pricing_tier_id),
      status = COALESCE(EXCLUDED.status, labs.user_enrollments.status),
      expires_at = EXCLUDED.expires_at,
      actual_amount = EXCLUDED.actual_amount,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [userId, cohort.rows[0].product_id, pricing_tier_id || null, id, status || 'active', expires_at || null, actual_amount !== undefined && actual_amount !== null ? actual_amount : null]);

  res.json({ message: 'Member enrollment updated', enrollment: enrollment.rows[0] });
}));

router.delete('/:id/members/:userId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;

  // Get cohort with product_id for enrollment deletion
  const cohort = await query('SELECT product_id FROM labs.cohorts WHERE id = $1', [id]);

  // Remove from cohort_members
  const result = await query(`
    UPDATE labs.cohort_members 
    SET left_at = CURRENT_TIMESTAMP 
    WHERE cohort_id = $1 AND user_id = $2 AND left_at IS NULL
    RETURNING id
  `, [id, userId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Member not found in cohort' });
  }

  // Also deactivate enrollment
  if (cohort.rows.length > 0) {
    await query(`
      UPDATE labs.user_enrollments 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE cohort_id = $1 AND user_id = $2
    `, [id, userId]);
  }

  res.json({ message: 'Member removed from cohort successfully' });
}));

// Эндпоинт для загрузки CSV/XLS файла с пользователями
// Copy cohort endpoint
router.post('/:id/copy', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required for the new cohort' });
  }

  // Get original cohort
  const original = await query('SELECT * FROM labs.cohorts WHERE id = $1', [id]);
  if (original.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  const origCohort = original.rows[0];
  const sanitizedName = sanitizeText(name.trim());

  // Create new cohort
  const newCohort = await query(`
    INSERT INTO labs.cohorts (product_id, name, description, start_date, end_date, is_active, max_participants)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    origCohort.product_id,
    sanitizedName,
    origCohort.description,
    origCohort.start_date,
    origCohort.end_date,
    origCohort.is_active,
    origCohort.max_participants
  ]);

  // Copy materials if exist
  const materials = await query('SELECT * FROM labs.materials WHERE cohort_id = $1', [id]);
  let copiedMaterialsCount = 0;

  for (const material of materials.rows) {
    await query(`
      INSERT INTO labs.materials (cohort_id, material_type, material_id, display_order, is_visible)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cohort_id, material_type, material_id) DO NOTHING
    `, [
      newCohort.rows[0].id,
      material.material_type,
      material.material_id,
      material.display_order,
      material.is_visible
    ]);
    copiedMaterialsCount++;
  }

  res.status(201).json({
    message: `Cohort copied successfully${copiedMaterialsCount > 0 ? ` with ${copiedMaterialsCount} materials` : ''}`,
    cohort: newCohort.rows[0],
    copiedMaterials: copiedMaterialsCount
  });
}));

// Get cohort materials
router.get('/:id/materials', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await query(`
    SELECT m.*,
           CASE
             WHEN m.material_type = 'instruction' THEN i.title
             WHEN m.material_type = 'recording' THEN r.title
             WHEN m.material_type = 'news' THEN n.title
             WHEN m.material_type = 'event' THEN e.title
             WHEN m.material_type = 'faq' THEN f.question
           END as title
    FROM labs.materials m
    LEFT JOIN labs.instructions i ON m.material_type = 'instruction' AND m.material_id = i.id
    LEFT JOIN labs.recordings r ON m.material_type = 'recording' AND m.material_id = r.id
    LEFT JOIN labs.news n ON m.material_type = 'news' AND m.material_id = n.id
    LEFT JOIN labs.events e ON m.material_type = 'event' AND m.material_id = e.id
    LEFT JOIN labs.faq f ON m.material_type = 'faq' AND m.material_id = f.id
    WHERE m.cohort_id = $1
    ORDER BY m.material_type, m.display_order, m.created_at
  `, [id]);
  res.json(result.rows);
}));

// Get available materials for assignment
router.get('/:id/available-materials', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get cohort info
  const cohort = await query('SELECT product_id FROM labs.cohorts WHERE id = $1', [id]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  // Get ALL materials from the system for admin to assign
  const [instructions, recordings, news, events, faq] = await Promise.all([
    query('SELECT id, title FROM labs.instructions ORDER BY title'),
    query('SELECT id, title FROM labs.recordings ORDER BY title'),
    query('SELECT id, title FROM labs.news ORDER BY title'),
    query('SELECT id, title FROM labs.events ORDER BY title'),
    query('SELECT id, question as title FROM labs.faq ORDER BY question')
  ]);

  const availableMaterials = {
    instructions: instructions.rows,
    recordings: recordings.rows,
    news: news.rows,
    events: events.rows,
    faq: faq.rows
  };

  res.json(availableMaterials);
}));

// Assign materials to cohort
router.post('/:id/materials', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { material_type, material_ids, is_visible } = req.body;

  if (!material_type || !material_ids || !Array.isArray(material_ids)) {
    return res.status(400).json({ error: 'material_type and material_ids array are required' });
  }

  const cohort = await query('SELECT id FROM labs.cohorts WHERE id = $1', [id]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  const added = [];
  for (const materialId of material_ids) {
    const result = await query(`
      INSERT INTO labs.materials (cohort_id, material_type, material_id, is_visible)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cohort_id, material_type, material_id)
      DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, material_type, materialId, is_visible !== false]);
    added.push(result.rows[0]);
  }

  res.status(201).json({ message: `Assigned ${added.length} materials to cohort`, materials: added });
}));

// Update materials visibility
router.put('/:id/materials/visibility', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { materials } = req.body;

  if (!materials || !Array.isArray(materials)) {
    return res.status(400).json({ error: 'materials array is required with {type, id, visible} objects' });
  }

  const updated = [];
  for (const material of materials) {
    const result = await query(`
      UPDATE labs.materials
      SET is_visible = $1, updated_at = CURRENT_TIMESTAMP
      WHERE cohort_id = $2 AND material_type = $3 AND material_id = $4
      RETURNING *
    `, [material.visible, id, material.type, material.id]);

    if (result.rows.length > 0) {
      updated.push(result.rows[0]);
    }
  }

  res.json({ message: `Updated ${updated.length} materials`, materials: updated });
}));

// Delete material from cohort
router.delete('/:id/materials/:type/:materialId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, type, materialId } = req.params;

  const result = await query(`
    DELETE FROM labs.materials
    WHERE cohort_id = $1 AND material_type = $2 AND material_id = $3
    RETURNING id
  `, [id, type, materialId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Material assignment not found' });
  }

  res.json({ message: 'Material removed from cohort successfully' });
}));

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
        LEFT JOIN labs.pricing_tiers pt ON pt.cohort_id = c.id AND pt.tier_level = 1
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
