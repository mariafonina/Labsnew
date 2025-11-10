import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT f.*, i.title, i.content, i.category, i.image_url 
       FROM labs.favorites f 
       JOIN labs.instructions i ON f.instruction_id = i.id 
       WHERE f.user_id = $1 
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id } = req.body;

    if (!instruction_id) {
      return res.status(400).json({ error: 'Instruction ID is required' });
    }

    const result = await query(
      'INSERT INTO labs.favorites (user_id, instruction_id) VALUES ($1, $2) ON CONFLICT (user_id, instruction_id) DO NOTHING RETURNING *',
      [req.userId, instruction_id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Already in favorites' });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:instruction_id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id } = req.params;
    const result = await query(
      'DELETE FROM labs.favorites WHERE user_id = $1 AND instruction_id = $2 RETURNING id',
      [req.userId, instruction_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
