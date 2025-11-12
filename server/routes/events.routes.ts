import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { asyncHandler } from '../utils/async-handler';
import { deleteOneOrFail } from '../utils/db-helpers';

const router = Router();

// Public endpoint - get all events (no authentication required)
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM labs.events ORDER BY event_date ASC, event_time ASC'
  );
  res.json(result.rows);
}));

// Get user's personal events only (authenticated)
router.get('/my', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query(
    'SELECT * FROM labs.events WHERE user_id = $1 ORDER BY event_date ASC, event_time ASC',
    [req.userId]
  );
  res.json(result.rows);
}));

router.post('/', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { title, description, event_date, event_time, location } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event date are required' });
  }

  const result = await query(
    'INSERT INTO labs.events (user_id, title, description, event_date, event_time, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [req.userId, title, description, event_date, event_time, location]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, event_date, event_time, location } = req.body;

  const result = await query(
    'UPDATE labs.events SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *',
    [title, description, event_date, event_time, location, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res) => {
  const deleted = await deleteOneOrFail('events', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Event deleted successfully' });
}));

export default router;
