import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { 
  verifyInitialPasswordToken 
} from '../utils/initial-password';

function hashToken(token: string): string {
  const secret = process.env.INITIAL_PASSWORD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('INITIAL_PASSWORD_TOKEN_SECRET is not configured');
  }
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

const router = Router();

router.get(
  '/verify-setup-token/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    
    const verification = await verifyInitialPasswordToken(token);
    
    res.json(verification);
  })
);

router.post(
  '/setup-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const tokenHash = hashToken(token);

      const tokenResult = await client.query(
        `SELECT user_id, expires_at, used 
         FROM labs.initial_password_tokens 
         WHERE token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Токен не найден' });
      }

      const tokenData = tokenResult.rows[0];

      if (tokenData.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Токен уже использован' });
      }

      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (now > expiresAt) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Срок действия токена истёк' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await client.query(
        `UPDATE labs.users 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [passwordHash, tokenData.user_id]
      );

      await client.query(
        `UPDATE labs.initial_password_tokens 
         SET used = TRUE 
         WHERE token_hash = $1`,
        [tokenHash]
      );

      await client.query('COMMIT');

      res.json({ message: 'Password set successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

export default router;
