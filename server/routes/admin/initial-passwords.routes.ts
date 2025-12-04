import { Router, Response } from 'express';
import { query } from '../../db';
import { asyncHandler } from '../../utils/async-handler';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { createLimiter } from '../../utils/rate-limit';
import { 
  generateInitialPasswordToken, 
  getInitialPasswordEmailContent,
  cleanupExpiredInitialTokens 
} from '../../utils/initial-password';
import { emailQueueService, QueuedEmail } from '../../utils/email-queue';

const router = Router();

router.post(
  '/send-initial-passwords',
  verifyToken,
  requireAdmin,
  createLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await cleanupExpiredInitialTokens();

    const { cohortIds } = req.body as { cohortIds?: number[] };

    let result;
    if (cohortIds && cohortIds.length > 0) {
      result = await query(
        `SELECT DISTINCT u.id, u.username, u.email, u.created_at
         FROM labs.users u
         JOIN labs.cohort_members cm ON u.id = cm.user_id
         WHERE cm.cohort_id = ANY($1) 
           AND cm.left_at IS NULL
           AND u.role = 'user'
         ORDER BY u.created_at DESC`,
        [cohortIds]
      );
    } else {
      result = await query(
        `SELECT id, username, email 
         FROM labs.users 
         WHERE role = 'user'
         ORDER BY created_at DESC`
      );
    }

    const users = result.rows;
    
    if (users.length === 0) {
      res.json({
        success: true,
        message: 'Нет пользователей для рассылки',
        queued: 0,
        skipped: 0,
        total: 0
      });
      return;
    }

    const existingTokensResult = await query(
      `SELECT DISTINCT user_id FROM labs.initial_password_tokens 
       WHERE used = FALSE AND expires_at > NOW()`
    );
    const usersWithValidTokens = new Set(existingTokensResult.rows.map((r: any) => r.user_id));

    const emailsToQueue: QueuedEmail[] = [];
    let skipped = 0;

    for (const user of users) {
      if (usersWithValidTokens.has(user.id)) {
        skipped++;
        console.log(`⊘ Skipped ${user.email} - already has valid token`);
        continue;
      }

      try {
        const token = await generateInitialPasswordToken(user.id);
        const emailContent = getInitialPasswordEmailContent(user.email, user.username, token);
        
        emailsToQueue.push({
          email_type: 'initial_password',
          recipient_email: user.email,
          recipient_name: user.username,
          subject: emailContent.subject,
          html_content: emailContent.html,
          from_email: emailContent.from_email,
          from_name: emailContent.from_name,
          user_id: user.id,
          priority: 1
        });
      } catch (error: any) {
        console.error(`✗ Failed to generate token for ${user.email}:`, error.message);
      }
    }

    if (emailsToQueue.length === 0) {
      res.json({
        success: true,
        message: 'Нет пользователей для рассылки (все уже получили письмо)',
        queued: 0,
        skipped,
        total: users.length
      });
      return;
    }

    const batchResult = await emailQueueService.addBatchToQueue(emailsToQueue);

    res.json({
      success: true,
      message: `Рассылка запущена: ${batchResult.queued} писем в очереди, пропущено ${skipped} (уже получили письмо)`,
      batch_id: batchResult.batch_id,
      queued: batchResult.queued,
      skipped,
      total: users.length
    });
  })
);

router.get(
  '/initial-passwords/stats',
  verifyToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN used = TRUE THEN 1 END) as used,
        COUNT(CASE WHEN used = FALSE AND expires_at > NOW() THEN 1 END) as active,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired
       FROM labs.initial_password_tokens`
    );

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  })
);

export default router;
