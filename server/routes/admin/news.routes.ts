import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { findAllByUser, findOneOrFail, deleteOneOrFail } from '../../utils/db-helpers';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

// Get all news items (no user_id filter - admin sees all)
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.news ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create news item
router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { title, content, author, author_avatar, date, category, image, is_new } = req.body;

  if (!title || !content || !author || !date || !category) {
    return res.status(400).json({ error: 'Title, content, author, date, and category are required' });
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedContent = sanitizeText(content);
  const sanitizedAuthor = sanitizeText(author);
  const sanitizedCategory = sanitizeText(category);

  const result = await query(
    'INSERT INTO labs.news (title, content, author, author_avatar, date, category, image, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [sanitizedTitle, sanitizedContent, sanitizedAuthor, author_avatar, date, sanitizedCategory, image, is_new ?? true]
  );

  res.status(201).json(result.rows[0]);
}));

// Update news item
router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, content, author, author_avatar, date, category, image, is_new } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedContent = content ? sanitizeText(content) : undefined;
  const sanitizedAuthor = author ? sanitizeText(author) : undefined;
  const sanitizedCategory = category ? sanitizeText(category) : undefined;

  const result = await query(
    'UPDATE labs.news SET title = COALESCE($1, title), content = COALESCE($2, content), author = COALESCE($3, author), author_avatar = COALESCE($4, author_avatar), date = COALESCE($5, date), category = COALESCE($6, category), image = COALESCE($7, image), is_new = COALESCE($8, is_new), updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
    [sanitizedTitle, sanitizedContent, sanitizedAuthor, author_avatar, date, sanitizedCategory, image, is_new, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News item not found' });
  }

  res.json(result.rows[0]);
}));

// Delete news item
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.news WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News item not found' });
  }

  res.json({ message: 'News item deleted successfully' });
}));

export default router;
