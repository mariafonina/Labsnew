import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

// Get all notes for current user
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM labs.notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific note by ID
router.get('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM labs.notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new note
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, linked_item } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Sanitize text content to prevent XSS attacks
    const sanitizedContent = sanitizeText(content);
    const sanitizedTitle = title ? sanitizeText(title) : null;

    const result = await query(
      'INSERT INTO labs.notes (user_id, title, content, linked_item) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, sanitizedTitle, sanitizedContent, linked_item ? JSON.stringify(linked_item) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a note
router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, linked_item } = req.body;

    // Sanitize content
    const sanitizedContent = content ? sanitizeText(content) : undefined;
    const sanitizedTitle = title ? sanitizeText(title) : undefined;

    const result = await query(
      'UPDATE labs.notes SET title = COALESCE($1, title), content = COALESCE($2, content), linked_item = COALESCE($3, linked_item), updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [sanitizedTitle, sanitizedContent, linked_item ? JSON.stringify(linked_item) : null, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a note
router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM labs.notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
