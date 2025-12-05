import { query, getClient } from '../db';
import { notisendClient } from './notisend-client';
import { v4 as uuidv4 } from 'uuid';

export interface QueuedEmail {
  id?: number;
  email_type: 'initial_password' | 'campaign' | 'credential' | 'notification';
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  template_id?: string;
  template_data?: Record<string, any>;
  from_email?: string;
  from_name?: string;
  priority?: number;
  batch_id?: string;
  campaign_id?: number;
  user_id?: number;
}

export interface BatchResult {
  batch_id: string;
  total: number;
  queued: number;
  message: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
}

const EMAIL_DELAY_MS = 10000;
const MAX_BATCH_SIZE = 1;
const RETRY_DELAY_MINUTES = [5, 15, 30];

class EmailQueueService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  async addToQueue(email: QueuedEmail): Promise<number> {
    const result = await query(
      `INSERT INTO labs.email_queue (
        email_type, recipient_email, recipient_name, subject,
        html_content, text_content, template_id, template_data,
        from_email, from_name, priority, batch_id, campaign_id, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        email.email_type,
        email.recipient_email,
        email.recipient_name || null,
        email.subject,
        email.html_content || null,
        email.text_content || null,
        email.template_id || null,
        email.template_data ? JSON.stringify(email.template_data) : null,
        email.from_email || 'noreply@mariafonina.ru',
        email.from_name || 'ЛАБС',
        email.priority || 0,
        email.batch_id || null,
        email.campaign_id || null,
        email.user_id || null
      ]
    );
    return result.rows[0].id;
  }

  async addBatchToQueue(emails: QueuedEmail[]): Promise<BatchResult> {
    const batchId = uuidv4();

    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const email of emails) {
        await client.query(
          `INSERT INTO labs.email_queue (
            email_type, recipient_email, recipient_name, subject,
            html_content, text_content, template_id, template_data,
            from_email, from_name, priority, batch_id, campaign_id, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            email.email_type,
            email.recipient_email,
            email.recipient_name || null,
            email.subject,
            email.html_content || null,
            email.text_content || null,
            email.template_id || null,
            email.template_data ? JSON.stringify(email.template_data) : null,
            email.from_email || 'noreply@mariafonina.ru',
            email.from_name || 'ЛАБС',
            email.priority || 0,
            batchId,
            email.campaign_id || null,
            email.user_id || null
          ]
        );
      }

      await client.query('COMMIT');

      // Get actual count from database after successful commit
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM labs.email_queue WHERE batch_id = $1',
        [batchId]
      );
      const queued = parseInt(countResult.rows[0].count) || 0;

      return {
        batch_id: batchId,
        total: emails.length,
        queued,
        message: `${queued} писем добавлено в очередь`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Reset stuck emails from previous crashes (older than 5 minutes in processing)
      await query(`
        UPDATE labs.email_queue
        SET status = 'pending', next_retry_at = NOW()
        WHERE status = 'processing'
          AND last_attempt_at < NOW() - INTERVAL '5 minutes'
      `);

      // First, check how many pending emails exist
      const pendingCheck = await query(`
        SELECT id, recipient_email, next_retry_at, created_at, attempts
        FROM labs.email_queue 
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 10
      `);
      
      if (pendingCheck.rows.length > 0) {
        console.log(`[EmailQueue] Found ${pendingCheck.rows.length} pending emails:`);
        pendingCheck.rows.forEach((e: any) => {
          const nextRetry = e.next_retry_at ? new Date(e.next_retry_at).toISOString() : 'NULL';
          const isReady = !e.next_retry_at || new Date(e.next_retry_at) <= new Date();
          console.log(`  - ID ${e.id}: ${e.recipient_email}, next_retry_at: ${nextRetry}, ready: ${isReady}, attempts: ${e.attempts}`);
        });
      }

      const client = await getClient();
      let pendingEmails;

      try {
        await client.query('BEGIN');

        pendingEmails = await client.query(
          `UPDATE labs.email_queue
           SET status = 'processing', last_attempt_at = NOW(), updated_at = NOW()
           WHERE id IN (
             SELECT id FROM labs.email_queue
             WHERE status = 'pending'
               AND (next_retry_at IS NULL OR next_retry_at <= NOW())
             ORDER BY priority DESC, created_at ASC
             LIMIT $1
             FOR UPDATE SKIP LOCKED
           )
           RETURNING *`,
          [MAX_BATCH_SIZE]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      if (pendingEmails.rows.length === 0) {
        return;
      }

      console.log(`[EmailQueue] Processing ${pendingEmails.rows.length} emails...`);

      for (const email of pendingEmails.rows) {
        await this.processEmail(email);
        await this.delay(EMAIL_DELAY_MS);
      }
    } catch (error) {
      console.error('[EmailQueue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEmail(email: any): Promise<void> {
    const emailId = email.id;

    try {
      let sendResult: any;

      if (email.template_id) {
        // Parse template_data from database (can be string or object)
        let templateData;
        if (email.template_data) {
          templateData = typeof email.template_data === 'string'
            ? JSON.parse(email.template_data)
            : email.template_data;
        }

        sendResult = await notisendClient.sendTemplateEmail(
          email.recipient_email,
          email.template_id,
          templateData || {},
          email.subject
        );
      } else {
        sendResult = await notisendClient.sendEmail({
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_content || '',
          text: email.text_content,
          from_email: email.from_email,
          from_name: email.from_name
        });
      }

      await query(
        `UPDATE labs.email_queue 
         SET status = 'sent', 
             sent_at = NOW(), 
             notisend_id = $1,
             attempts = attempts + 1,
             updated_at = NOW()
         WHERE id = $2`,
        [sendResult?.id || null, emailId]
      );

      console.log(`[EmailQueue] ✓ Sent email to ${email.recipient_email}`);

      if (email.campaign_id) {
        await query(
          `INSERT INTO labs.email_logs (campaign_id, recipient_email, status, notisend_id, sent_at)
           VALUES ($1, $2, 'sent', $3, NOW())
           ON CONFLICT DO NOTHING`,
          [email.campaign_id, email.recipient_email, sendResult?.id || null]
        );
      }

    } catch (error: any) {
      const attempts = (email.attempts || 0) + 1;
      const maxAttempts = email.max_attempts || 3;

      if (attempts >= maxAttempts) {
        await query(
          `UPDATE labs.email_queue 
           SET status = 'failed', 
               error_message = $1,
               attempts = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [error.message || 'Unknown error', attempts, emailId]
        );
        console.error(`[EmailQueue] ✗ Failed permanently: ${email.recipient_email} - ${error.message}`);

        if (email.campaign_id) {
          await query(
            `INSERT INTO labs.email_logs (campaign_id, recipient_email, status, error_message)
             VALUES ($1, $2, 'failed', $3)
             ON CONFLICT DO NOTHING`,
            [email.campaign_id, email.recipient_email, error.message]
          );
        }
      } else {
        const retryDelayMinutes = RETRY_DELAY_MINUTES[attempts - 1] || 15;
        await query(
          `UPDATE labs.email_queue
           SET status = 'pending',
               error_message = $1,
               attempts = $2,
               next_retry_at = NOW() + $3 * INTERVAL '1 minute',
               updated_at = NOW()
           WHERE id = $4`,
          [error.message || 'Unknown error', attempts, retryDelayMinutes, emailId]
        );
        console.log(`[EmailQueue] ⟳ Retry scheduled for ${email.recipient_email} in ${retryDelayMinutes} min`);
      }
    }
  }

  async getQueueStats(): Promise<QueueStats> {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) as total
      FROM labs.email_queue
    `);
    return result.rows[0];
  }

  async getBatchStatus(batchId: string): Promise<{
    batch_id: string;
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    progress_percent: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM labs.email_queue
      WHERE batch_id = $1
    `, [batchId]);

    const stats = result.rows[0];
    const total = parseInt(stats.total) || 0;
    const completed = parseInt(stats.sent) + parseInt(stats.failed);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      batch_id: batchId,
      total,
      pending: parseInt(stats.pending) || 0,
      processing: parseInt(stats.processing) || 0,
      sent: parseInt(stats.sent) || 0,
      failed: parseInt(stats.failed) || 0,
      progress_percent: progressPercent
    };
  }

  async cancelBatch(batchId: string): Promise<number> {
    const result = await query(
      `UPDATE labs.email_queue 
       SET status = 'cancelled', updated_at = NOW()
       WHERE batch_id = $1 AND status = 'pending'
       RETURNING id`,
      [batchId]
    );
    return result.rowCount || 0;
  }

  async retryFailedInBatch(batchId: string): Promise<number> {
    const result = await query(
      `UPDATE labs.email_queue 
       SET status = 'pending', 
           attempts = 0, 
           error_message = NULL,
           next_retry_at = NULL,
           updated_at = NOW()
       WHERE batch_id = $1 AND status = 'failed'
       RETURNING id`,
      [batchId]
    );
    return result.rowCount || 0;
  }

  async cleanupOldEmails(daysToKeep = 30): Promise<number> {
    const result = await query(
      `DELETE FROM labs.email_queue
       WHERE (status = 'sent' OR status = 'cancelled')
         AND created_at < NOW() - $1 * INTERVAL '1 day'
       RETURNING id`,
      [daysToKeep]
    );
    return result.rowCount || 0;
  }

  startWorker(intervalMs = 5000): void {
    if (this.processingInterval) {
      console.log('[EmailQueue] Worker already running');
      return;
    }

    console.log(`[EmailQueue] Starting worker with ${intervalMs}ms interval`);
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    this.processQueue();
  }

  stopWorker(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[EmailQueue] Worker stopped');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emailQueueService = new EmailQueueService();
