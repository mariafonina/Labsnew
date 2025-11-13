import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import bcrypt from 'bcrypt';

const router = Router();

// Get all users (admin only)
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM labs.users ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create user (admin only)
router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password, first_name, last_name, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();

  if (!trimmedUsername || !trimmedEmail) {
    return res.status(400).json({ error: 'Username and email cannot be empty' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
  }

  const existingUser = await query(
    'SELECT id FROM labs.users WHERE username = $1 OR email = $2',
    [trimmedUsername, trimmedEmail]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const sanitizedFirstName = first_name && first_name.trim() ? sanitizeText(first_name.trim()) : null;
  const sanitizedLastName = last_name && last_name.trim() ? sanitizeText(last_name.trim()) : null;

  const result = await query(
    'INSERT INTO labs.users (username, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role, created_at',
    [trimmedUsername, trimmedEmail, passwordHash, sanitizedFirstName, sanitizedLastName, role || 'user']
  );

  res.status(201).json(result.rows[0]);
}));

// Update user (admin only)
router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role, password } = req.body;

  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
  }

  // Prevent self-demotion
  if (parseInt(id) === req.userId && role === 'user') {
    return res.status(400).json({ error: 'Cannot demote yourself' });
  }

  const trimmedUsername = username !== undefined ? username.trim() : undefined;
  const trimmedEmail = email !== undefined ? email.trim() : undefined;

  if ((trimmedUsername !== undefined && !trimmedUsername) || (trimmedEmail !== undefined && !trimmedEmail)) {
    return res.status(400).json({ error: 'Username and email cannot be empty' });
  }

  // Check if username or email already exists for different user
  if (trimmedUsername || trimmedEmail) {
    let conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (trimmedUsername) {
      conditions.push(`username = $${paramIndex++}`);
      queryParams.push(trimmedUsername);
    }
    if (trimmedEmail) {
      conditions.push(`email = $${paramIndex++}`);
      queryParams.push(trimmedEmail);
    }
    queryParams.push(id);

    const existingUser = await query(
      `SELECT id FROM labs.users WHERE (${conditions.join(' OR ')}) AND id != $${paramIndex}`,
      queryParams
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
  }

  const sanitizedFirstName = first_name !== undefined ? (first_name.trim() ? sanitizeText(first_name.trim()) : null) : undefined;
  const sanitizedLastName = last_name !== undefined ? (last_name.trim() ? sanitizeText(last_name.trim()) : null) : undefined;

  let updateQuery = 'UPDATE labs.users SET updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [];
  let paramIndex = 1;

  if (trimmedUsername !== undefined) {
    params.push(trimmedUsername);
    updateQuery += `, username = $${paramIndex++}`;
  }
  if (trimmedEmail !== undefined) {
    params.push(trimmedEmail);
    updateQuery += `, email = $${paramIndex++}`;
  }
  if (sanitizedFirstName !== undefined) {
    params.push(sanitizedFirstName);
    updateQuery += `, first_name = $${paramIndex++}`;
  }
  if (sanitizedLastName !== undefined) {
    params.push(sanitizedLastName);
    updateQuery += `, last_name = $${paramIndex++}`;
  }
  if (role !== undefined) {
    params.push(role);
    updateQuery += `, role = $${paramIndex++}`;
  }
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    params.push(passwordHash);
    updateQuery += `, password_hash = $${paramIndex++}`;
  }

  params.push(id);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, email, first_name, last_name, role, created_at, updated_at`;

  const result = await query(updateQuery, params);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

// Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
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
