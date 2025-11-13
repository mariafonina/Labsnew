import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { sanitizeHtml } from '../utils/sanitize';
import { asyncHandler } from '../utils/async-handler';
import { findOneOrFail, deleteOneOrFail } from '../utils/db-helpers';
import { validateAndNormalizeLoomUrl } from '../utils/loom-validator';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { category, search } = req.query;
  let queryText = 'SELECT * FROM labs.instructions WHERE user_id = $1';
  const params: any[] = [req.userId];

  if (category) {
    queryText += ' AND category = $2';
    params.push(category);
  }

  if (search) {
    const searchIndex = params.length + 1;
    queryText += ` AND (title ILIKE $${searchIndex} OR content ILIKE $${searchIndex})`;
    params.push(`%${search}%`);
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  res.json(result.rows);
}));

router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const instruction = await findOneOrFail('instructions', { id: req.params.id, user_id: req.userId! }, res);
  if (!instruction) return;
  res.json(instruction);
}));

router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { title, content, category, tags, image_url, loom_embed_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const sanitizedContent = sanitizeHtml(content);
  const validatedLoomUrl = validateAndNormalizeLoomUrl(loom_embed_url);

  const result = await query(
    'INSERT INTO labs.instructions (user_id, title, content, category, tags, image_url, loom_embed_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [req.userId, title, sanitizedContent, category, tags, image_url, validatedLoomUrl]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, content, category, tags, image_url, loom_embed_url } = req.body;

  const sanitizedContent = sanitizeHtml(content);
  const validatedLoomUrl = loom_embed_url !== undefined ? validateAndNormalizeLoomUrl(loom_embed_url) : undefined;

  const result = await query(
    'UPDATE labs.instructions SET title = $1, content = $2, category = $3, tags = $4, image_url = $5, loom_embed_url = COALESCE($6, loom_embed_url), updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
    [title, sanitizedContent, category, tags, image_url, validatedLoomUrl, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Instruction not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const deleted = await deleteOneOrFail('instructions', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Instruction deleted successfully' });
}));

export default router;
