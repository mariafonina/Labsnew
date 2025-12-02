import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../auth';
import { query } from '../db';
import { readLimiter } from '../utils/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { deleteOneOrFail } from '../utils/db-helpers';
import { protectedTextSubmission } from '../utils/text-content-middleware';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

const COMMENTS_SELECT_WITH_USER = `
  SELECT 
    c.id,
    c.user_id,
    c.event_id,
    c.event_type,
    c.event_title,
    c.content,
    c.parent_id,
    c.likes,
    c.created_at,
    u.username as author_name,
    u.role as author_role
  FROM labs.comments c
  LEFT JOIN labs.users u ON c.user_id = u.id
`;

// Admin route: Get ALL comments from all users
router.get('/admin/all', verifyToken, requireAdmin, readLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    `${COMMENTS_SELECT_WITH_USER} ORDER BY c.created_at DESC`
  );
  res.json(result.rows);
}));

// Get all comments for a specific event
router.get('/event/:eventId', verifyToken, readLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const result = await query(
    `${COMMENTS_SELECT_WITH_USER} WHERE c.event_id = $1 ORDER BY c.created_at DESC`,
    [eventId]
  );
  res.json(result.rows);
}));

// Get all comments for current user
router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    `${COMMENTS_SELECT_WITH_USER} WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
}));

// Create a new comment
router.post('/', ...protectedTextSubmission({ maxDuplicates: 2, windowMs: 60000 }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { event_id, event_type, event_title, content, parent_id } = req.body;

  if (!event_id || !content) {
    return res.status(400).json({ error: 'Event ID and content are required' });
  }

  const sanitizedEventTitle = event_title ? sanitizeText(event_title) : null;

  const result = await query(
    `INSERT INTO labs.comments (user_id, event_id, event_type, event_title, content, parent_id) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id`,
    [req.userId, event_id, event_type, sanitizedEventTitle, content, parent_id || null]
  );

  // Return the created comment with user info
  const commentResult = await query(
    `${COMMENTS_SELECT_WITH_USER} WHERE c.id = $1`,
    [result.rows[0].id]
  );

  res.status(201).json(commentResult.rows[0]);
}));

// Update comment likes
router.patch('/:id/like', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { increment } = req.body;

  const result = await query(
    'UPDATE labs.comments SET likes = likes + $1 WHERE id = $2 RETURNING *',
    [increment ? 1 : -1, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Return with user info
  const commentResult = await query(
    `${COMMENTS_SELECT_WITH_USER} WHERE c.id = $1`,
    [id]
  );

  res.json(commentResult.rows[0]);
}));

// Delete a comment (user can only delete their own)
router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await deleteOneOrFail('comments', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Comment deleted successfully' });
}));

// Admin route: Delete any comment (including replies)
router.delete('/admin/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // First delete all replies to this comment
  await query('DELETE FROM labs.comments WHERE parent_id = $1', [id]);
  
  // Then delete the comment itself
  const result = await query('DELETE FROM labs.comments WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  res.json({ message: 'Comment and its replies deleted successfully' });
}));

export default router;
