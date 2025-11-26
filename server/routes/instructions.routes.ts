import { Router, Response } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { sanitizeHtml } from '../utils/sanitize';
import { asyncHandler } from '../utils/async-handler';
import { findOneOrFail, deleteOneOrFail } from '../utils/db-helpers';
import { validateAndNormalizeLoomUrl } from '../utils/loom-validator';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, category_id, search } = req.query;

  // Получаем cohort_ids пользователя для обратной совместимости
  const userCohorts = await query(`
    SELECT cohort_id FROM labs.user_enrollments
    WHERE user_id = $1 AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  `, [req.userId]);

  const cohortIds = userCohorts.rows.map(r => r.cohort_id).filter(id => id !== null);
  console.log(`[INSTRUCTIONS] User ${req.userId} cohorts:`, cohortIds);

  let queryText = 'SELECT * FROM labs.instructions';
  const params: any[] = [];
  let paramIndex = 1;
  const whereClauses: string[] = [];

  if (category_id) {
    whereClauses.push(`category_id = $${paramIndex++}`);
    params.push(category_id);
  } else if (category) {
    whereClauses.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  if (search) {
    whereClauses.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (whereClauses.length > 0) {
    queryText += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryText += ' ORDER BY category_id NULLS LAST, display_order ASC, created_at DESC';

  const result = await query(queryText, params);
  console.log(`[INSTRUCTIONS] Total instructions in DB:`, result.rows.length);
  console.log(`[INSTRUCTIONS] Sample instructions:`, result.rows.map((i: any) => ({ id: i.id, title: i.title, cohort_id: i.cohort_id })));

  // Фильтруем по доступу через product_resources (новая система)
  const filteredByProductResources = await filterResourcesByAccess(
    req.userId!,
    'instruction',
    result.rows
  );
  console.log(`[INSTRUCTIONS] Filtered by product_resources:`, filteredByProductResources.length);

  // Обратная совместимость: добавляем инструкции с cohort_id (старая система)
  const instructionsWithCohortId = result.rows.filter((item: any) =>
    item.cohort_id && cohortIds.includes(item.cohort_id)
  );
  console.log(`[INSTRUCTIONS] Instructions with cohort_id:`, instructionsWithCohortId.length);

  // Объединяем результаты (убираем дубликаты по id)
  const allInstructions = [...filteredByProductResources];
  const existingIds = new Set(allInstructions.map(i => i.id));

  for (const instruction of instructionsWithCohortId) {
    if (!existingIds.has(instruction.id)) {
      allInstructions.push(instruction);
      existingIds.add(instruction.id);
    }
  }

  console.log(`[INSTRUCTIONS] Total accessible instructions for user ${req.userId}:`, allInstructions.length);

  // Сортируем
  allInstructions.sort((a, b) => {
    if (a.category_id !== b.category_id) {
      if (a.category_id === null) return 1;
      if (b.category_id === null) return -1;
      return a.category_id - b.category_id;
    }
    if (a.display_order !== b.display_order) {
      return (a.display_order || 999) - (b.display_order || 999);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  res.json(allInstructions);
}));

router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Получаем инструкцию
  const result = await query(`
    SELECT * FROM labs.instructions
    WHERE id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Instruction not found' });
  }

  // Проверяем доступ через product_resources
  const filteredInstructions = await filterResourcesByAccess(
    req.userId!,
    'instruction',
    result.rows
  );

  if (filteredInstructions.length === 0) {
    return res.status(403).json({ error: 'Access denied to this instruction' });
  }

  res.json(filteredInstructions[0]);
}));

router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, content, category, category_id, tags, image_url, loom_embed_url, display_order } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const sanitizedContent = sanitizeHtml(content);
  const validatedLoomUrl = validateAndNormalizeLoomUrl(loom_embed_url);

  // Get max order for category if display_order not provided
  let order = display_order;
  if (order === undefined && category_id) {
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM labs.instructions WHERE category_id = $1',
      [category_id]
    );
    order = maxOrderResult.rows[0].max_order + 1;
  } else if (order === undefined) {
    order = 0;
  }

  const result = await query(
    'INSERT INTO labs.instructions (user_id, title, content, category, category_id, tags, image_url, loom_embed_url, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [req.userId, title, sanitizedContent, category, category_id || null, tags, image_url, validatedLoomUrl, order]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, category, category_id, tags, image_url, loom_embed_url, display_order } = req.body;

  const sanitizedContent = content !== undefined ? sanitizeHtml(content) : undefined;
  const validatedLoomUrl = loom_embed_url !== undefined ? validateAndNormalizeLoomUrl(loom_embed_url) : undefined;

  const updateParts = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updateParts.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (sanitizedContent !== undefined) {
    updateParts.push(`content = $${paramIndex++}`);
    values.push(sanitizedContent);
  }
  if (category !== undefined) {
    updateParts.push(`category = $${paramIndex++}`);
    values.push(category);
  }
  if (category_id !== undefined) {
    updateParts.push(`category_id = $${paramIndex++}`);
    values.push(category_id);
  }
  if (tags !== undefined) {
    updateParts.push(`tags = $${paramIndex++}`);
    values.push(tags);
  }
  if (image_url !== undefined) {
    updateParts.push(`image_url = $${paramIndex++}`);
    values.push(image_url);
  }
  if (validatedLoomUrl !== undefined) {
    updateParts.push(`loom_embed_url = $${paramIndex++}`);
    values.push(validatedLoomUrl);
  }
  if (display_order !== undefined) {
    updateParts.push(`display_order = $${paramIndex++}`);
    values.push(display_order);
  }

  if (updateParts.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateParts.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  values.push(req.userId);

  const result = await query(
    `UPDATE labs.instructions SET ${updateParts.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Instruction not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await deleteOneOrFail('instructions', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Instruction deleted successfully' });
}));

export default router;
