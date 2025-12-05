import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import { notisendClient } from '../../utils/notisend-client';
import { emailQueueService, QueuedEmail } from '../../utils/email-queue';

const router = Router();

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.email_campaigns ORDER BY created_at DESC');
  res.json(result.rows);
}));

// ===== QUEUE ROUTES (must be before /:id) =====
router.get('/queue/stats', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const stats = await emailQueueService.getQueueStats();
  res.json(stats);
}));

router.get('/queue/batch/:batchId', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { batchId } = req.params;
  const status = await emailQueueService.getBatchStatus(batchId);
  res.json(status);
}));

router.post('/queue/batch/:batchId/cancel', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { batchId } = req.params;
  const cancelled = await emailQueueService.cancelBatch(batchId);
  res.json({ 
    message: `Отменено ${cancelled} писем`,
    cancelled 
  });
}));

router.post('/queue/batch/:batchId/retry', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { batchId } = req.params;
  const retried = await emailQueueService.retryFailedInBatch(batchId);
  res.json({ 
    message: `${retried} писем поставлено на повторную отправку`,
    retried 
  });
}));

router.get('/queue/pending', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query(`
    SELECT id, email_type, recipient_email, subject, status, attempts, max_attempts, 
           next_retry_at, created_at, last_attempt_at, error_message, batch_id
    FROM labs.email_queue 
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 100
  `);
  res.json(result.rows);
}));

router.get('/queue/all', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query(`
    SELECT id, email_type, recipient_email, subject, status, attempts, max_attempts, 
           next_retry_at, created_at, last_attempt_at, error_message, batch_id
    FROM labs.email_queue 
    ORDER BY created_at DESC
    LIMIT 100
  `);
  res.json(result.rows);
}));

router.get('/queue/failed', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query(`
    SELECT id, email_type, recipient_email, subject, status, attempts, max_attempts, 
           created_at, last_attempt_at, error_message, batch_id
    FROM labs.email_queue 
    WHERE status = 'failed'
    ORDER BY last_attempt_at DESC
    LIMIT 100
  `);
  res.json(result.rows);
}));

router.post('/queue/:id/retry', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await query(
    `UPDATE labs.email_queue 
     SET status = 'pending', 
         attempts = 0, 
         error_message = NULL,
         next_retry_at = NULL,
         updated_at = NOW()
     WHERE id = $1 AND status = 'failed'
     RETURNING *`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Email not found or not in failed status' });
  }
  
  res.json({ 
    message: 'Email queued for retry',
    email: result.rows[0]
  });
}));
// ===== END QUEUE ROUTES =====

router.get('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM labs.email_campaigns WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const logs = await query('SELECT * FROM labs.email_logs WHERE campaign_id = $1 ORDER BY created_at DESC', [id]);

  res.json({
    campaign: result.rows[0],
    logs: logs.rows
  });
}));

// Get detailed campaign statistics
router.get('/:id/stats', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT * FROM labs.email_campaigns WHERE id = $1', [id]);
  if (campaign.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Calculate detailed stats
  const stats = await query(`
    SELECT
      COUNT(*) as total_sent,
      COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as delivered_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
      COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count,
      COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked_count,
      SUM(open_count) as total_opens,
      SUM(click_count) as total_clicks
    FROM labs.email_logs
    WHERE campaign_id = $1
  `, [id]);

  const statsRow = stats.rows[0];
  const totalSent = parseInt(statsRow.total_sent) || 0;
  const deliveredCount = parseInt(statsRow.delivered_count) || 0;
  const failedCount = parseInt(statsRow.failed_count) || 0;
  const openedCount = parseInt(statsRow.opened_count) || 0;
  const clickedCount = parseInt(statsRow.clicked_count) || 0;
  const totalOpens = parseInt(statsRow.total_opens) || 0;
  const totalClicks = parseInt(statsRow.total_clicks) || 0;

  // Calculate rates
  const deliveryRate = totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(2) : 0;
  const openRate = deliveredCount > 0 ? ((openedCount / deliveredCount) * 100).toFixed(2) : 0;
  const clickRate = openedCount > 0 ? ((clickedCount / openedCount) * 100).toFixed(2) : 0;
  const clickToOpenRate = openedCount > 0 ? ((clickedCount / openedCount) * 100).toFixed(2) : 0;

  res.json({
    campaign: campaign.rows[0],
    stats: {
      total_sent: totalSent,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      opened_count: openedCount,
      clicked_count: clickedCount,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      delivery_rate: parseFloat(deliveryRate as string),
      open_rate: parseFloat(openRate as string),
      click_rate: parseFloat(clickRate as string),
      click_to_open_rate: parseFloat(clickToOpenRate as string)
    }
  });
}));

// Preview segment recipient count
router.post('/preview-segment', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { segment_type, segment_product_id, segment_cohort_id } = req.body;

  let recipientCount = 0;
  let query_text = '';
  let params: any[] = [];

  if (segment_type === 'all') {
    const result = await query('SELECT COUNT(*) as count FROM labs.users');
    recipientCount = parseInt(result.rows[0].count);
  } else if (segment_type === 'product' && segment_product_id) {
    const result = await query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM labs.user_enrollments
      WHERE product_id = $1 AND status = 'active'
    `, [segment_product_id]);
    recipientCount = parseInt(result.rows[0].count);
  } else if (segment_type === 'cohort' && segment_cohort_id) {
    const result = await query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM labs.cohort_members
      WHERE cohort_id = $1 AND left_at IS NULL
    `, [segment_cohort_id]);
    recipientCount = parseInt(result.rows[0].count);
  } else {
    return res.status(400).json({ error: 'Invalid segment configuration' });
  }

  res.json({ recipient_count: recipientCount });
}));

// Refresh campaign stats manually
router.post('/:id/refresh-stats', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT id FROM labs.email_campaigns WHERE id = $1', [id]);
  if (campaign.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Recalculate stats
  await query(`
    UPDATE labs.email_campaigns
    SET
      opened_count = (
        SELECT COUNT(DISTINCT id)
        FROM labs.email_logs
        WHERE campaign_id = $1 AND opened_at IS NOT NULL
      ),
      clicked_count = (
        SELECT COUNT(DISTINCT id)
        FROM labs.email_logs
        WHERE campaign_id = $1 AND clicked_at IS NOT NULL
      ),
      sent_count = (
        SELECT COUNT(*)
        FROM labs.email_logs
        WHERE campaign_id = $1 AND (status = 'sent' OR status = 'delivered')
      ),
      failed_count = (
        SELECT COUNT(*)
        FROM labs.email_logs
        WHERE campaign_id = $1 AND status = 'failed'
      )
    WHERE id = $1
  `, [id]);

  res.json({ message: 'Stats refreshed successfully' });
}));

router.post('/', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { name, type, subject, html_content, text_content, template_id } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const sanitizedName = sanitizeText(name);
  const sanitizedSubject = subject ? sanitizeText(subject) : null;
  const sanitizedHtml = html_content ? sanitizeText(html_content) : null;
  const sanitizedText = text_content ? sanitizeText(text_content) : null;

  const result = await query(
    `INSERT INTO labs.email_campaigns (name, type, subject, html_content, text_content, template_id, status, created_by) 
     VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7) RETURNING *`,
    [sanitizedName, type, sanitizedSubject, sanitizedHtml, sanitizedText, template_id, req.userId]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, type, subject, html_content, text_content, template_id, status } = req.body;

  const sanitizedName = name ? sanitizeText(name) : undefined;
  const sanitizedSubject = subject ? sanitizeText(subject) : undefined;
  const sanitizedHtml = html_content ? sanitizeText(html_content) : undefined;
  const sanitizedText = text_content ? sanitizeText(text_content) : undefined;

  const result = await query(
    `UPDATE labs.email_campaigns 
     SET name = COALESCE($1, name), 
         type = COALESCE($2, type),
         subject = COALESCE($3, subject), 
         html_content = COALESCE($4, html_content), 
         text_content = COALESCE($5, text_content),
         template_id = COALESCE($6, template_id),
         status = COALESCE($7, status),
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $8 RETURNING *`,
    [sanitizedName, type, sanitizedSubject, sanitizedHtml, sanitizedText, template_id, status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.json(result.rows[0]);
}));

router.delete('/:id', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const result = await query('DELETE FROM labs.email_campaigns WHERE id = $1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.json({ message: 'Campaign deleted successfully' });
}));

router.post('/:id/send', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { recipients, test_mode = false } = req.body;

  const campaignResult = await query('SELECT * FROM labs.email_campaigns WHERE id = $1', [id]);
  
  if (campaignResult.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const campaign = campaignResult.rows[0];

  let recipientEmails: string[] = [];

  if (test_mode && recipients && Array.isArray(recipients)) {
    recipientEmails = recipients;
  } else {
    const usersResult = await query('SELECT email FROM labs.users WHERE role = $1', ['user']);
    recipientEmails = usersResult.rows.map((row: any) => row.email);
  }

  if (recipientEmails.length === 0) {
    return res.status(400).json({ error: 'No recipients found' });
  }

  await query(
    'UPDATE labs.email_campaigns SET status = $1, recipients_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    ['sending', recipientEmails.length, id]
  );

  const emailsToQueue: QueuedEmail[] = recipientEmails.map(email => ({
    email_type: 'campaign' as const,
    recipient_email: email,
    subject: campaign.subject || 'Уведомление',
    html_content: campaign.html_content || '',
    text_content: campaign.text_content,
    template_id: campaign.template_id || undefined,
    template_data: {},
    from_email: 'noreply@mariafonina.ru',
    from_name: 'ЛАБС',
    campaign_id: parseInt(id),
    priority: 0
  }));

  const batchResult = await emailQueueService.addBatchToQueue(emailsToQueue);

  res.json({
    message: 'Рассылка запущена',
    batch_id: batchResult.batch_id,
    total: recipientEmails.length,
    queued: batchResult.queued,
  });
}));

router.post('/send-user-credentials', verifyToken, requireAdmin, createLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { user_ids, template_id } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'user_ids array is required' });
  }

  if (!template_id) {
    return res.status(400).json({ error: 'template_id is required' });
  }

  const usersResult = await query(
    'SELECT id, username, email FROM labs.users WHERE id = ANY($1)',
    [user_ids]
  );

  const users = usersResult.rows;

  if (users.length === 0) {
    return res.status(400).json({ error: 'No users found' });
  }

  const emailsToQueue: QueuedEmail[] = users.map((user: any) => ({
    email_type: 'credential' as const,
    recipient_email: user.email,
    recipient_name: user.username,
    subject: 'Данные для входа в ЛАБС',
    template_id: template_id,
    template_data: {
      username: user.username,
      email: user.email,
      login_url: process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://yourapp.com',
    },
    from_email: 'noreply@mariafonina.ru',
    from_name: 'ЛАБС',
    user_id: user.id,
    priority: 1
  }));

  const batchResult = await emailQueueService.addBatchToQueue(emailsToQueue);

  res.json({
    message: 'Рассылка запущена',
    batch_id: batchResult.batch_id,
    total: users.length,
    queued: batchResult.queued,
  });
}));

export default router;
