import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

// Get all materials for a cohort (grouped by type)
router.get('/:cohortId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;

  // Verify cohort exists
  const cohort = await query('SELECT id FROM labs.cohorts WHERE id = $1', [cohortId]);
  if (cohort.rows.length === 0) {
    return res.status(404).json({ error: 'Cohort not found' });
  }

  // Fetch all materials for this cohort
  const [instructions, recordings, news, events, faq, categories] = await Promise.all([
    query(`
      SELECT i.*, c.name as category_name
      FROM labs.instructions i
      LEFT JOIN labs.cohort_knowledge_categories c ON i.cohort_category_id = c.id
      WHERE i.cohort_id = $1
      ORDER BY c.display_order ASC, i.display_order ASC, i.created_at DESC
    `, [cohortId]),
    query('SELECT * FROM labs.recordings WHERE cohort_id = $1 ORDER BY created_at DESC', [cohortId]),
    query('SELECT * FROM labs.news WHERE cohort_id = $1 ORDER BY created_at DESC', [cohortId]),
    query('SELECT * FROM labs.events WHERE cohort_id = $1 ORDER BY event_date DESC, event_time DESC', [cohortId]),
    query('SELECT * FROM labs.faq WHERE cohort_id = $1 ORDER BY created_at DESC', [cohortId]),
    query('SELECT * FROM labs.cohort_knowledge_categories WHERE cohort_id = $1 ORDER BY display_order ASC', [cohortId])
  ]);

  const response = {
    instructions: instructions.rows,
    recordings: recordings.rows,
    news: news.rows,
    schedule: events.rows,
    faqs: faq.rows,
    categories: categories.rows
  };

  console.log(`[GET cohort-materials] Cohort ${cohortId}:`, {
    categories: response.categories.length,
    instructions: response.instructions.length
  });

  res.json(response);
}));

// Create instruction for cohort
router.post('/:cohortId/instructions', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { title, content, category, cohort_category_id, description, loom_embed_url, downloadUrl } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Get max display_order for this category
  const maxOrderResult = await query(
    'SELECT COALESCE(MAX(display_order), -1) as max_order FROM labs.instructions WHERE cohort_id = $1 AND cohort_category_id = $2',
    [cohortId, cohort_category_id || null]
  );
  const maxOrder = maxOrderResult.rows[0].max_order;

  const result = await query(`
    INSERT INTO labs.instructions (
      cohort_id, cohort_category_id, title, content, category, user_id,
      display_order, loom_embed_url, image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    cohortId,
    cohort_category_id || null,
    sanitizeText(title),
    sanitizeText(content),
    category ? sanitizeText(category) : null,
    req.userId,
    maxOrder + 1,
    loom_embed_url || null,
    downloadUrl || null
  ]);

  res.status(201).json(result.rows[0]);
}));

// Update instruction
router.put('/:cohortId/instructions/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;
  const { title, content, category, cohort_category_id, description, loom_embed_url, downloadUrl } = req.body;

  const result = await query(`
    UPDATE labs.instructions
    SET
      title = $1,
      content = $2,
      category = $3,
      cohort_category_id = $4,
      loom_embed_url = $5,
      image_url = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7 AND cohort_id = $8
    RETURNING *
  `, [
    sanitizeText(title),
    sanitizeText(content),
    category ? sanitizeText(category) : null,
    cohort_category_id || null,
    loom_embed_url || null,
    downloadUrl || null,
    id,
    cohortId
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Instruction not found' });
  }

  res.json(result.rows[0]);
}));

// Delete instruction
router.delete('/:cohortId/instructions/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;

  const result = await query('DELETE FROM labs.instructions WHERE id = $1 AND cohort_id = $2 RETURNING id', [id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Instruction not found' });
  }

  res.json({ message: 'Instruction deleted successfully' });
}));

// Create recording for cohort
router.post('/:cohortId/recordings', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { title, video_url, loom_embed_url, duration, date, instructor, description } = req.body;

  if (!title || !date || !instructor) {
    return res.status(400).json({ error: 'Title, date, and instructor are required' });
  }

  const result = await query(`
    INSERT INTO labs.recordings (cohort_id, title, video_url, loom_embed_url, duration, date, instructor, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [cohortId, sanitizeText(title), video_url, loom_embed_url, duration, date, sanitizeText(instructor), description ? sanitizeText(description) : null]);

  res.status(201).json(result.rows[0]);
}));

// Update recording
router.put('/:cohortId/recordings/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;
  const { title, video_url, loom_embed_url, duration, date, instructor, description } = req.body;

  const result = await query(`
    UPDATE labs.recordings
    SET title = $1, video_url = $2, loom_embed_url = $3, duration = $4, date = $5, instructor = $6, description = $7, updated_at = CURRENT_TIMESTAMP
    WHERE id = $8 AND cohort_id = $9
    RETURNING *
  `, [sanitizeText(title), video_url, loom_embed_url, duration, date, sanitizeText(instructor), description ? sanitizeText(description) : null, id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json(result.rows[0]);
}));

// Delete recording
router.delete('/:cohortId/recordings/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;

  const result = await query('DELETE FROM labs.recordings WHERE id = $1 AND cohort_id = $2 RETURNING id', [id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json({ message: 'Recording deleted successfully' });
}));

// Create news for cohort
router.post('/:cohortId/news', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { title, content, author, category, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const result = await query(`
    INSERT INTO labs.news (cohort_id, title, content, author, category, image, date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [cohortId, sanitizeText(title), sanitizeText(content), author || 'Admin', category || 'Новости', image, new Date().toISOString().split('T')[0]]);

  res.status(201).json(result.rows[0]);
}));

// Update news
router.put('/:cohortId/news/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;
  const { title, content, author, category, image } = req.body;

  const result = await query(`
    UPDATE labs.news
    SET title = $1, content = $2, author = $3, category = $4, image = $5, updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND cohort_id = $7
    RETURNING *
  `, [sanitizeText(title), sanitizeText(content), author || 'Admin', category || 'Новости', image, id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News not found' });
  }

  res.json(result.rows[0]);
}));

// Delete news
router.delete('/:cohortId/news/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;

  const result = await query('DELETE FROM labs.news WHERE id = $1 AND cohort_id = $2 RETURNING id', [id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News not found' });
  }

  res.json({ message: 'News deleted successfully' });
}));

// Create event for cohort
router.post('/:cohortId/events', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { title, description, event_date, event_time, location } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event_date are required' });
  }

  const result = await query(`
    INSERT INTO labs.events (cohort_id, title, description, event_date, event_time, location, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [cohortId, sanitizeText(title), description ? sanitizeText(description) : null, event_date, event_time, location, req.userId]);

  res.status(201).json(result.rows[0]);
}));

// Update event
router.put('/:cohortId/events/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;
  const { title, description, event_date, event_time, location } = req.body;

  const result = await query(`
    UPDATE labs.events
    SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND cohort_id = $7
    RETURNING *
  `, [sanitizeText(title), description ? sanitizeText(description) : null, event_date, event_time, location, id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(result.rows[0]);
}));

// Delete event
router.delete('/:cohortId/events/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;

  const result = await query('DELETE FROM labs.events WHERE id = $1 AND cohort_id = $2 RETURNING id', [id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json({ message: 'Event deleted successfully' });
}));

// Create FAQ for cohort
router.post('/:cohortId/faq', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { question, answer, category } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  const result = await query(`
    INSERT INTO labs.faq (cohort_id, question, answer, category)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [cohortId, sanitizeText(question), sanitizeText(answer), category || 'Общие']);

  res.status(201).json(result.rows[0]);
}));

// Update FAQ
router.put('/:cohortId/faq/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;
  const { question, answer, category } = req.body;

  const result = await query(`
    UPDATE labs.faq
    SET question = $1, answer = $2, category = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND cohort_id = $5
    RETURNING *
  `, [sanitizeText(question), sanitizeText(answer), category, id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'FAQ not found' });
  }

  res.json(result.rows[0]);
}));

// Delete FAQ
router.delete('/:cohortId/faq/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId, id } = req.params;

  const result = await query('DELETE FROM labs.faq WHERE id = $1 AND cohort_id = $2 RETURNING id', [id, cohortId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'FAQ not found' });
  }

  res.json({ message: 'FAQ deleted successfully' });
}));

// Reorder instructions (admin only)
router.post('/:cohortId/instructions/reorder', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cohortId } = req.params;
  const { instructions } = req.body; // Array of { id, order, cohort_category_id }

  if (!Array.isArray(instructions)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Update orders in a transaction
  for (const instr of instructions) {
    await query(
      'UPDATE labs.instructions SET display_order = $1, cohort_category_id = $2 WHERE id = $3 AND cohort_id = $4',
      [instr.order, instr.cohort_category_id || null, instr.id, cohortId]
    );
  }

  res.json({ message: 'Instructions reordered successfully' });
}));

export default router;
