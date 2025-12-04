import crypto from 'crypto';
import { query } from '../db';
import { notisendClient } from './notisend-client';

const INITIAL_TOKEN_EXPIRY_DAYS = 7;

export interface InitialPasswordEmailContent {
  subject: string;
  html: string;
  from_email: string;
  from_name: string;
}

function hashToken(token: string): string {
  const secret = process.env.INITIAL_PASSWORD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('INITIAL_PASSWORD_TOKEN_SECRET is not configured');
  }
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export async function generateInitialPasswordToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INITIAL_TOKEN_EXPIRY_DAYS);

  await query(
    `INSERT INTO labs.initial_password_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
}

function getFrontendBaseUrl(): string {
  let frontendBaseUrl = process.env.FRONTEND_BASE_URL;
  
  if (!frontendBaseUrl) {
    if (process.env.REPL_SLUG && process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',');
      frontendBaseUrl = `https://${process.env.REPL_SLUG}.${domains[0]}`;
    } else if (process.env.NODE_ENV === 'development') {
      frontendBaseUrl = 'http://localhost:5173';
    } else {
      frontendBaseUrl = 'http://localhost:5173';
    }
  }

  return frontendBaseUrl.replace(/\/$/, '');
}

export function getInitialPasswordEmailContent(email: string, username: string, token: string): InitialPasswordEmailContent {
  const frontendBaseUrl = getFrontendBaseUrl();
  const setupUrl = `${frontendBaseUrl}/setup-password/${token}`;

  const subject = 'Создайте ваш пароль - ЛАБС';
  const html = `
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

  return {
    subject,
    html,
    from_email: 'noreply@mariafonina.ru',
    from_name: 'ЛАБС',
  };
}

export async function sendInitialPasswordEmail(email: string, username: string, token: string): Promise<void> {
  const content = getInitialPasswordEmailContent(email, username, token);
  const frontendBaseUrl = getFrontendBaseUrl();
  const setupUrl = `${frontendBaseUrl}/setup-password/${token}`;
  
  console.log(`[InitialPassword] Generating setup URL for ${email}: ${setupUrl}`);

  try {
    await notisendClient.sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      from_email: content.from_email,
      from_name: content.from_name,
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
  const tokenHash = hashToken(token);
  
  const result = await query(
    `SELECT user_id, expires_at, used 
     FROM labs.initial_password_tokens 
     WHERE token_hash = $1`,
    [tokenHash]
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
  const tokenHash = hashToken(token);
  
  await query(
    `UPDATE labs.initial_password_tokens 
     SET used = TRUE 
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

export async function cleanupExpiredInitialTokens(): Promise<void> {
  await query(
    `DELETE FROM labs.initial_password_tokens 
     WHERE expires_at < NOW()`
  );
}
