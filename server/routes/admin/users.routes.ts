import { Router, Response } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../../auth";
import { query } from "../../db";
import { createLimiter } from "../../utils/rate-limit";
import { asyncHandler } from "../../utils/async-handler";
import { sanitizeText } from "../../utils/sanitize";
import bcrypt from "bcrypt";

const router = Router();

// Get all users (admin only) with filtering, sorting, and pagination
router.get(
  "/",
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cohort_id, product_id, search, page, limit } = req.query;

    // Pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
    SELECT DISTINCT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.created_at, u.updated_at
    FROM labs.users u
  `;
    const params: any[] = [];
    let paramIndex = 1;

    // Фильтрация по потоку
    if (cohort_id) {
      queryText += ` JOIN labs.cohort_members cm ON u.id = cm.user_id AND cm.cohort_id = $${paramIndex} AND cm.left_at IS NULL`;
      params.push(cohort_id);
      paramIndex++;
    }

    // Фильтрация по продукту
    if (product_id) {
      queryText += ` JOIN labs.user_enrollments ue ON u.id = ue.user_id AND ue.product_id = $${paramIndex} AND ue.status = 'active'`;
      params.push(product_id);
      paramIndex++;
    }

    // Поиск по username, email, first_name, last_name
    if (search && typeof search === 'string' && search.trim()) {
      const searchPattern = `%${search.trim().toLowerCase()}%`;
      queryText += ` WHERE (
        LOWER(u.username) LIKE $${paramIndex} OR
        LOWER(u.email) LIKE $${paramIndex} OR
        LOWER(u.first_name) LIKE $${paramIndex} OR
        LOWER(u.last_name) LIKE $${paramIndex}
      )`;
      params.push(searchPattern);
      paramIndex++;
    }

    // Сортировка
    queryText += ` ORDER BY u.created_at DESC`;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM (${queryText}) u`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Add pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  }),
);

// Create user (admin only)
router.post(
  "/",
  verifyToken,
  requireAdmin,
  createLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, email, password, first_name, last_name, role } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail) {
      return res
        .status(400)
        .json({ error: "Username and email cannot be empty" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (role && !["user", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    const existingUser = await query(
      "SELECT id FROM labs.users WHERE username = $1 OR email = $2",
      [trimmedUsername, trimmedEmail],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const sanitizedFirstName =
      first_name && first_name.trim() ? sanitizeText(first_name.trim()) : null;
    const sanitizedLastName =
      last_name && last_name.trim() ? sanitizeText(last_name.trim()) : null;

    const result = await query(
      "INSERT INTO labs.users (username, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role, created_at",
      [
        trimmedUsername,
        trimmedEmail,
        passwordHash,
        sanitizedFirstName,
        sanitizedLastName,
        role || "user",
      ],
    );

    res.status(201).json(result.rows[0]);
  }),
);

// Update user (admin only)
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  createLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { username, email, first_name, last_name, role, password } = req.body;

    if (role && !["user", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    // Prevent self-demotion
    if (parseInt(id) === req.userId && role === "user") {
      return res.status(400).json({ error: "Cannot demote yourself" });
    }

    const trimmedUsername =
      username !== undefined ? username.trim() : undefined;
    const trimmedEmail = email !== undefined ? email.trim() : undefined;

    if (
      (trimmedUsername !== undefined && !trimmedUsername) ||
      (trimmedEmail !== undefined && !trimmedEmail)
    ) {
      return res
        .status(400)
        .json({ error: "Username and email cannot be empty" });
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
        `SELECT id FROM labs.users WHERE (${conditions.join(" OR ")}) AND id != $${paramIndex}`,
        queryParams,
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "Username or email already exists" });
      }
    }

    const sanitizedFirstName =
      first_name !== undefined
        ? first_name.trim()
          ? sanitizeText(first_name.trim())
          : null
        : undefined;
    const sanitizedLastName =
      last_name !== undefined
        ? last_name.trim()
          ? sanitizeText(last_name.trim())
          : null
        : undefined;

    let updateQuery = "UPDATE labs.users SET updated_at = CURRENT_TIMESTAMP";
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
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      params.push(passwordHash);
      updateQuery += `, password_hash = $${paramIndex++}`;
    }

    params.push(id);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, email, first_name, last_name, role, created_at, updated_at`;

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  }),
);

// Delete user (admin only)
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const result = await query(
      "DELETE FROM labs.users WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  }),
);

// Get user statistics (admin only)
router.get(
  "/:id/stats",
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Проверяем существование пользователя
    const user = await query(
      "SELECT id, username, email, first_name, last_name FROM labs.users WHERE id = $1",
      [id],
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Получаем потоки пользователя
    const cohorts = await query(
      `
    SELECT c.id, c.name, c.start_date, c.end_date, cm.joined_at
    FROM labs.cohort_members cm
    JOIN labs.cohorts c ON cm.cohort_id = c.id
    WHERE cm.user_id = $1 AND cm.left_at IS NULL
    ORDER BY cm.joined_at DESC
  `,
      [id],
    );

    // Получаем продукты пользователя (активные и истекшие)
    const enrollments = await query(
      `
    SELECT 
      ue.id,
      ue.product_id,
      ue.pricing_tier_id,
      ue.cohort_id,
      ue.status,
      ue.enrolled_at,
      ue.expires_at,
      p.name as product_name,
      pt.name as tier_name,
      c.name as cohort_name
    FROM labs.user_enrollments ue
    JOIN labs.products p ON ue.product_id = p.id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    LEFT JOIN labs.cohorts c ON ue.cohort_id = c.id
    WHERE ue.user_id = $1
    ORDER BY ue.enrolled_at DESC
  `,
      [id],
    );

    // Разделяем на активные и истекшие
    const now = new Date();
    const activeEnrollments = enrollments.rows.filter(
      (e: any) =>
        e.status === "active" &&
        (!e.expires_at || new Date(e.expires_at) > now),
    );
    const expiredEnrollments = enrollments.rows.filter(
      (e: any) =>
        e.status !== "active" ||
        (e.expires_at && new Date(e.expires_at) <= now),
    );

    // Получаем статистику активности
    const progress = await query(
      `
    SELECT 
      p.instruction_id,
      i.title as instruction_title,
      p.completed,
      p.last_accessed
    FROM labs.progress p
    JOIN labs.instructions i ON p.instruction_id = i.id
    WHERE p.user_id = $1
    ORDER BY p.last_accessed DESC
  `,
      [id],
    );

    const notes = await query(
      `
      SELECT id, title, content, linked_item, created_at, updated_at
    FROM labs.notes
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `,
      [id],
    );

    const favorites = await query(
      `
    SELECT 
      id,
      item_type,
      item_id,
      title,
      description,
      date,
      created_at
    FROM labs.favorites
    WHERE user_id = $1
    ORDER BY created_at DESC
  `,
      [id],
    );

    const comments = await query(
      `
      SELECT
        c.id,
        c.event_id,
        c.event_type,
        c.content,
        c.likes,
        c.created_at,
        CASE
          WHEN c.event_type = 'event' THEN e.title
          WHEN c.event_type = 'instruction' THEN i.title
          WHEN c.event_type = 'recording' THEN r.title
          WHEN c.event_type = 'faq' THEN f.question
        END as event_title
      FROM labs.comments c
      LEFT JOIN labs.events e ON c.event_type = 'event' AND c.event_id::INTEGER = e.id
      LEFT JOIN labs.instructions i ON c.event_type = 'instruction' AND c.event_id::INTEGER = i.id
      LEFT JOIN labs.recordings r ON c.event_type = 'recording' AND c.event_id::INTEGER = r.id
      LEFT JOIN labs.faq f ON c.event_type = 'faq' AND c.event_id::INTEGER = f.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `,
      [id],
    );

    const likedComments = await query(
      `
      SELECT
        c.id,
        c.event_id,
        c.event_type,
        c.content,
        c.likes,
        c.created_at,
        CASE
          WHEN c.event_type = 'event' THEN e.title
          WHEN c.event_type = 'instruction' THEN i.title
          WHEN c.event_type = 'recording' THEN r.title
          WHEN c.event_type = 'faq' THEN f.question
        END as event_title
      FROM labs.comments c
      LEFT JOIN labs.events e ON c.event_type = 'event' AND c.event_id::INTEGER = e.id
      LEFT JOIN labs.instructions i ON c.event_type = 'instruction' AND c.event_id::INTEGER = i.id
      LEFT JOIN labs.recordings r ON c.event_type = 'recording' AND c.event_id::INTEGER = r.id
      LEFT JOIN labs.faq f ON c.event_type = 'faq' AND c.event_id::INTEGER = f.id
      WHERE c.likes > 0 AND c.user_id = $1
      ORDER BY c.likes DESC, c.created_at DESC
    `,
      [id],
    );

    // Получаем просмотренные записи
    const recordingViews = await query(
      `
    SELECT 
      rv.recording_id,
      r.title as recording_title,
      r.date as recording_date,
      rv.viewed_at
    FROM labs.recording_views rv
    JOIN labs.recordings r ON rv.recording_id = r.id
    WHERE rv.user_id = $1
    ORDER BY rv.viewed_at DESC
  `,
      [id],
    );

    res.json({
      user: user.rows[0],
      cohorts: cohorts.rows,
      enrollments: {
        active: activeEnrollments,
        expired: expiredEnrollments,
      },
      activity: {
        progress: progress.rows,
        recordingViews: recordingViews.rows,
        notes: notes.rows,
        favorites: favorites.rows,
        comments: comments.rows,
        likedComments: likedComments.rows,
      },
    });
  }),
);

export default router;
