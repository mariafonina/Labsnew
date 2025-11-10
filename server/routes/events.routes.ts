import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM labs.events WHERE user_id = $1 ORDER BY event_date ASC, event_time ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, event_date, event_time, location } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const result = await query(
      'INSERT INTO labs.events (user_id, title, description, event_date, event_time, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, title, description, event_date, event_time, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
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
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM labs.events WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
