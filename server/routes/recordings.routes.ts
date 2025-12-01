import { Router, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { verifyToken, AuthRequest } from '../auth';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Получаем все записи
  const result = await query(`
    SELECT * FROM labs.recordings
    ORDER BY created_at DESC
  `);

  let allRecordings: any[];

  // Если админ с полным доступом - показываем все
  if (req.forceFullAccess) {
    console.log(`[RECORDINGS] Admin full preview mode - showing all recordings`);
    allRecordings = result.rows;
  } else {
    // Получаем cohort_ids пользователя для обратной совместимости
    const userCohorts = await query(`
      SELECT cohort_id FROM labs.user_enrollments
      WHERE user_id = $1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [req.userId]);

    const cohortIds = userCohorts.rows.map(r => r.cohort_id).filter(id => id !== null);

    // Фильтруем по доступу через product_resources (новая система)
    const filteredByProductResources = await filterResourcesByAccess(
      req.userId!,
      'recording',
      result.rows
    );

    // Обратная совместимость: добавляем записи с cohort_id (старая система)
    const recordingsWithCohortId = result.rows.filter((item: any) =>
      item.cohort_id && cohortIds.includes(item.cohort_id)
    );

    // Объединяем результаты (убираем дубликаты по id)
    allRecordings = [...filteredByProductResources];
    const existingIds = new Set(allRecordings.map(r => r.id));

    for (const recording of recordingsWithCohortId) {
      if (!existingIds.has(recording.id)) {
        allRecordings.push(recording);
        existingIds.add(recording.id);
      }
    }
  }

  // Сортируем по дате
  allRecordings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Применяем пагинацию к отфильтрованным данным
  const total = allRecordings.length;
  const offset = (page - 1) * limit;
  const paginatedRecordings = allRecordings.slice(offset, offset + limit);

  res.json({
    data: paginatedRecordings,
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
