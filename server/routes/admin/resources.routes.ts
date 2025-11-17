import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

router.get('/:productId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { resource_type } = req.query;

  let queryText = `
    SELECT pr.*, pt.name as min_tier_name
    FROM labs.product_resources pr
    LEFT JOIN labs.pricing_tiers pt ON pr.product_id = pt.product_id AND pr.min_tier_level = pt.tier_level
    WHERE pr.product_id = $1
  `;
  const params: any[] = [productId];
  let paramIndex = 2;

  if (resource_type) {
    queryText += ` AND pr.resource_type = $${paramIndex++}`;
    params.push(resource_type);
  }

  queryText += ' ORDER BY pr.resource_type, pr.resource_id';

  const result = await query(queryText, params);
  res.json(result.rows);
}));

router.post('/:productId', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { resource_type, resource_id, min_tier_level, cohort_ids, tier_ids } = req.body;

  if (!resource_type || !resource_id) {
    return res.status(400).json({ error: 'resource_type and resource_id are required' });
  }

  const validTypes = ['instruction', 'recording', 'news', 'event', 'faq'];
  if (!validTypes.includes(resource_type)) {
    return res.status(400).json({ error: `Invalid resource_type. Must be one of: ${validTypes.join(', ')}` });
  }

  const product = await query('SELECT id FROM labs.products WHERE id = $1', [productId]);
  if (product.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Валидация cohort_ids и tier_ids
  let cohortIdsJson = null;
  if (cohort_ids && Array.isArray(cohort_ids)) {
    cohortIdsJson = JSON.stringify(cohort_ids);
  }

  let tierIdsJson = null;
  if (tier_ids && Array.isArray(tier_ids)) {
    tierIdsJson = JSON.stringify(tier_ids);
  }

  const result = await query(`
    INSERT INTO labs.product_resources (product_id, resource_type, resource_id, min_tier_level, cohort_ids, tier_ids)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (product_id, resource_type, resource_id) 
    DO UPDATE SET 
      min_tier_level = EXCLUDED.min_tier_level,
      cohort_ids = EXCLUDED.cohort_ids,
      tier_ids = EXCLUDED.tier_ids
    RETURNING *
  `, [
    productId, 
    resource_type, 
    resource_id, 
    min_tier_level || 1,
    cohortIdsJson,
    tierIdsJson
  ]);

  res.status(201).json(result.rows[0]);
}));

router.post('/:productId/batch', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { resources } = req.body;

  if (!resources || !Array.isArray(resources) || resources.length === 0) {
    return res.status(400).json({ error: 'resources array is required' });
  }

  const product = await query('SELECT id FROM labs.products WHERE id = $1', [productId]);
  if (product.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const validTypes = ['instruction', 'recording', 'news', 'event', 'faq'];
  for (const resource of resources) {
    if (!validTypes.includes(resource.resource_type)) {
      return res.status(400).json({ 
        error: `Invalid resource_type: ${resource.resource_type}. Must be one of: ${validTypes.join(', ')}` 
      });
    }
  }

  const added = [];
  for (const resource of resources) {
    let cohortIdsJson = null;
    if (resource.cohort_ids && Array.isArray(resource.cohort_ids)) {
      cohortIdsJson = JSON.stringify(resource.cohort_ids);
    }

    let tierIdsJson = null;
    if (resource.tier_ids && Array.isArray(resource.tier_ids)) {
      tierIdsJson = JSON.stringify(resource.tier_ids);
    }

    const result = await query(`
      INSERT INTO labs.product_resources (product_id, resource_type, resource_id, min_tier_level, cohort_ids, tier_ids)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (product_id, resource_type, resource_id) 
      DO UPDATE SET 
        min_tier_level = EXCLUDED.min_tier_level,
        cohort_ids = EXCLUDED.cohort_ids,
        tier_ids = EXCLUDED.tier_ids
      RETURNING *
    `, [
      productId, 
      resource.resource_type, 
      resource.resource_id, 
      resource.min_tier_level || 1,
      cohortIdsJson,
      tierIdsJson
    ]);
    added.push(result.rows[0]);
  }

  res.status(201).json({ message: `Added ${added.length} resources to product`, resources: added });
}));

router.put('/:productId/:resourceId', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, resourceId } = req.params;
  const { min_tier_level, cohort_ids, tier_ids } = req.body;

  let updateQuery = 'UPDATE labs.product_resources SET';
  const params: any[] = [];
  let paramIndex = 1;
  let hasUpdates = false;

  if (min_tier_level !== undefined) {
    updateQuery += ` min_tier_level = $${paramIndex++}`;
    params.push(min_tier_level);
    hasUpdates = true;
  }

  if (cohort_ids !== undefined) {
    if (hasUpdates) updateQuery += ',';
    const cohortIdsJson = Array.isArray(cohort_ids) ? JSON.stringify(cohort_ids) : null;
    updateQuery += ` cohort_ids = $${paramIndex++}`;
    params.push(cohortIdsJson);
    hasUpdates = true;
  }

  if (tier_ids !== undefined) {
    if (hasUpdates) updateQuery += ',';
    const tierIdsJson = Array.isArray(tier_ids) ? JSON.stringify(tier_ids) : null;
    updateQuery += ` tier_ids = $${paramIndex++}`;
    params.push(tierIdsJson);
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(resourceId, productId);
  updateQuery += ` WHERE id = $${paramIndex++} AND product_id = $${paramIndex} RETURNING *`;

  const result = await query(updateQuery, params);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:productId/:resourceId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, resourceId } = req.params;

  const result = await query(`
    DELETE FROM labs.product_resources 
    WHERE id = $1 AND product_id = $2
    RETURNING id
  `, [resourceId, productId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  res.json({ message: 'Resource removed from product successfully' });
}));

export default router;
