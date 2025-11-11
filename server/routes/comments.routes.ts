import { Router } from 'express';
import { verifyToken, AuthRequest } from '../auth';
import { query } from '../db';
import { readLimiter } from '../utils/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { findAllByUser, deleteOneOrFail } from '../utils/db-helpers';
import { protectedTextSubmission } from '../utils/text-content-middleware';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

// Get all comments for a specific event
router.get('/event/:eventId', verifyToken, readLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { eventId } = req.params;
  const result = await query(
    'SELECT * FROM labs.comments WHERE event_id = $1 ORDER BY created_at DESC',
    [eventId]
  );
  res.json(result.rows);
}));

// Get all comments for current user
router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const comments = await findAllByUser('comments', req.userId!, 'created_at DESC');
  res.json(comments);
}));

// Create a new comment
router.post('/', ...protectedTextSubmission({ maxDuplicates: 2, windowMs: 60000 }), asyncHandler(async (req: AuthRequest, res) => {
  const { event_id, event_type, event_title, author_name, author_role, content, parent_id } = req.body;

  if (!event_id || !author_name || !author_role || !content) {
    return res.status(400).json({ error: 'Event ID, author name, author role, and content are required' });
  }

  const sanitizedEventTitle = event_title ? sanitizeText(event_title) : null;
  const sanitizedAuthorName = sanitizeText(author_name);
  const sanitizedAuthorRole = sanitizeText(author_role);

  const result = await query(
    'INSERT INTO labs.comments (user_id, event_id, event_type, event_title, author_name, author_role, content, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [req.userId, event_id, event_type, sanitizedEventTitle, sanitizedAuthorName, sanitizedAuthorRole, content, parent_id || null]
  );

  res.status(201).json(result.rows[0]);
}));

// Update comment likes
router.patch('/:id/like', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { increment } = req.body;

  const result = await query(
    'UPDATE labs.comments SET likes = likes + $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [increment ? 1 : -1, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  res.json(result.rows[0]);
}));

// Delete a comment
router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const deleted = await deleteOneOrFail('comments', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Comment deleted successfully' });
}));

export default router;
