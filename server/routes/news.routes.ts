import { Router } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// Public endpoint - get all news items (no authentication required)
router.get('/', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM labs.news ORDER BY created_at DESC');
  res.json(result.rows);
}));

export default router;
