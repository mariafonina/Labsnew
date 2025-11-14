import { Router } from 'express';
import { query } from '../db';
import { verifyToken, AuthRequest } from '../auth';
import { readLimiter } from '../utils/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { findOneOrFail, findAllByUser, deleteOneOrFail } from '../utils/db-helpers';
import { protectedTextSubmission } from '../utils/text-content-middleware';

const router = Router();

// Get all notes for current user
router.get('/', verifyToken, readLimiter, asyncHandler(async (req: AuthRequest, res: any) => {
  const notes = await findAllByUser('notes', req.userId!, 'updated_at DESC');
  res.json(notes);
}));

// Get specific note by ID
router.get('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const note = await findOneOrFail('notes', { id: req.params.id, user_id: req.userId! }, res);
  if (!note) return;
  res.json(note);
}));

// Create a new note
router.post('/', ...protectedTextSubmission({ maxDuplicates: 3, windowMs: 120000 }), asyncHandler(async (req: AuthRequest, res: any) => {
  const { title, content, linked_item } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const result = await query(
    'INSERT INTO labs.notes (user_id, title, content, linked_item) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.userId!, title || null, content, linked_item ? JSON.stringify(linked_item) : null]
  );

  res.status(201).json(result.rows[0]);
}));

// Update a note
router.put('/:id', ...protectedTextSubmission({ maxDuplicates: 3, windowMs: 120000 }), asyncHandler(async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { title, content, linked_item } = req.body;

  const result = await query(
    'UPDATE labs.notes SET title = COALESCE($1, title), content = COALESCE($2, content), linked_item = COALESCE($3, linked_item), updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
    [title, content, linked_item ? JSON.stringify(linked_item) : null, id, req.userId!]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Note not found' });
  }

  res.json(result.rows[0]);
}));

// Delete a note
router.delete('/:id', verifyToken, asyncHandler(async (req: AuthRequest, res: any) => {
  const deleted = await deleteOneOrFail('notes', { id: req.params.id, user_id: req.userId! }, res);
  if (!deleted) return;
  res.json({ message: 'Note deleted successfully' });
}));

export default router;
