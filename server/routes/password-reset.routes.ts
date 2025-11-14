import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import {
  generateResetToken,
  sendPasswordResetEmail,
  verifyResetToken,
  markTokenAsUsed,
} from '../utils/password-reset';
import { asyncHandler } from '../utils/async-handler';

const router = express.Router();

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Request password reset
router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email обязателен' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Неверный формат email' });
    }

    // Find user by email
    const userResult = await query(
      'SELECT id, username, email FROM labs.users WHERE email = $1',
      [sanitizedEmail]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({
        message: 'Если email существует в системе, на него отправлена ссылка для сброса пароля',
      });
    }

    const user = userResult.rows[0];

    try {
      // Generate reset token
      const token = await generateResetToken(user.id);

      // Send email
      await sendPasswordResetEmail(user.email, user.username, token);

      res.json({
        message: 'Если email существует в системе, на него отправлена ссылка для сброса пароля',
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({ message: 'Ошибка при отправке письма' });
    }
  })
);

// Verify reset token
router.get(
  '/verify-reset-token/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const verification = await verifyResetToken(token);

    if (!verification.valid) {
      return res.status(400).json({ valid: false, message: verification.message });
    }

    res.json({ valid: true });
  })
);

// Reset password
router.post(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Токен и новый пароль обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }

    // Verify token
    const verification = await verifyResetToken(token);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await query(
      'UPDATE labs.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, verification.userId]
    );

    // Mark token as used
    await markTokenAsUsed(token);

    res.json({ message: 'Пароль успешно изменён' });
  })
);

export default router;
