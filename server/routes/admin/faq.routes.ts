import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

// Get all FAQ items
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.faq ORDER BY category, created_at DESC');
  res.json(result.rows);
}));

// Create FAQ item
router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { question, answer, category, helpful } = req.body;

  if (!question || !answer || !category) {
    return res.status(400).json({ error: 'Question, answer, and category are required' });
  }

  const sanitizedQuestion = sanitizeText(question);
  const sanitizedAnswer = sanitizeText(answer);
  const sanitizedCategory = sanitizeText(category);

  const result = await query(
    'INSERT INTO labs.faq (question, answer, category, helpful) VALUES ($1, $2, $3, $4) RETURNING *',
    [sanitizedQuestion, sanitizedAnswer, sanitizedCategory, helpful ?? 0]
  );

  res.status(201).json(result.rows[0]);
}));

// Update FAQ item
router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { question, answer, category, helpful } = req.body;

  const sanitizedQuestion = question ? sanitizeText(question) : undefined;
  const sanitizedAnswer = answer ? sanitizeText(answer) : undefined;
  const sanitizedCategory = category ? sanitizeText(category) : undefined;

  const result = await query(
    'UPDATE labs.faq SET question = COALESCE($1, question), answer = COALESCE($2, answer), category = COALESCE($3, category), helpful = COALESCE($4, helpful), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
    [sanitizedQuestion, sanitizedAnswer, sanitizedCategory, helpful, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'FAQ item not found' });
  }

  res.json(result.rows[0]);
}));

// Delete FAQ item
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.faq WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'FAQ item not found' });
  }

  res.json({ message: 'FAQ item deleted successfully' });
}));

export default router;
