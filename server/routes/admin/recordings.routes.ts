import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

// Get all recordings
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.recordings ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create recording
router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { title, date, duration, instructor, thumbnail, views, description, video_url } = req.body;

  if (!title || !date || !instructor) {
    return res.status(400).json({ error: 'Title, date, and instructor are required' });
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedInstructor = sanitizeText(instructor);
  const sanitizedDescription = description ? sanitizeText(description) : null;

  const result = await query(
    'INSERT INTO labs.recordings (title, date, duration, instructor, thumbnail, views, description, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [sanitizedTitle, date, duration, sanitizedInstructor, thumbnail, views ?? 0, sanitizedDescription, video_url]
  );

  res.status(201).json(result.rows[0]);
}));

// Update recording
router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, date, duration, instructor, thumbnail, views, description, video_url } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedInstructor = instructor ? sanitizeText(instructor) : undefined;
  const sanitizedDescription = description ? sanitizeText(description) : undefined;

  const result = await query(
    'UPDATE labs.recordings SET title = COALESCE($1, title), date = COALESCE($2, date), duration = COALESCE($3, duration), instructor = COALESCE($4, instructor), thumbnail = COALESCE($5, thumbnail), views = COALESCE($6, views), description = COALESCE($7, description), video_url = COALESCE($8, video_url), updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
    [sanitizedTitle, date, duration, sanitizedInstructor, thumbnail, views, sanitizedDescription, video_url, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json(result.rows[0]);
}));

// Delete recording
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.recordings WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json({ message: 'Recording deleted successfully' });
}));

export default router;
