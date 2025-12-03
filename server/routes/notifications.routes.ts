import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../auth';
import { query } from '../db';
import { readLimiter } from '../utils/rate-limit';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/', verifyToken, readLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    `SELECT 
      id,
      type,
      comment_id,
      question_id,
      event_id,
      event_type,
      event_title,
      answer_author,
      answer_preview,
      is_read,
      created_at
    FROM labs.notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
}));

router.get('/unread-count', verifyToken, readLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM labs.notifications WHERE user_id = $1 AND is_read = FALSE',
    [req.userId]
  );
  res.json({ count: parseInt(result.rows[0].count, 10) });
}));

router.patch('/:id/read', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await query(
    'UPDATE labs.notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json(result.rows[0]);
}));

router.patch('/read-all', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  await query(
    'UPDATE labs.notifications SET is_read = TRUE WHERE user_id = $1',
    [req.userId]
  );
  
  res.json({ message: 'All notifications marked as read' });
}));

export async function createNotification(
  userId: number,
  commentId: number,
  questionId: number,
  eventId: string,
  eventType: string,
  eventTitle: string,
  answerAuthor: string,
  answerPreview: string
) {
  const result = await query(
    `INSERT INTO labs.notifications 
      (user_id, comment_id, question_id, event_id, event_type, event_title, answer_author, answer_preview, type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'answer_received')
    RETURNING *`,
    [userId, commentId, questionId, eventId, eventType, eventTitle, answerAuthor, answerPreview]
  );
  return result.rows[0];
}

export default router;
