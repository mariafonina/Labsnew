import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await query('SELECT * FROM labs.news ORDER BY created_at DESC');
  res.json(result.rows);
}));

export default router;
