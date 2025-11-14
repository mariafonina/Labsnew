import { Router, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/async-handler';
import { verifyToken, AuthRequest } from '../auth';
import { filterResourcesByAccess } from '../utils/access-control';

const router = Router();

router.get('/', verifyToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM labs.recordings ORDER BY created_at DESC');
  
  const filteredRecordings = await filterResourcesByAccess(
    req.userId!,
    'recording',
    result.rows
  );
  
  res.json(filteredRecordings);
}));

export default router;
