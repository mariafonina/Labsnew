import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { category, search } = req.query;
    let queryText = 'SELECT * FROM labs.instructions WHERE user_id = $1';
    const params: any[] = [req.userId];

    if (category) {
      queryText += ' AND category = $2';
      params.push(category);
    }

    if (search) {
      const searchIndex = params.length + 1;
      queryText += ` AND (title ILIKE $${searchIndex} OR content ILIKE $${searchIndex})`;
      params.push(`%${search}%`);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM labs.instructions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching instruction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, category, tags, image_url } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await query(
      'INSERT INTO labs.instructions (user_id, title, content, category, tags, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, title, content, category, tags, image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating instruction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, image_url } = req.body;

    const result = await query(
      'UPDATE labs.instructions SET title = $1, content = $2, category = $3, tags = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *',
      [title, content, category, tags, image_url, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM labs.instructions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    res.json({ message: 'Instruction deleted successfully' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
