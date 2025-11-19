import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// Notisend email opened webhook
router.post('/email/opened', asyncHandler(async (req: Request, res: Response) => {
  const { notisend_id, email, opened_at } = req.body;

  if (!notisend_id) {
    return res.status(400).json({ error: 'notisend_id is required' });
  }

  try {
    // Update email log
    const result = await query(`
      UPDATE labs.email_logs
      SET opened_at = COALESCE(opened_at, $1),
          last_opened_at = $1,
          open_count = open_count + 1
      WHERE notisend_id = $2
      RETURNING campaign_id
    `, [opened_at || new Date().toISOString(), notisend_id]);

    if (result.rows.length > 0) {
      const campaignId = result.rows[0].campaign_id;

      // Update campaign stats
      await query(`
        UPDATE labs.email_campaigns
        SET opened_count = (
          SELECT COUNT(DISTINCT id)
          FROM labs.email_logs
          WHERE campaign_id = $1 AND opened_at IS NOT NULL
        )
        WHERE id = $1
      `, [campaignId]);

      console.log(`Email opened: notisend_id=${notisend_id}, campaign_id=${campaignId}`);
    }

    res.json({ success: true, message: 'Open tracked successfully' });
  } catch (error) {
    console.error('Error tracking email open:', error);
    res.status(500).json({ error: 'Failed to track email open' });
  }
}));

// Notisend email clicked webhook
router.post('/email/clicked', asyncHandler(async (req: Request, res: Response) => {
  const { notisend_id, email, clicked_at, link_url } = req.body;

  if (!notisend_id) {
    return res.status(400).json({ error: 'notisend_id is required' });
  }

  try {
    // Update email log
    const result = await query(`
      UPDATE labs.email_logs
      SET clicked_at = COALESCE(clicked_at, $1),
          click_count = click_count + 1
      WHERE notisend_id = $2
      RETURNING campaign_id
    `, [clicked_at || new Date().toISOString(), notisend_id]);

    if (result.rows.length > 0) {
      const campaignId = result.rows[0].campaign_id;

      // Update campaign stats
      await query(`
        UPDATE labs.email_campaigns
        SET clicked_count = (
          SELECT COUNT(DISTINCT id)
          FROM labs.email_logs
          WHERE campaign_id = $1 AND clicked_at IS NOT NULL
        )
        WHERE id = $1
      `, [campaignId]);

      console.log(`Email clicked: notisend_id=${notisend_id}, campaign_id=${campaignId}, link=${link_url}`);
    }

    res.json({ success: true, message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error tracking email click:', error);
    res.status(500).json({ error: 'Failed to track email click' });
  }
}));

// Notisend email delivery status webhook
router.post('/email/delivered', asyncHandler(async (req: Request, res: Response) => {
  const { notisend_id, email, status, delivered_at } = req.body;

  if (!notisend_id) {
    return res.status(400).json({ error: 'notisend_id is required' });
  }

  try {
    await query(`
      UPDATE labs.email_logs
      SET status = $1,
          sent_at = $2
      WHERE notisend_id = $3
    `, [status || 'delivered', delivered_at || new Date().toISOString(), notisend_id]);

    res.json({ success: true, message: 'Delivery status updated' });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
}));

// Notisend email failed webhook
router.post('/email/failed', asyncHandler(async (req: Request, res: Response) => {
  const { notisend_id, email, error_message } = req.body;

  if (!notisend_id) {
    return res.status(400).json({ error: 'notisend_id is required' });
  }

  try {
    await query(`
      UPDATE labs.email_logs
      SET status = 'failed',
          error_message = $1
      WHERE notisend_id = $2
    `, [error_message || 'Delivery failed', notisend_id]);

    res.json({ success: true, message: 'Failure status updated' });
  } catch (error) {
    console.error('Error updating failure status:', error);
    res.status(500).json({ error: 'Failed to update failure status' });
  }
}));

export default router;
