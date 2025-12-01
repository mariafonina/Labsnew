import { Router, Response } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { asyncHandler } from '../utils/async-handler';
import { deleteOneOrFail } from '../utils/db-helpers';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Получаем все события
  const result = await query(`
    SELECT * FROM labs.events
    ORDER BY event_date ASC, event_time ASC
  `);
  console.log(`[EVENTS] Total events in DB:`, result.rows.length);

  let allEvents: any[];

  // Если админ с полным доступом - показываем все
  if (req.forceFullAccess) {
    console.log(`[EVENTS] Admin full preview mode - showing all events`);
    allEvents = result.rows;
  } else {
    // Получаем cohort_ids пользователя для обратной совместимости
    const userCohorts = await query(`
      SELECT cohort_id FROM labs.user_enrollments
      WHERE user_id = $1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [req.userId]);

    const cohortIds = userCohorts.rows.map(r => r.cohort_id).filter(id => id !== null);
    console.log(`[EVENTS] User ${req.userId} cohorts:`, cohortIds);

    // Фильтруем по доступу через product_resources (новая система)
    const { filterResourcesByAccess } = await import('../utils/access-control');
    const filteredByProductResources = await filterResourcesByAccess(
      req.userId!,
      'event',
      result.rows
    );
    console.log(`[EVENTS] Filtered by product_resources:`, filteredByProductResources.length);

    // Обратная совместимость: добавляем события с cohort_id (старая система)
    const eventsWithCohortId = result.rows.filter((item: any) =>
      item.cohort_id && cohortIds.includes(item.cohort_id)
    );
    console.log(`[EVENTS] Events with cohort_id:`, eventsWithCohortId.length);

    // Объединяем результаты (убираем дубликаты по id)
    allEvents = [...filteredByProductResources];
    const existingIds = new Set(allEvents.map(e => e.id));

    for (const event of eventsWithCohortId) {
      if (!existingIds.has(event.id)) {
        allEvents.push(event);
        existingIds.add(event.id);
      }
    }

    console.log(`[EVENTS] Total accessible events for user ${req.userId}:`, allEvents.length);
  }

  // Сортируем по дате
  allEvents.sort((a, b) => {
    const dateA = new Date(a.event_date + ' ' + (a.event_time || '00:00'));
    const dateB = new Date(b.event_date + ' ' + (b.event_time || '00:00'));
    return dateA.getTime() - dateB.getTime();
  });

  res.json(allEvents);
}));

router.get('/my', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT * FROM labs.events WHERE user_id = $1 ORDER BY event_date ASC, event_time ASC',
    [req.userId]
  );
  res.json(result.rows);
}));

router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, event_date, event_time, location } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event date are required' });
  }

  const result = await query(
    'INSERT INTO labs.events (user_id, title, description, event_date, event_time, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [req.userId, title, description, event_date, event_time, location]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, event_date, event_time, location } = req.body;

  const result = await query(
    'UPDATE labs.events SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *',
    [title, description, event_date, event_time, location, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await deleteOneOrFail('events', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Event deleted successfully' });
}));

export default router;
