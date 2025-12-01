import { Router, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { verifyToken, AuthRequest } from '../auth';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

// Debug endpoint
router.get('/debug', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userCohorts = await query(`
    SELECT ue.cohort_id, c.name as cohort_name
    FROM labs.user_enrollments ue
    LEFT JOIN labs.cohorts c ON ue.cohort_id = c.id
    WHERE ue.user_id = $1 AND ue.status = 'active'
    AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  `, [req.userId]);

  const allNews = await query(`SELECT id, title, cohort_id FROM labs.news ORDER BY created_at DESC`);

  const newsInProductResources = await query(`
    SELECT pr.resource_id, pr.cohort_ids, pr.tier_ids
    FROM labs.product_resources pr
    WHERE pr.resource_type = 'news'
  `);

  res.json({
    userId: req.userId,
    userCohorts: userCohorts.rows,
    allNews: allNews.rows,
    newsInProductResources: newsInProductResources.rows
  });
}));

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Получаем все новости
  const result = await query(`
    SELECT * FROM labs.news
    ORDER BY created_at DESC
  `);
  console.log(`[NEWS] Total news in DB:`, result.rows.length);

  let allNews: any[];

  // Если админ с полным доступом - показываем все
  if (req.forceFullAccess) {
    console.log(`[NEWS] Admin full preview mode - showing all news`);
    allNews = result.rows;
  } else {
    // Получаем cohort_ids пользователя для обратной совместимости
    const userCohorts = await query(`
      SELECT cohort_id FROM labs.user_enrollments
      WHERE user_id = $1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [req.userId]);

    const cohortIds = userCohorts.rows.map(r => r.cohort_id).filter(id => id !== null);
    console.log(`[NEWS] User ${req.userId} cohorts:`, cohortIds);

    // Фильтруем по доступу через product_resources (новая система)
    const filteredByProductResources = await filterResourcesByAccess(
      req.userId!,
      'news',
      result.rows
    );
    console.log(`[NEWS] Filtered by product_resources:`, filteredByProductResources.length);

    // Обратная совместимость: добавляем новости с cohort_id (старая система)
    const newsWithCohortId = result.rows.filter((item: any) =>
      item.cohort_id && cohortIds.includes(item.cohort_id)
    );
    console.log(`[NEWS] News with cohort_id:`, newsWithCohortId.length);

    // Объединяем результаты (убираем дубликаты по id)
    allNews = [...filteredByProductResources];
    const existingIds = new Set(allNews.map(n => n.id));

    for (const news of newsWithCohortId) {
      if (!existingIds.has(news.id)) {
        allNews.push(news);
        existingIds.add(news.id);
      }
    }

    console.log(`[NEWS] Total accessible news for user ${req.userId}:`, allNews.length);
  }

  // Сортируем по дате
  allNews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Применяем пагинацию к отфильтрованным данным
  const total = allNews.length;
  const offset = (page - 1) * limit;
  const paginatedNews = allNews.slice(offset, offset + limit);

  res.json({
    data: paginatedNews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

export default router;
