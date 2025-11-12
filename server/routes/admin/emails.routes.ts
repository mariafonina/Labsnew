import { Router } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { query } from '../../db';
import { createLimiter } from '../../utils/rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { sanitizeText } from '../../utils/sanitize';
import { notisendClient } from '../../utils/notisend-client';

const router = Router();

router.get('/', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const result = await query('SELECT * FROM labs.email_campaigns ORDER BY created_at DESC');
  res.json(result.rows);
}));

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

  let sendResult;

  if (campaign.template_id) {
    sendResult = await notisendClient.sendBulkTemplateEmail(
      recipientEmails,
      campaign.template_id,
      {}
    );
  } else {
    sendResult = await notisendClient.sendBulkEmail({
      recipients: recipientEmails,
      subject: campaign.subject || 'Notification',
      html: campaign.html_content || '',
      text: campaign.text_content,
    });
  }

  for (const result of sendResult.results) {
    await query(
      'INSERT INTO labs.email_logs (campaign_id, recipient_email, status, notisend_id, sent_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [id, result.email, 'sent', result.result?.id || null]
    );
  }

  for (const error of sendResult.errors) {
    await query(
      'INSERT INTO labs.email_logs (campaign_id, recipient_email, status, error_message) VALUES ($1, $2, $3, $4)',
      [id, error.email, 'failed', error.error]
    );
  }

  await query(
    'UPDATE labs.email_campaigns SET status = $1, sent_count = $2, failed_count = $3, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
    ['sent', sendResult.sent, sendResult.failed, id]
  );

  res.json({
    message: 'Campaign sent successfully',
    total: sendResult.total,
    sent: sendResult.sent,
    failed: sendResult.failed,
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

  const results = [];
  const errors = [];

  for (const user of users) {
    try {
      const templateData = {
        username: user.username,
        email: user.email,
        login_url: process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://yourapp.com',
      };

      const result = await notisendClient.sendTemplateEmail(
        user.email,
        template_id,
        templateData
      );

      results.push({ user_id: user.id, email: user.email, status: 'sent', result });
    } catch (error: any) {
      errors.push({ user_id: user.id, email: user.email, status: 'failed', error: error.message });
    }
  }

  res.json({
    total: users.length,
    sent: results.length,
    failed: errors.length,
    results,
    errors,
  });
}));

export default router;
