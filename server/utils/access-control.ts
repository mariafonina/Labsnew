import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';
import { query } from '../db';

export interface UserAccess {
  enrollments: Array<{
    product_id: number;
    product_name: string;
    tier_level: number;
    cohort_id: number | null;
    status: string;
  }>;
}

export async function getUserAccess(userId: number): Promise<UserAccess> {
  const result = await query(`
    SELECT 
      ue.product_id,
      p.name as product_name,
      pt.tier_level,
      ue.cohort_id,
      ue.status
    FROM labs.user_enrollments ue
    JOIN labs.products p ON ue.product_id = p.id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE ue.user_id = $1 
      AND ue.status = 'active'
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  `, [userId]);

  return {
    enrollments: result.rows
  };
}

export async function checkResourceAccess(
  userId: number,
  resourceType: string,
  resourceId: number
): Promise<boolean> {
  const result = await query(`
    SELECT 1
    FROM labs.product_resources pr
    JOIN labs.user_enrollments ue ON pr.product_id = ue.product_id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE ue.user_id = $1
      AND pr.resource_type = $2
      AND pr.resource_id = $3
      AND ue.status = 'active'
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
      AND (pt.tier_level IS NULL OR pt.tier_level >= pr.min_tier_level)
    LIMIT 1
  `, [userId, resourceType, resourceId]);

  return result.rows.length > 0;
}

export async function filterResourcesByAccess(
  userId: number,
  resourceType: string,
  resources: any[]
): Promise<any[]> {
  if (resources.length === 0) return [];

  const resourceIds = resources.map(r => r.id);
  
  const result = await query(`
    SELECT DISTINCT pr.resource_id
    FROM labs.product_resources pr
    JOIN labs.user_enrollments ue ON pr.product_id = ue.product_id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE ue.user_id = $1
      AND pr.resource_type = $2
      AND pr.resource_id = ANY($3)
      AND ue.status = 'active'
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
      AND (pt.tier_level IS NULL OR pt.tier_level >= pr.min_tier_level)
  `, [userId, resourceType, resourceIds]);

  const allowedIds = new Set(result.rows.map(row => row.resource_id));
  return resources.filter(r => allowedIds.has(r.id));
}

export async function accessControlMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userAccess = await getUserAccess(req.userId);
    req.userAccess = userAccess;
    next();
  } catch (error) {
    console.error('Access control error:', error);
    return res.status(500).json({ error: 'Failed to check access permissions' });
  }
}

declare global {
  namespace Express {
    interface Request {
      userAccess?: UserAccess;
    }
  }
}
