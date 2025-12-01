import { Router, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { verifyToken, AuthRequest } from '../auth';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Получаем все FAQ
  const result = await query(`
    SELECT * FROM labs.faq
    ORDER BY category, created_at DESC
  `);

  let allFaq: any[];

  // Если админ с полным доступом - показываем все
  if (req.forceFullAccess) {
    console.log(`[FAQ] Admin full preview mode - showing all FAQs`);
    allFaq = result.rows;
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
      'faq',
      result.rows
    );

    // Обратная совместимость: добавляем FAQ с cohort_id (старая система)
    const faqWithCohortId = result.rows.filter((item: any) =>
      item.cohort_id && cohortIds.includes(item.cohort_id)
    );

    // Объединяем результаты (убираем дубликаты по id)
    allFaq = [...filteredByProductResources];
    const existingIds = new Set(allFaq.map(f => f.id));

    for (const faq of faqWithCohortId) {
      if (!existingIds.has(faq.id)) {
        allFaq.push(faq);
        existingIds.add(faq.id);
      }
    }
  }

  // Сортируем
  allFaq.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  res.json(allFaq);
}));

export default router;
