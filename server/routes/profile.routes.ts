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

// Get user's cohorts
router.get('/cohorts', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('[/profile/cohorts] Route hit, userId:', req.userId);
  try {
    // Сначала проверим все enrollments пользователя для отладки
    const allEnrollments = await query(`
      SELECT id, product_id, cohort_id, pricing_tier_id, status, expires_at
      FROM labs.user_enrollments
      WHERE user_id = $1
    `, [req.userId]);

    console.log(`[DEBUG /profile/cohorts] User ${req.userId} has ${allEnrollments.rows.length} enrollments:`, JSON.stringify(allEnrollments.rows, null, 2));

    // Проверим cohort_members
    const cohortMemberships = await query(`
      SELECT cohort_id, joined_at, left_at
      FROM labs.cohort_members
      WHERE user_id = $1
    `, [req.userId]);

    console.log(`[DEBUG /profile/cohorts] User ${req.userId} is in ${cohortMemberships.rows.length} cohort_members:`, JSON.stringify(cohortMemberships.rows, null, 2));

    const result = await query(`
      SELECT DISTINCT c.id, c.name, c.product_id, c.start_date, p.name as product_name
      FROM labs.user_enrollments ue
      JOIN labs.cohorts c ON ue.cohort_id = c.id
      LEFT JOIN labs.products p ON c.product_id = p.id
      WHERE ue.user_id = $1
        AND ue.status = 'active'
        AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
        AND c.is_active = TRUE
      ORDER BY c.start_date DESC
    `, [req.userId]);

    console.log(`[DEBUG /profile/cohorts] User ${req.userId} has access to ${result.rows.length} cohorts:`, JSON.stringify(result.rows, null, 2));

    res.json(result.rows);
  } catch (error: any) {
    console.error(`[ERROR /profile/cohorts] Failed for user ${req.userId}:`, error);
    console.error('[ERROR /profile/cohorts] Stack:', error.stack);
    throw error;
  }
}));

export default router;
