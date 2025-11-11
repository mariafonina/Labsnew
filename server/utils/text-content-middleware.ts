import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth';
import { createLimiter, contentSpamDetector } from './rate-limit';
import { sanitizeText } from './sanitize';

export function protectedTextSubmission(spamConfig: { 
  maxDuplicates: number; 
  windowMs: number;
}) {
  return [
    verifyToken,
    createLimiter,
    contentSpamDetector(spamConfig),
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.content && typeof req.body.content === 'string') {
        req.body.content = sanitizeText(req.body.content);
      }
      if (req.body.title && typeof req.body.title === 'string') {
        req.body.title = sanitizeText(req.body.title);
      }
      next();
    }
  ];
}
