import { Router, Response } from 'express';
import { query } from '../../db';
import { asyncHandler } from '../../utils/async-handler';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { createLimiter } from '../../utils/rate-limit';
import { 
  generateInitialPasswordToken, 
  sendInitialPasswordEmail,
  cleanupExpiredInitialTokens 
} from '../../utils/initial-password';

const router = Router();

router.post(
  '/send-initial-passwords',
  verifyToken,
  requireAdmin,
  createLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await cleanupExpiredInitialTokens();

    const result = await query(
      `SELECT id, username, email 
       FROM labs.users 
       WHERE role = 'user'
       ORDER BY created_at DESC`
    );

    const users = result.rows;
    
    if (users.length === 0) {
      res.json({
        success: true,
        message: 'Нет пользователей для рассылки',
        sent: 0,
        failed: 0,
        total: 0
      });
      return;
    }

    const results = {
      sent: 0,
      failed: 0,
      total: users.length,
      errors: [] as Array<{ email: string; error: string }>
    };

    for (const user of users) {
      try {
        await query(
          `DELETE FROM labs.initial_password_tokens 
           WHERE user_id = $1 AND used = FALSE`,
          [user.id]
        );

        const token = await generateInitialPasswordToken(user.id);
        await sendInitialPasswordEmail(user.email, user.username, token);
        results.sent++;
        
        console.log(`✓ Sent initial password email to ${user.email}`);
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          email: user.email,
          error: error.message || 'Unknown error'
        });
        console.error(`✗ Failed to send to ${user.email}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Рассылка завершена: отправлено ${results.sent} из ${results.total}`,
      sent: results.sent,
      failed: results.failed,
      total: results.total,
      errors: results.errors.length > 0 ? results.errors : undefined
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
