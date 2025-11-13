import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { 
  verifyInitialPasswordToken 
} from '../utils/initial-password';

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

      const tokenHash = await bcrypt.hash(token, 10);

      const tokenResult = await client.query(
        `SELECT user_id, expires_at, used, token_hash 
         FROM labs.initial_password_tokens 
         WHERE user_id IN (
           SELECT user_id FROM labs.initial_password_tokens
         )
         FOR UPDATE`
      );

      let validToken = null;
      for (const row of tokenResult.rows) {
        const isMatch = await bcrypt.compare(token, row.token_hash);
        if (isMatch) {
          validToken = row;
          break;
        }
      }

      if (!validToken) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Токен не найден' });
      }

      if (validToken.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Токен уже использован' });
      }

      const now = new Date();
      const expiresAt = new Date(validToken.expires_at);

      if (now > expiresAt) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Срок действия токена истёк' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await client.query(
        `UPDATE labs.users 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [passwordHash, validToken.user_id]
      );

      await client.query(
        `UPDATE labs.initial_password_tokens 
         SET used = TRUE 
         WHERE user_id = $1 AND used = FALSE`,
        [validToken.user_id]
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
