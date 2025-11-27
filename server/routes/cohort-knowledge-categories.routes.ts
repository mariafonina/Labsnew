import { Router } from 'express';
import { query } from '../db';
import { verifyToken, requireAdmin, AuthRequest } from '../auth';

const router = Router({ mergeParams: true });

// Get all categories for a cohort
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { cohortId } = req.params;

    // Verify user has access to this cohort
    const accessCheck = await query(`
      SELECT 1 FROM labs.user_enrollments
      WHERE user_id = $1 AND cohort_id = $2 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    `, [req.userId, cohortId]);

    if (accessCheck.rows.length === 0 && req.user?.role !== 'admin') {
      return res.status(403).json({ error: '\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u044d\u0442\u043e\u043c\u0443 \u043f\u043e\u0442\u043e\u043a\u0443' });
    }

    const result = await query(
      'SELECT * FROM labs.cohort_knowledge_categories WHERE cohort_id = $1 ORDER BY display_order ASC, created_at ASC',
      [cohortId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cohort knowledge categories:', error);
    res.status(500).json({ error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0439' });
  }
});

// Create category (admin only)
router.post('/', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { cohortId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e' });
    }

    // Get max order for this cohort
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM labs.cohort_knowledge_categories WHERE cohort_id = $1',
      [cohortId]
    );
    const maxOrder = maxOrderResult.rows[0].max_order;

    const result = await query(
      'INSERT INTO labs.cohort_knowledge_categories (cohort_id, name, description, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [cohortId, name, description || null, maxOrder + 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating cohort knowledge category:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f \u0441 \u0442\u0430\u043a\u0438\u043c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435\u043c \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u044d\u0442\u043e\u043c \u043f\u043e\u0442\u043e\u043a\u0435' });
    }
    res.status(500).json({ error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438' });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { cohortId, id } = req.params;
    const { name, description, display_order } = req.body;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (display_order !== undefined) {
      updateFields.push(`display_order = $${paramIndex++}`);
      values.push(display_order);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: '\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f' });
    }

    values.push(id);
    values.push(cohortId);

    const result = await query(
      `UPDATE labs.cohort_knowledge_categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND cohort_id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cohort knowledge category:', error);
    res.status(500).json({ error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438' });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { cohortId, id } = req.params;

    // Check if category has instructions
    const instructionsCheck = await query(
      'SELECT COUNT(*) as count FROM labs.instructions WHERE cohort_category_id = $1',
      [id]
    );

    if (parseInt(instructionsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: '\u041d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044e \u0441 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f\u043c\u0438. \u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0443\u0434\u0430\u043b\u0438\u0442\u0435 \u0438\u043b\u0438 \u043f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438.'
      });
    }

    const result = await query(
      'DELETE FROM labs.cohort_knowledge_categories WHERE id = $1 AND cohort_id = $2 RETURNING *',
      [id, cohortId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430' });
    }

    res.json({ message: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f \u0443\u0434\u0430\u043b\u0435\u043d\u0430' });
  } catch (error) {
    console.error('Error deleting cohort knowledge category:', error);
    res.status(500).json({ error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438' });
  }
});

// Reorder categories (admin only)
router.post('/reorder', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { cohortId } = req.params;
    const { categories } = req.body; // Array of { id, order }

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0434\u0430\u043d\u043d\u044b\u0445' });
    }

    // Update orders in a transaction
    for (const cat of categories) {
      await query(
        'UPDATE labs.cohort_knowledge_categories SET display_order = $1 WHERE id = $2 AND cohort_id = $3',
        [cat.order, cat.id, cohortId]
      );
    }

    res.json({ message: '\u041f\u043e\u0440\u044f\u0434\u043e\u043a \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0439 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d' });
  } catch (error) {
    console.error('Error reordering cohort knowledge categories:', error);
    res.status(500).json({ error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0438 \u043f\u043e\u0440\u044f\u0434\u043a\u0430 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0439' });
  }
});

export default router;
