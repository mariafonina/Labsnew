import { Router } from 'express';
import { verifyToken, AuthRequest } from '../auth';
import { query } from '../db';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

// Get all comments for a specific event
router.get('/event/:eventId', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const result = await query(
      'SELECT * FROM labs.comments WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments for current user
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM labs.comments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new comment
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { event_id, event_type, event_title, author_name, author_role, content, parent_id } = req.body;

    if (!event_id || !author_name || !author_role || !content) {
      return res.status(400).json({ error: 'Event ID, author name, author role, and content are required' });
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeText(content);

    const result = await query(
      'INSERT INTO labs.comments (user_id, event_id, event_type, event_title, author_name, author_role, content, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.userId, event_id, event_type, event_title, author_name, author_role, sanitizedContent, parent_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment likes
router.patch('/:id/like', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { increment } = req.body; // true to add like, false to remove

    const result = await query(
      'UPDATE labs.comments SET likes = likes + $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [increment ? 1 : -1, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating comment likes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM labs.comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
