import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import bcrypt from 'bcrypt';

const router = Router();

// Get all users (admin only)
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT id, username, email, role, created_at, updated_at FROM labs.users ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Update user role (admin only)
router.patch('/:id/role', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
  }

  // Prevent self-demotion
  if (parseInt(id) === req.userId && role === 'user') {
    return res.status(400).json({ error: 'Cannot demote yourself' });
  }

  const result = await query(
    'UPDATE labs.users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role',
    [role, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

// Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const result = await query('DELETE FROM labs.users WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User deleted successfully' });
}));

export default router;
