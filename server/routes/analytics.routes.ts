import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../auth';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { sanitizeText } from '../utils/sanitize';

const router = Router();

// Track page visit
router.post(
  '/page-visit',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page_path,
      page_title,
      page_type,
      page_id,
      referrer,
      session_id,
      time_spent_seconds,
      user_agent,
      device_type,
    } = req.body;

    if (!page_path) {
      return res.status(400).json({ error: 'page_path is required' });
    }

    const sanitizedPagePath = sanitizeText(page_path);
    const sanitizedPageTitle = page_title ? sanitizeText(page_title) : null;
    const sanitizedPageType = page_type ? sanitizeText(page_type) : null;
    const sanitizedPageId = page_id ? sanitizeText(page_id) : null;
    const sanitizedReferrer = referrer ? sanitizeText(referrer) : null;
    const sanitizedSessionId = session_id ? sanitizeText(session_id) : null;
    const sanitizedUserAgent = user_agent ? sanitizeText(user_agent) : null;
    const sanitizedDeviceType = device_type ? sanitizeText(device_type) : null;

    const result = await query(
      `INSERT INTO labs.page_visits 
       (user_id, page_path, page_title, page_type, page_id, referrer, session_id, time_spent_seconds, user_agent, device_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, visited_at`,
      [
        req.userId!,
        sanitizedPagePath,
        sanitizedPageTitle,
        sanitizedPageType,
        sanitizedPageId,
        sanitizedReferrer,
        sanitizedSessionId,
        time_spent_seconds || null,
        sanitizedUserAgent,
        sanitizedDeviceType,
      ]
    );

    res.status(201).json({ success: true, id: result.rows[0].id });
  })
);

// Get user visits (admin only)
router.get(
  '/user/:id/visits',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { limit = '50', offset = '0', page_type, start_date, end_date } = req.query;

    let queryText = `
      SELECT 
        id,
        page_path,
        page_title,
        page_type,
        page_id,
        referrer,
        session_id,
        visited_at,
        time_spent_seconds,
        device_type
      FROM labs.page_visits
      WHERE user_id = $1
    `;
    const params: any[] = [id];
    let paramIndex = 2;

    if (page_type) {
      queryText += ` AND page_type = $${paramIndex}`;
      params.push(page_type);
      paramIndex++;
    }

    if (start_date) {
      queryText += ` AND visited_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND visited_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    queryText += ` ORDER BY visited_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const visits = await query(queryText, params);

    // Get statistics
    let statsQuery = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT page_path) as unique_pages,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(time_spent_seconds) as avg_time_spent,
        SUM(time_spent_seconds) as total_time_spent
      FROM labs.page_visits
      WHERE user_id = $1
    `;
    const statsParams: any[] = [id];
    let statsParamIndex = 2;

    if (start_date) {
      statsQuery += ` AND visited_at >= $${statsParamIndex}`;
      statsParams.push(start_date);
      statsParamIndex++;
    }

    if (end_date) {
      statsQuery += ` AND visited_at <= $${statsParamIndex}`;
      statsParams.push(end_date);
      statsParamIndex++;
    }

    const stats = await query(statsQuery, statsParams);

    // Get popular pages
    let popularPagesQuery = `
      SELECT 
        page_path,
        page_title,
        page_type,
        COUNT(*) as visit_count,
        AVG(time_spent_seconds) as avg_time_spent
      FROM labs.page_visits
      WHERE user_id = $1
    `;
    const popularPagesParams: any[] = [id];
    let popularPagesParamIndex = 2;

    if (start_date) {
      popularPagesQuery += ` AND visited_at >= $${popularPagesParamIndex}`;
      popularPagesParams.push(start_date);
      popularPagesParamIndex++;
    }

    if (end_date) {
      popularPagesQuery += ` AND visited_at <= $${popularPagesParamIndex}`;
      popularPagesParams.push(end_date);
      popularPagesParamIndex++;
    }

    popularPagesQuery += ` GROUP BY page_path, page_title, page_type ORDER BY visit_count DESC LIMIT 10`;
    const popularPages = await query(popularPagesQuery, popularPagesParams);

    // Get visits by page type
    let visitsByTypeQuery = `
      SELECT 
        page_type,
        COUNT(*) as visit_count
      FROM labs.page_visits
      WHERE user_id = $1 AND page_type IS NOT NULL
    `;
    const visitsByTypeParams: any[] = [id];
    let visitsByTypeParamIndex = 2;

    if (start_date) {
      visitsByTypeQuery += ` AND visited_at >= $${visitsByTypeParamIndex}`;
      visitsByTypeParams.push(start_date);
      visitsByTypeParamIndex++;
    }

    if (end_date) {
      visitsByTypeQuery += ` AND visited_at <= $${visitsByTypeParamIndex}`;
      visitsByTypeParams.push(end_date);
      visitsByTypeParamIndex++;
    }

    visitsByTypeQuery += ` GROUP BY page_type ORDER BY visit_count DESC`;
    const visitsByType = await query(visitsByTypeQuery, visitsByTypeParams);

    res.json({
      visits: visits.rows,
      statistics: {
        total_visits: parseInt(stats.rows[0]?.total_visits || '0'),
        unique_pages: parseInt(stats.rows[0]?.unique_pages || '0'),
        unique_sessions: parseInt(stats.rows[0]?.unique_sessions || '0'),
        avg_time_spent: parseFloat(stats.rows[0]?.avg_time_spent || '0'),
        total_time_spent: parseInt(stats.rows[0]?.total_time_spent || '0'),
      },
      popular_pages: popularPages.rows,
      visits_by_type: visitsByType.rows,
    });
  })
);

// Get analytics stats (admin only)
router.get(
  '/stats',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { start_date, end_date } = req.query;

    let queryText = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT page_path) as unique_pages,
        AVG(time_spent_seconds) as avg_time_spent
      FROM labs.page_visits
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      queryText += ` AND visited_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND visited_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const stats = await query(queryText, params);

    // Get popular pages
    let popularPagesQuery = `
      SELECT 
        page_path,
        page_title,
        page_type,
        COUNT(*) as visit_count
      FROM labs.page_visits
      WHERE 1=1
    `;
    const popularPagesParams: any[] = [];
    let popularPagesParamIndex = 1;

    if (start_date) {
      popularPagesQuery += ` AND visited_at >= $${popularPagesParamIndex}`;
      popularPagesParams.push(start_date);
      popularPagesParamIndex++;
    }

    if (end_date) {
      popularPagesQuery += ` AND visited_at <= $${popularPagesParamIndex}`;
      popularPagesParams.push(end_date);
      popularPagesParamIndex++;
    }

    popularPagesQuery += ` GROUP BY page_path, page_title, page_type ORDER BY visit_count DESC LIMIT 20`;
    const popularPages = await query(popularPagesQuery, popularPagesParams);

    res.json({
      statistics: {
        total_visits: parseInt(stats.rows[0]?.total_visits || '0'),
        unique_users: parseInt(stats.rows[0]?.unique_users || '0'),
        unique_pages: parseInt(stats.rows[0]?.unique_pages || '0'),
        avg_time_spent: parseFloat(stats.rows[0]?.avg_time_spent || '0'),
      },
      popular_pages: popularPages.rows,
    });
  })
);

export default router;

