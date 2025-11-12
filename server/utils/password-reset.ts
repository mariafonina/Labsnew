import crypto from 'crypto';
import { query } from '../db';
import { sendSingleEmail } from './notisend-client';

const RESET_TOKEN_EXPIRY_HOURS = 24;

export async function generateResetToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  await query(
    `INSERT INTO labs.password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
}

export async function sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
  const resetUrl = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DOMAINS?.split(',')[0]}` : 'http://localhost:5000'}/reset-password/${token}`;

  const subject = 'Сброс пароля - ЛАБС';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ec4899;">Сброс пароля</h2>
      <p>Здравствуйте, ${username}!</p>
      <p>Вы запросили сброс пароля для вашего аккаунта в системе ЛАБС.</p>
      <p>Для установки нового пароля перейдите по ссылке:</p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Установить новый пароль
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Ссылка действительна в течение ${RESET_TOKEN_EXPIRY_HOURS} часов.
      </p>
      <p style="color: #666; font-size: 14px;">
        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">
        С уважением,<br/>
        Команда ЛАБС
      </p>
    </div>
  `;

  await sendSingleEmail(email, subject, htmlBody);
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean; userId?: number; message?: string }> {
  const result = await query(
    `SELECT user_id, expires_at, used 
     FROM labs.password_reset_tokens 
     WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { valid: false, message: 'Токен не найден' };
  }

  const tokenData = result.rows[0];

  if (tokenData.used) {
    return { valid: false, message: 'Токен уже использован' };
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);

  if (now > expiresAt) {
    return { valid: false, message: 'Срок действия токена истёк' };
  }

  return { valid: true, userId: tokenData.user_id };
}

export async function markTokenAsUsed(token: string): Promise<void> {
  await query(
    `UPDATE labs.password_reset_tokens 
     SET used = TRUE 
     WHERE token = $1`,
    [token]
  );
}

export async function cleanupExpiredTokens(): Promise<void> {
  await query(
    `DELETE FROM labs.password_reset_tokens 
     WHERE expires_at < NOW() OR used = TRUE`
  );
}
