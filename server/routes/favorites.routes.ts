import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { createLimiter, readLimiter } from '../utils/rate-limit';

const router = Router();

router.get('/', verifyToken, readLimiter, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM labs.favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, createLimiter, async (req: AuthRequest, res) => {
  try {
    const { item_type, item_id, title, description, date } = req.body;

    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'Item type and ID are required' });
    }

    const result = await query(
      'INSERT INTO labs.favorites (user_id, item_type, item_id, title, description, date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, item_type, item_id) DO NOTHING RETURNING *',
      [req.userId, item_type, item_id, title, description, date]
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

router.delete('/:item_type/:item_id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { item_type, item_id } = req.params;
    const result = await query(
      'DELETE FROM labs.favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3 RETURNING id',
      [req.userId, item_type, item_id]
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
