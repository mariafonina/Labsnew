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
  // Получаем информацию о ресурсе и зачислениях пользователя
  const result = await query(`
    SELECT 
      pr.cohort_ids,
      pr.tier_ids,
      pr.min_tier_level,
      ue.cohort_id,
      ue.pricing_tier_id,
      pt.tier_level
    FROM labs.product_resources pr
    JOIN labs.user_enrollments ue ON pr.product_id = ue.product_id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE ue.user_id = $1
      AND pr.resource_type = $2
      AND pr.resource_id = $3
      AND ue.status = 'active'
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  `, [userId, resourceType, resourceId]);

  if (result.rows.length === 0) {
    return false;
  }

  // Проверяем каждое зачисление
  for (const row of result.rows) {
    let hasAccess = true;

    // Проверка cohort_ids
    if (row.cohort_ids) {
      const cohortIds = Array.isArray(row.cohort_ids) ? row.cohort_ids : JSON.parse(row.cohort_ids);
      if (cohortIds && cohortIds.length > 0) {
        // Пользователь должен быть в одном из указанных потоков
        if (!row.cohort_id || !cohortIds.includes(row.cohort_id)) {
          hasAccess = false;
          continue;
        }
      }
    }

    // Проверка tier_ids
    if (row.tier_ids) {
      const tierIds = Array.isArray(row.tier_ids) ? row.tier_ids : JSON.parse(row.tier_ids);
      if (tierIds && tierIds.length > 0) {
        // Тариф пользователя должен быть в списке
        if (!row.pricing_tier_id || !tierIds.includes(row.pricing_tier_id)) {
          hasAccess = false;
          continue;
        }
      }
    }

    // Проверка min_tier_level (обратная совместимость)
    if (row.min_tier_level && (!row.tier_ids || (Array.isArray(row.tier_ids) ? row.tier_ids.length === 0 : JSON.parse(row.tier_ids).length === 0))) {
      if (!row.tier_level || row.tier_level < row.min_tier_level) {
        hasAccess = false;
        continue;
      }
    }

    if (hasAccess) {
      return true;
    }
  }

  return false;
}

export async function filterResourcesByAccess(
  userId: number,
  resourceType: string,
  resources: any[]
): Promise<any[]> {
  if (resources.length === 0) return [];

  const resourceIds = resources.map(r => r.id);
  
  // Получаем все ресурсы с информацией о доступе
  const result = await query(`
    SELECT 
      pr.resource_id,
      pr.cohort_ids,
      pr.tier_ids,
      pr.min_tier_level,
      ue.cohort_id,
      ue.pricing_tier_id,
      pt.tier_level
    FROM labs.product_resources pr
    JOIN labs.user_enrollments ue ON pr.product_id = ue.product_id
    LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
    WHERE ue.user_id = $1
      AND pr.resource_type = $2
      AND pr.resource_id = ANY($3)
      AND ue.status = 'active'
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  `, [userId, resourceType, resourceIds]);

  // Группируем по resource_id и проверяем доступ
  const resourceAccessMap = new Map<number, boolean>();
  
  for (const row of result.rows) {
    if (resourceAccessMap.has(row.resource_id) && resourceAccessMap.get(row.resource_id)) {
      continue; // Уже есть доступ
    }

    let hasAccess = true;

    // Проверка cohort_ids
    if (row.cohort_ids) {
      const cohortIds = Array.isArray(row.cohort_ids) ? row.cohort_ids : JSON.parse(row.cohort_ids);
      if (cohortIds && cohortIds.length > 0) {
        if (!row.cohort_id || !cohortIds.includes(row.cohort_id)) {
          hasAccess = false;
          continue;
        }
      }
    }

    // Проверка tier_ids
    if (row.tier_ids) {
      const tierIds = Array.isArray(row.tier_ids) ? row.tier_ids : JSON.parse(row.tier_ids);
      if (tierIds && tierIds.length > 0) {
        if (!row.pricing_tier_id || !tierIds.includes(row.pricing_tier_id)) {
          hasAccess = false;
          continue;
        }
      }
    }

    // Проверка min_tier_level (обратная совместимость)
    if (row.min_tier_level && (!row.tier_ids || (Array.isArray(row.tier_ids) ? row.tier_ids.length === 0 : JSON.parse(row.tier_ids).length === 0))) {
      if (!row.tier_level || row.tier_level < row.min_tier_level) {
        hasAccess = false;
        continue;
      }
    }

    if (hasAccess) {
      resourceAccessMap.set(row.resource_id, true);
    }
  }

  const allowedIds = new Set(Array.from(resourceAccessMap.entries())
    .filter(([_, hasAccess]) => hasAccess)
    .map(([resourceId, _]) => resourceId));
  
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
