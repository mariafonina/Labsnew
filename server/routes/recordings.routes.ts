import { Router, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { verifyToken, AuthRequest } from '../auth';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Получаем общее количество записей
  const countResult = await query('SELECT COUNT(*) as total FROM labs.recordings');
  const total = parseInt(countResult.rows[0].total);

  // Получаем записи с пагинацией
  const result = await query(
    'SELECT * FROM labs.recordings ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  
  const filteredRecordings = await filterResourcesByAccess(
    req.userId!,
    'recording',
    result.rows
  );
  
  res.json({
    data: filteredRecordings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.post('/:id/view', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  await query(`
    INSERT INTO labs.recording_views (user_id, recording_id, viewed_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, recording_id) 
    DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
  `, [userId, id]);

  res.json({ success: true });
}));

export default router;
