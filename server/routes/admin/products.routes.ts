import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(`
    SELECT p.*, 
           COUNT(DISTINCT pt.id) as tier_count,
           COUNT(DISTINCT c.id) as cohort_count,
           COUNT(DISTINCT ue.id) as enrollment_count
    FROM labs.products p
    LEFT JOIN labs.pricing_tiers pt ON p.id = pt.product_id AND pt.is_active = TRUE
    LEFT JOIN labs.cohorts c ON p.id = c.product_id AND c.is_active = TRUE
    LEFT JOIN labs.user_enrollments ue ON p.id = ue.product_id AND ue.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
}));

router.get('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM labs.products WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(result.rows[0]);
}));

router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, type, status, duration_weeks, default_price, project_start_date, project_end_date, is_active } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const sanitizedName = sanitizeText(name.trim());
  const sanitizedDescription = description ? sanitizeText(description.trim()) : null;
  const sanitizedType = sanitizeText(type.trim());
  const sanitizedStatus = status || 'not_for_sale';

  const result = await query(`
    INSERT INTO labs.products (name, description, type, status, duration_weeks, default_price, project_start_date, project_end_date, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    sanitizedName, 
    sanitizedDescription, 
    sanitizedType, 
    sanitizedStatus,
    duration_weeks || null, 
    default_price || null, 
    project_start_date || null,
    project_end_date || null,
    is_active !== false
  ]);

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, type, status, duration_weeks, default_price, project_start_date, project_end_date, is_active } = req.body;

  const existingProduct = await query('SELECT id FROM labs.products WHERE id = $1', [id]);
  if (existingProduct.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  let updateQuery = 'UPDATE labs.products SET updated_at = CURRENT_TIMESTAMP';
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

  if (type !== undefined) {
    const sanitizedType = sanitizeText(type.trim());
    params.push(sanitizedType);
    updateQuery += `, type = $${paramIndex++}`;
  }

  if (status !== undefined) {
    params.push(status);
    updateQuery += `, status = $${paramIndex++}`;
  }

  if (duration_weeks !== undefined) {
    params.push(duration_weeks || null);
    updateQuery += `, duration_weeks = $${paramIndex++}`;
  }

  if (default_price !== undefined) {
    params.push(default_price || null);
    updateQuery += `, default_price = $${paramIndex++}`;
  }

  if (project_start_date !== undefined) {
    params.push(project_start_date || null);
    updateQuery += `, project_start_date = $${paramIndex++}`;
  }

  if (project_end_date !== undefined) {
    params.push(project_end_date || null);
    updateQuery += `, project_end_date = $${paramIndex++}`;
  }

  if (is_active !== undefined) {
    params.push(is_active);
    updateQuery += `, is_active = $${paramIndex++}`;
  }

  params.push(id);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);
  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM labs.products WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ message: 'Product deleted successfully' });
}));

// Cohort-specific tier routes
router.get('/:productId/cohorts/:cohortId/tiers', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const result = await query(`
    SELECT * FROM labs.pricing_tiers
    WHERE cohort_id = $1
    ORDER BY tier_level ASC
  `, [cohortId]);
  res.json(result.rows);
}));

router.post('/:productId/cohorts/:cohortId/tiers', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, cohortId } = req.params;
  const { name, description, price, tier_level, features, access_start_date, access_end_date, is_active } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const sanitizedName = sanitizeText(name.trim());
  const sanitizedDescription = description ? sanitizeText(description.trim()) : null;

  const result = await query(`
    INSERT INTO labs.pricing_tiers (product_id, cohort_id, name, description, price, tier_level, features, access_start_date, access_end_date, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    productId,
    cohortId,
    sanitizedName,
    sanitizedDescription,
    price,
    tier_level || null,
    features ? JSON.stringify(features) : null,
    access_start_date || null,
    access_end_date || null,
    is_active !== false
  ]);

  res.status(201).json(result.rows[0]);
}));

// Backward compatibility: old product-level tier routes (deprecated)
router.get('/:id/tiers', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await query(`
    SELECT * FROM labs.pricing_tiers
    WHERE product_id = $1
    ORDER BY tier_level ASC
  `, [id]);
  res.json(result.rows);
}));

router.post('/:id/tiers', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, tier_level, features, access_start_date, access_end_date, is_active } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const sanitizedName = sanitizeText(name.trim());
  const sanitizedDescription = description ? sanitizeText(description.trim()) : null;

  const result = await query(`
    INSERT INTO labs.pricing_tiers (product_id, name, description, price, tier_level, features, access_start_date, access_end_date, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    id,
    sanitizedName,
    sanitizedDescription,
    price,
    tier_level || null,
    features ? JSON.stringify(features) : null,
    access_start_date || null,
    access_end_date || null,
    is_active !== false
  ]);

  res.status(201).json(result.rows[0]);
}));

// Cohort-specific tier UPDATE route
router.put('/:productId/cohorts/:cohortId/tiers/:tierId', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, tierId } = req.params;
  const { name, description, price, tier_level, features, access_start_date, access_end_date, is_active } = req.body;

  let updateQuery = 'UPDATE labs.pricing_tiers SET updated_at = CURRENT_TIMESTAMP';
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

  if (price !== undefined) {
    params.push(price);
    updateQuery += `, price = $${paramIndex++}`;
  }

  if (tier_level !== undefined) {
    params.push(tier_level);
    updateQuery += `, tier_level = $${paramIndex++}`;
  }

  if (features !== undefined) {
    params.push(features ? JSON.stringify(features) : null);
    updateQuery += `, features = $${paramIndex++}`;
  }

  if (access_start_date !== undefined) {
    params.push(access_start_date || null);
    updateQuery += `, access_start_date = $${paramIndex++}`;
  }

  if (access_end_date !== undefined) {
    params.push(access_end_date || null);
    updateQuery += `, access_end_date = $${paramIndex++}`;
  }

  if (is_active !== undefined) {
    params.push(is_active);
    updateQuery += `, is_active = $${paramIndex++}`;
  }

  params.push(tierId, cohortId);
  updateQuery += ` WHERE id = $${paramIndex++} AND cohort_id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pricing tier not found' });
  }

  res.json(result.rows[0]);
}));

// Backward compatibility: old product-level tier UPDATE route (deprecated)
router.put('/:productId/tiers/:tierId', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, tierId } = req.params;
  const { name, description, price, tier_level, features, access_start_date, access_end_date, is_active } = req.body;

  let updateQuery = 'UPDATE labs.pricing_tiers SET updated_at = CURRENT_TIMESTAMP';
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

  if (price !== undefined) {
    params.push(price);
    updateQuery += `, price = $${paramIndex++}`;
  }

  if (tier_level !== undefined) {
    params.push(tier_level);
    updateQuery += `, tier_level = $${paramIndex++}`;
  }

  if (features !== undefined) {
    params.push(features ? JSON.stringify(features) : null);
    updateQuery += `, features = $${paramIndex++}`;
  }

  if (access_start_date !== undefined) {
    params.push(access_start_date || null);
    updateQuery += `, access_start_date = $${paramIndex++}`;
  }

  if (access_end_date !== undefined) {
    params.push(access_end_date || null);
    updateQuery += `, access_end_date = $${paramIndex++}`;
  }

  if (is_active !== undefined) {
    params.push(is_active);
    updateQuery += `, is_active = $${paramIndex++}`;
  }

  params.push(tierId, productId);
  updateQuery += ` WHERE id = $${paramIndex++} AND product_id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pricing tier not found' });
  }

  res.json(result.rows[0]);
}));

// Cohort-specific tier DELETE route
router.delete('/:productId/cohorts/:cohortId/tiers/:tierId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, tierId } = req.params;

  const result = await query(`
    DELETE FROM labs.pricing_tiers
    WHERE id = $1 AND cohort_id = $2
    RETURNING id
  `, [tierId, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pricing tier not found' });
  }

  res.json({ message: 'Pricing tier deleted successfully' });
}));

// Backward compatibility: old product-level tier DELETE route (deprecated)
router.delete('/:productId/tiers/:tierId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, tierId } = req.params;

  const result = await query(`
    DELETE FROM labs.pricing_tiers
    WHERE id = $1 AND product_id = $2
    RETURNING id
  `, [tierId, productId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pricing tier not found' });
  }

  res.json({ message: 'Pricing tier deleted successfully' });
}));

export default router;
