import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM labs.progress WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { instruction_id, completed } = req.body;

    if (!instruction_id) {
      return res.status(400).json({ error: 'Instruction ID is required' });
    }

    const result = await query(
      `INSERT INTO labs.progress (user_id, instruction_id, completed, last_accessed) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id, instruction_id) 
       DO UPDATE SET completed = $3, last_accessed = CURRENT_TIMESTAMP 
       RETURNING *`,
      [req.userId, instruction_id, completed || false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
