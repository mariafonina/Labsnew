import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

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

export default router;
