import crypto from 'crypto';
import { query } from '../db';
import { notisendClient } from './notisend-client';

const INITIAL_TOKEN_EXPIRY_DAYS = 7;

export async function generateInitialPasswordToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INITIAL_TOKEN_EXPIRY_DAYS);

  await query(
    `INSERT INTO labs.initial_password_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
}

export async function sendInitialPasswordEmail(email: string, username: string, token: string): Promise<void> {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 
    (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DOMAINS?.split(',')[0]}` : 'http://localhost:5000');
  const setupUrl = `${frontendBaseUrl}/setup-password/${token}`;

  const subject = 'Создайте ваш пароль - ЛАБС';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ec4899;">Добро пожаловать в ЛАБС!</h2>
      <p>Здравствуйте, ${username}!</p>
      <p>Для вас создан аккаунт в системе ЛАБС. Чтобы начать работу, необходимо создать пароль.</p>
      <p>Для создания пароля перейдите по ссылке:</p>
      <p style="margin: 20px 0;">
        <a href="${setupUrl}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Создать пароль
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Ссылка действительна в течение ${INITIAL_TOKEN_EXPIRY_DAYS} дней.
      </p>
      <p style="color: #666; font-size: 14px;">
        <strong>Ваш логин:</strong> ${username}<br/>
        <strong>Email:</strong> ${email}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">
        С уважением,<br/>
        Команда ЛАБС
      </p>
    </div>
  `;

  try {
    await notisendClient.sendEmail({
      to: email,
      subject,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Failed to send initial password email:', error);
    if (!process.env.NOTISEND_API_KEY) {
      console.warn('NOTISEND_API_KEY not configured - email sending skipped in development');
    } else {
      throw error;
    }
  }
}

export async function verifyInitialPasswordToken(token: string): Promise<{ valid: boolean; userId?: number; message?: string }> {
  const result = await query(
    `SELECT user_id, expires_at, used 
     FROM labs.initial_password_tokens 
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

export async function markInitialTokenAsUsed(token: string): Promise<void> {
  await query(
    `UPDATE labs.initial_password_tokens 
     SET used = TRUE 
     WHERE token = $1`,
    [token]
  );
}

export async function cleanupExpiredInitialTokens(): Promise<void> {
  await query(
    `DELETE FROM labs.initial_password_tokens 
     WHERE expires_at < NOW()`
  );
}
