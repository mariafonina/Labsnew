import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'labs-secret-key-change-in-production';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function generateAccessToken(userId: number, role: string): string {
  return jwt.sign({ userId, role, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(
  userId: number,
  token: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<void> {
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await query(
    `INSERT INTO labs.refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, deviceInfo || null, ipAddress || null]
  );
}

export async function validateRefreshToken(token: string): Promise<{ userId: number; role: string } | null> {
  const tokenHash = hashRefreshToken(token);

  const result = await query(
    `SELECT rt.user_id, u.role, rt.expires_at, rt.revoked
     FROM labs.refresh_tokens rt
     JOIN labs.users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const tokenData = result.rows[0];

  if (tokenData.revoked) {
    return null;
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return null;
  }

  return { userId: tokenData.user_id, role: tokenData.role };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashRefreshToken(token);
  await query(
    `UPDATE labs.refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
    [tokenHash]
  );
}

export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await query(
    `UPDATE labs.refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
    [userId]
  );
}

export async function cleanupExpiredRefreshTokens(): Promise<void> {
  await query(
    `DELETE FROM labs.refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
  );
}

export function generateToken(userId: number, role: string): string {
  return generateAccessToken(userId, role);
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
