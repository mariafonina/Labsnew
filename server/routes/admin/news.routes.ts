import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import { uploadNewsImage } from '../../utils/multer-config';

const router = Router();

// Get all news items (no user_id filter - admin sees all)
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.news ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create news item with automatic fields and image upload
router.post('/', verifyToken, requireAdmin, createLimiter, uploadNewsImage.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedContent = sanitizeText(content);
  const sanitizedCategory = sanitizeText(category);

  const userResult = await query('SELECT username FROM labs.users WHERE id = $1', [req.userId]);
  const author = userResult.rows[0]?.username || 'Admin';
  const date = new Date().toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  const is_new = true;

  const image = req.file ? `/uploads/news/${req.file.filename}` : null;

  const result = await query(
    'INSERT INTO labs.news (title, content, author, date, category, image, is_new) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [sanitizedTitle, sanitizedContent, author, date, sanitizedCategory, image, is_new]
  );

  res.status(201).json(result.rows[0]);
}));

// Update news item with optional image upload
router.put('/:id', verifyToken, requireAdmin, createLimiter, uploadNewsImage.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedContent = content ? sanitizeText(content) : undefined;
  const sanitizedCategory = category ? sanitizeText(category) : undefined;

  const image = req.file ? `/uploads/news/${req.file.filename}` : undefined;

  const result = await query(
    'UPDATE labs.news SET title = COALESCE($1, title), content = COALESCE($2, content), category = COALESCE($3, category), image = COALESCE($4, image), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
    [sanitizedTitle, sanitizedContent, sanitizedCategory, image, id]
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
