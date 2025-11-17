import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Получаем общее количество записей
  const countResult = await query('SELECT COUNT(*) as total FROM labs.news');
  const total = parseInt(countResult.rows[0].total);

  // Получаем записи с пагинацией
  const result = await query(
    'SELECT * FROM labs.news ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

export default router;
