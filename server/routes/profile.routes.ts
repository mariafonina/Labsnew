import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../auth';
import { query } from '../db';
import { createLimiter } from '../utils/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT id, username, email, first_name, last_name, role, created_at FROM labs.users WHERE id = $1',
    [req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

router.put('/', verifyToken, createLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { first_name, last_name, email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required and cannot be empty' });
  }

  const sanitizedFirstName = first_name !== undefined ? (first_name.trim() ? sanitizeText(first_name.trim()) : null) : undefined;
  const sanitizedLastName = last_name !== undefined ? (last_name.trim() ? sanitizeText(last_name.trim()) : null) : undefined;
  const sanitizedEmail = email.trim();

  const existingUser = await query(
    'SELECT id FROM labs.users WHERE email = $1 AND id != $2',
    [sanitizedEmail, req.userId]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  let updateQuery = 'UPDATE labs.users SET updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [];
  let paramIndex = 1;

  if (sanitizedFirstName !== undefined) {
    params.push(sanitizedFirstName);
    updateQuery += `, first_name = $${paramIndex++}`;
  }
  if (sanitizedLastName !== undefined) {
    params.push(sanitizedLastName);
    updateQuery += `, last_name = $${paramIndex++}`;
  }
  params.push(sanitizedEmail);
  updateQuery += `, email = $${paramIndex++}`;

  params.push(req.userId);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, email, first_name, last_name, role`;

  const result = await query(updateQuery, params);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

export default router;
