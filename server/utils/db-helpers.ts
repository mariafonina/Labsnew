import { Response } from 'express';
import { query } from '../db';

export async function findOneOrFail(
  tableName: string,
  conditions: { id: number | string; user_id: number },
  res: Response
) {
  const result = await query(
    `SELECT * FROM labs.${tableName} WHERE id = $1 AND user_id = $2`,
    [conditions.id, conditions.user_id]
  );

  if (result.rows.length === 0) {
    const entityName = tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);
    res.status(404).json({ error: `${entityName} not found` });
    return null;
  }

  return result.rows[0];
}

export async function findAllByUser(tableName: string, userId: number, orderBy = 'created_at DESC') {
  const result = await query(
    `SELECT * FROM labs.${tableName} WHERE user_id = $1 ORDER BY ${orderBy}`,
    [userId]
  );
  return result.rows;
}

export async function deleteOneOrFail(
  tableName: string,
  conditions: { id: number | string; user_id: number },
  res: Response
) {
  const result = await query(
    `DELETE FROM labs.${tableName} WHERE id = $1 AND user_id = $2 RETURNING id`,
    [conditions.id, conditions.user_id]
  );

  if (result.rows.length === 0) {
    const entityName = tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);
    res.status(404).json({ error: `${entityName} not found` });
    return null;
  }

  return result.rows[0];
}
