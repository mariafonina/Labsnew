import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user_id, product_id, status } = req.query;

  let queryText = `
    SELECT ue.*, 
           u.username, u.email, u.first_name, u.last_name,
           p.name as product_name, p.type as product_type,
           pt.name as tier_name, pt.tier_level, pt.price as tier_price,
           c.name as cohort_name
    FROM labs.user_enrollments ue
    JOIN labs.users u ON ue.user_id = u.id
    JOIN labs.products p ON ue.product_id = p.id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    LEFT JOIN labs.cohorts c ON ue.cohort_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (user_id) {
    queryText += ` AND ue.user_id = $${paramIndex++}`;
    params.push(user_id);
  }

  if (product_id) {
    queryText += ` AND ue.product_id = $${paramIndex++}`;
    params.push(product_id);
  }

  if (status) {
    queryText += ` AND ue.status = $${paramIndex++}`;
    params.push(status);
  }

  queryText += ' ORDER BY ue.created_at DESC';

  const result = await query(queryText, params);
  res.json(result.rows);
}));

router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user_id, product_id, pricing_tier_id, cohort_id, status, expires_at, actual_amount } = req.body;

  if (!user_id || !product_id || !pricing_tier_id) {
    return res.status(400).json({ error: 'user_id, product_id, and pricing_tier_id are required' });
  }

  const product = await query('SELECT id FROM labs.products WHERE id = $1', [product_id]);
  if (product.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (cohort_id) {
    const cohort = await query('SELECT id FROM labs.cohorts WHERE id = $1 AND product_id = $2', [cohort_id, product_id]);
    if (cohort.rows.length === 0) {
      return res.status(404).json({ error: 'Cohort not found for this product' });
    }

    const tier = await query('SELECT id FROM labs.pricing_tiers WHERE id = $1 AND cohort_id = $2', [pricing_tier_id, cohort_id]);
    if (tier.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing tier not found for this cohort' });
    }

    const memberExists = await query(`
      SELECT id FROM labs.cohort_members
      WHERE cohort_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [cohort_id, user_id]);

    if (memberExists.rows.length === 0) {
      await query(`
        INSERT INTO labs.cohort_members (cohort_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, user_id) DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP
      `, [cohort_id, user_id]);
    }
  } else {
    return res.status(400).json({ error: 'cohort_id is required' });
  }

  const result = await query(`
    INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status, expires_at, actual_amount)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, product_id, cohort_id) 
    DO UPDATE SET 
      pricing_tier_id = EXCLUDED.pricing_tier_id,
      status = EXCLUDED.status,
      expires_at = EXCLUDED.expires_at,
      actual_amount = EXCLUDED.actual_amount,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [user_id, product_id, pricing_tier_id, cohort_id || null, status || 'active', expires_at || null, actual_amount !== undefined ? actual_amount : null]);

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { pricing_tier_id, status, expires_at, actual_amount } = req.body;

  const existingEnrollment = await query('SELECT id, product_id, cohort_id FROM labs.user_enrollments WHERE id = $1', [id]);
  if (existingEnrollment.rows.length === 0) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  if (pricing_tier_id) {
    if (!existingEnrollment.rows[0].cohort_id) {
      return res.status(400).json({ error: 'Cannot update tier: enrollment has no cohort' });
    }

    const tier = await query('SELECT id FROM labs.pricing_tiers WHERE id = $1 AND cohort_id = $2',
      [pricing_tier_id, existingEnrollment.rows[0].cohort_id]);
    if (tier.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing tier not found for this cohort' });
    }
  }

  let updateQuery = 'UPDATE labs.user_enrollments SET updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [];
  let paramIndex = 1;

  if (pricing_tier_id !== undefined) {
    params.push(pricing_tier_id);
    updateQuery += `, pricing_tier_id = $${paramIndex++}`;
  }

  if (status !== undefined) {
    params.push(status);
    updateQuery += `, status = $${paramIndex++}`;
  }

  if (expires_at !== undefined) {
    params.push(expires_at || null);
    updateQuery += `, expires_at = $${paramIndex++}`;
  }

  if (actual_amount !== undefined) {
    params.push(actual_amount !== null && actual_amount !== '' ? actual_amount : null);
    updateQuery += `, actual_amount = $${paramIndex++}`;
  }

  params.push(id);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);
  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM labs.user_enrollments WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  res.json({ message: 'Enrollment deleted successfully' });
}));

export default router;
