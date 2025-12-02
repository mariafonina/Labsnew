import { Router, Response } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import { validateAndNormalizeLoomUrl } from '../../utils/loom-validator';
import { uploadImageToYandexS3, isYandexS3Configured } from '../../yandexS3';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM labs.recordings ORDER BY created_at DESC');
  res.json(result.rows);
}));

router.post('/', verifyToken, requireAdmin, createLimiter, upload.single('thumbnail'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, date, duration, instructor, description, video_url, loom_embed_url, cohort_id, summary_url } = req.body;

  if (!title || !date || !instructor) {
    return res.status(400).json({ error: 'Title, date, and instructor are required' });
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedInstructor = sanitizeText(instructor);
  const sanitizedDescription = description ? sanitizeText(description) : null;
  const validatedLoomUrl = validateAndNormalizeLoomUrl(loom_embed_url);

  let thumbnail: string | null = null;
  if (req.file && isYandexS3Configured()) {
    const uploadResult = await uploadImageToYandexS3(
      req.file.buffer,
      req.file.originalname,
      'recordings'
    );
    if (uploadResult.success && uploadResult.url) {
      thumbnail = uploadResult.url;
    }
  }

  const parsedCohortId = cohort_id ? parseInt(cohort_id, 10) : null;

  const result = await query(
    'INSERT INTO labs.recordings (title, date, duration, instructor, thumbnail, views, description, video_url, loom_embed_url, cohort_id, summary_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [sanitizedTitle, date, duration, sanitizedInstructor, thumbnail, 0, sanitizedDescription, video_url, validatedLoomUrl, parsedCohortId, summary_url && summary_url.trim() ? summary_url.trim() : null]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, upload.single('thumbnail'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, date, duration, instructor, description, video_url, loom_embed_url, cohort_id, summary_url } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedInstructor = instructor ? sanitizeText(instructor) : undefined;
  const sanitizedDescription = description ? sanitizeText(description) : undefined;
  const validatedLoomUrl = loom_embed_url !== undefined ? validateAndNormalizeLoomUrl(loom_embed_url) : undefined;

  let thumbnail: string | undefined = undefined;
  if (req.file && isYandexS3Configured()) {
    const uploadResult = await uploadImageToYandexS3(
      req.file.buffer,
      req.file.originalname,
      'recordings'
    );
    if (uploadResult.success && uploadResult.url) {
      thumbnail = uploadResult.url;
    }
  }

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
  if (cohort_id !== undefined) {
    updateParts.push(`cohort_id = $${paramIndex++}`);
    values.push(cohort_id ? parseInt(cohort_id, 10) : null);
  }
  if (summary_url !== undefined) {
    updateParts.push(`summary_url = $${paramIndex++}`);
    values.push(summary_url && summary_url.trim() ? summary_url.trim() : null);
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

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.recordings WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recording not found' });
  }

  res.json({ message: 'Recording deleted successfully' });
}));

export default router;
