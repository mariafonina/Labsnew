import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('='.repeat(60));
      console.error('[ASYNC HANDLER ERROR]');
      console.error('Route:', req.method, req.path);
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('='.repeat(60));
      res.status(500).json({ error: 'Internal server error' });
    });
  };
};
