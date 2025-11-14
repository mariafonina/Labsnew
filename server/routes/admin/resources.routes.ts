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
  const { resource_type, resource_id, min_tier_level } = req.body;

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

  const result = await query(`
    INSERT INTO labs.product_resources (product_id, resource_type, resource_id, min_tier_level)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (product_id, resource_type, resource_id) 
    DO UPDATE SET min_tier_level = EXCLUDED.min_tier_level
    RETURNING *
  `, [productId, resource_type, resource_id, min_tier_level || 1]);

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
    const result = await query(`
      INSERT INTO labs.product_resources (product_id, resource_type, resource_id, min_tier_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, resource_type, resource_id) 
      DO UPDATE SET min_tier_level = EXCLUDED.min_tier_level
      RETURNING *
    `, [productId, resource.resource_type, resource.resource_id, resource.min_tier_level || 1]);
    added.push(result.rows[0]);
  }

  res.status(201).json({ message: `Added ${added.length} resources to product`, resources: added });
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
