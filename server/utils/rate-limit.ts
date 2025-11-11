import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

interface SpamRecord {
  content: string;
  timestamp: number;
  count: number;
}

const spamCache = new Map<string, SpamRecord[]>();
const SPAM_WINDOW = 60 * 1000; // 1 minute
const SPAM_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, records] of spamCache.entries()) {
    const filtered = records.filter(r => now - r.timestamp < SPAM_WINDOW * 5);
    if (filtered.length === 0) {
      spamCache.delete(key);
    } else {
      spamCache.set(key, filtered);
    }
  }
}, SPAM_CLEANUP_INTERVAL);

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
});

export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 create operations per minute
  message: 'Too many creation requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Rate limit exceeded. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 read operations per minute
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export function userBasedLimiter(maxRequests: number, windowMs: number) {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of userRequestCounts.entries()) {
      if (now > data.resetTime) {
        userRequestCounts.delete(userId);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userKey = `user:${userId}`;
    const userData = userRequestCounts.get(userKey);

    if (!userData || now > userData.resetTime) {
      userRequestCounts.set(userKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000),
      });
    }

    userData.count++;
    next();
  };
}

export function contentSpamDetector(options: {
  maxDuplicates?: number;
  windowMs?: number;
  minLength?: number;
} = {}) {
  const {
    maxDuplicates = 3,
    windowMs = SPAM_WINDOW,
    minLength = 10,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const content = req.body?.content || req.body?.text || req.body?.message;

    if (!userId || !content || typeof content !== 'string') {
      return next();
    }

    if (content.length < minLength) {
      return next();
    }

    const normalizedContent = content.toLowerCase().trim().replace(/\s+/g, ' ');
    const userKey = `spam:${userId}`;
    const now = Date.now();

    let userRecords = spamCache.get(userKey) || [];
    userRecords = userRecords.filter(r => now - r.timestamp < windowMs);

    const existing = userRecords.find(r => r.content === normalizedContent);

    if (existing) {
      if (existing.count >= maxDuplicates) {
        return res.status(429).json({
          error: 'Duplicate content detected. Please wait before posting the same content again.',
        });
      }
      existing.count++;
      existing.timestamp = now;
    } else {
      userRecords.push({
        content: normalizedContent,
        timestamp: now,
        count: 1,
      });
    }

    spamCache.set(userKey, userRecords);
    next();
  };
}

export function throttle(delayMs: number) {
  const lastRequestTime = new Map<string, number>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of lastRequestTime.entries()) {
      if (now - timestamp > delayMs * 10) {
        lastRequestTime.delete(key);
      }
    }
  }, delayMs * 10);

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    const now = Date.now();
    const lastRequest = lastRequestTime.get(key);

    if (lastRequest && now - lastRequest < delayMs) {
      const waitTime = Math.ceil((delayMs - (now - lastRequest)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitTime} seconds before making another request.`,
        retryAfter: waitTime,
      });
    }

    lastRequestTime.set(key, now);
    next();
  };
}

export function ipBasedLimiter(maxRequests: number, windowMs: number) {
  const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequestCounts.entries()) {
      if (now > data.resetTime) {
        ipRequestCounts.delete(ip);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const ipData = ipRequestCounts.get(ip);

    if (!ipData || now > ipData.resetTime) {
      ipRequestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (ipData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests from this IP. Please try again later.',
        retryAfter: Math.ceil((ipData.resetTime - now) / 1000),
      });
    }

    ipData.count++;
    next();
  };
}

export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request payload too large. Maximum size is 5MB.',
    });
  }

  next();
};

export const burstLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // 20 requests per 10 seconds
  message: 'Too many requests in a short period. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
