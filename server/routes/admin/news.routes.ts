import { Router, Response } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
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
  const result = await query('SELECT * FROM labs.news ORDER BY created_at DESC');
  res.json(result.rows);
}));

router.post('/', verifyToken, requireAdmin, createLimiter, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, content, category, cohort_id } = req.body;

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

  let image: string | null = null;
  if (req.file && isYandexS3Configured()) {
    const uploadResult = await uploadImageToYandexS3(
      req.file.buffer,
      req.file.originalname,
      'news'
    );
    if (uploadResult.success && uploadResult.url) {
      image = uploadResult.url;
    }
  }

  const parsedCohortId = cohort_id ? parseInt(cohort_id, 10) : null;

  const result = await query(
    'INSERT INTO labs.news (title, content, author, date, category, image, is_new, cohort_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [sanitizedTitle, sanitizedContent, author, date, sanitizedCategory, image, is_new, parsedCohortId]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, category, cohort_id } = req.body;

  const sanitizedTitle = title ? sanitizeText(title) : undefined;
  const sanitizedContent = content ? sanitizeText(content) : undefined;
  const sanitizedCategory = category ? sanitizeText(category) : undefined;

  let image: string | undefined = undefined;
  if (req.file && isYandexS3Configured()) {
    const uploadResult = await uploadImageToYandexS3(
      req.file.buffer,
      req.file.originalname,
      'news'
    );
    if (uploadResult.success && uploadResult.url) {
      image = uploadResult.url;
    }
  }

  const parsedCohortId = cohort_id !== undefined ? (cohort_id ? parseInt(cohort_id, 10) : null) : undefined;

  const result = await query(
    'UPDATE labs.news SET title = COALESCE($1, title), content = COALESCE($2, content), category = COALESCE($3, category), image = COALESCE($4, image), cohort_id = COALESCE($5, cohort_id), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
    [sanitizedTitle, sanitizedContent, sanitizedCategory, image, parsedCohortId, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News item not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.news WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'News item not found' });
  }

  res.json({ message: 'News item deleted successfully' });
}));

export default router;
