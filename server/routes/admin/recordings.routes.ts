import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import { validateAndNormalizeLoomUrl } from '../../utils/loom-validator';
import { uploadRecordingImage } from '../../utils/multer-config';

const router = Router();

// Get all recordings
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM labs.recordings ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create recording with image upload
router.post('/', verifyToken, requireAdmin, createLimiter, uploadRecordingImage.single('thumbnail'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, date, duration, instructor, description, video_url, loom_embed_url } = req.body;

  if (!title || !date || !instructor) {
    return res.status(400).json({ error: 'Title, date, and instructor are required' });
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedInstructor = sanitizeText(instructor);
  const sanitizedDescription = description ? sanitizeText(description) : null;
  const validatedLoomUrl = validateAndNormalizeLoomUrl(loom_embed_url);
  const thumbnail = req.file ? `/uploads/recordings/${req.file.filename}` : null;

  const result = await query(
    'INSERT INTO labs.recordings (title, date, duration, instructor, thumbnail, views, description, video_url, loom_embed_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [sanitizedTitle, date, duration, sanitizedInstructor, thumbnail, 0, sanitizedDescription, video_url, validatedLoomUrl]
  );

  res.status(201).json(result.rows[0]);
}));

// Update recording with optional image upload
router.put('/:id', verifyToken, requireAdmin, createLimiter, uploadRecordingImage.single('thumbnail'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, date, duration, instructor, description, video_url, loom_embed_url } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedInstructor = instructor ? sanitizeText(instructor) : undefined;
  const sanitizedDescription = description ? sanitizeText(description) : undefined;
  const validatedLoomUrl = loom_embed_url !== undefined ? validateAndNormalizeLoomUrl(loom_embed_url) : undefined;
  const thumbnail = req.file ? `/uploads/recordings/${req.file.filename}` : undefined;

  const updateParts = [];
  const values = [];
  let paramIndex = 1;

  if (sanitizedTitle !== undefined) {
    updateParts.push(`title = $${paramIndex++}`);
    values.push(sanitizedTitle);
  }
  if (date !== undefined) {
    updateParts.push(`date = $${paramIndex++}`);
    values.push(date);
  }
  if (duration !== undefined) {
    updateParts.push(`duration = $${paramIndex++}`);
    values.push(duration);
  }
  if (sanitizedInstructor !== undefined) {
    updateParts.push(`instructor = $${paramIndex++}`);
    values.push(sanitizedInstructor);
  }
  if (thumbnail !== undefined) {
    updateParts.push(`thumbnail = $${paramIndex++}`);
    values.push(thumbnail);
  }
  if (sanitizedDescription !== undefined) {
    updateParts.push(`description = $${paramIndex++}`);
    values.push(sanitizedDescription);
  }
  if (video_url !== undefined) {
    updateParts.push(`video_url = $${paramIndex++}`);
    values.push(video_url);
  }
  if (validatedLoomUrl !== undefined) {
    updateParts.push(`loom_embed_url = $${paramIndex++}`);
    values.push(validatedLoomUrl);
  }

  if (updateParts.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateParts.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE labs.recordings SET ${updateParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json(result.rows[0]);
}));

// Delete recording
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.recordings WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json({ message: 'Recording deleted successfully' });
}));

export default router;
