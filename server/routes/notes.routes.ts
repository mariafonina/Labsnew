import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

router.get('/:instruction_id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id } = req.params;
    const result = await query(
      'SELECT * FROM labs.notes WHERE user_id = $1 AND instruction_id = $2',
      [req.userId, instruction_id]
    );

    if (result.rows.length === 0) {
      return res.json({ content: '' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id, content } = req.body;

    if (!instruction_id) {
      return res.status(400).json({ error: 'Instruction ID is required' });
    }

    // Sanitize text content to prevent XSS attacks
    const sanitizedContent = sanitizeText(content || '');

    const result = await query(
      `INSERT INTO labs.notes (user_id, instruction_id, content) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, instruction_id) 
       DO UPDATE SET content = $3, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [req.userId, instruction_id, sanitizedContent]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:instruction_id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id } = req.params;
    await query(
      'DELETE FROM labs.notes WHERE user_id = $1 AND instruction_id = $2',
      [req.userId, instruction_id]
    );

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
