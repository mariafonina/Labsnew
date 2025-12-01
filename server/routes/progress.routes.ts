import { Router, Response } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { asyncHandler } from '../utils/async-handler';
import { findAllByUser } from '../utils/db-helpers';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const progress = await findAllByUser('progress', req.userId!, 'last_accessed DESC');
  res.json(progress);
}));

router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
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
}));

router.post('/view', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { instruction_id } = req.body;

  if (!instruction_id) {
    return res.status(400).json({ error: 'Instruction ID is required' });
  }

  const result = await query(
    `INSERT INTO labs.progress (user_id, instruction_id, completed, last_accessed) 
     VALUES ($1, $2, false, CURRENT_TIMESTAMP) 
     ON CONFLICT (user_id, instruction_id) 
     DO UPDATE SET last_accessed = CURRENT_TIMESTAMP 
     RETURNING *`,
    [req.userId, instruction_id]
  );

  res.json(result.rows[0]);
}));

export default router;
