import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/products', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(`
    SELECT 
      id,
      name,
      description,
      type,
      duration_weeks,
      default_price,
      created_at
    FROM labs.products
    WHERE is_active = TRUE
    ORDER BY created_at DESC
  `);

  res.json(result.rows);
}));

router.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const productResult = await query(`
    SELECT 
      id,
      name,
      description,
      type,
      duration_weeks,
      default_price,
      created_at
    FROM labs.products
    WHERE id = $1 AND is_active = TRUE
  `, [id]);

  if (productResult.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const tiersResult = await query(`
    SELECT 
      id,
      name,
      description,
      price,
      tier_level,
      features
    FROM labs.pricing_tiers
    WHERE product_id = $1 AND is_active = TRUE
    ORDER BY tier_level ASC
  `, [id]);

  const cohortsResult = await query(`
    SELECT 
      id,
      name,
      description,
      start_date,
      end_date,
      max_participants,
      (SELECT COUNT(*) FROM labs.cohort_members WHERE cohort_id = cohorts.id AND left_at IS NULL) as current_participants
    FROM labs.cohorts
    WHERE product_id = $1 AND is_active = TRUE
    ORDER BY start_date ASC
  `, [id]);

  res.json({
    ...productResult.rows[0],
    tiers: tiersResult.rows,
    cohorts: cohortsResult.rows
  });
}));

export default router;
