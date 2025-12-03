import { Router } from 'express';
import { query } from '../db';
import { verifyToken, requireAdmin, AuthRequest } from '../auth';

const router = Router();

// Get all categories
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.userRole === 'admin';
    
    // Admin sees all categories, users see only visible ones
    const visibilityFilter = isAdmin ? '' : 'WHERE is_visible = true';
    const result = await query(
      `SELECT * FROM labs.instruction_categories ${visibilityFilter} ORDER BY display_order ASC, created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instruction categories:', error);
    res.status(500).json({ error: 'Ошибка при получении категорий' });
  }
});

// Create category (admin only)
router.post('/', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    // Get max order
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM labs.instruction_categories'
    );
    const maxOrder = maxOrderResult.rows[0].max_order;

    const result = await query(
      'INSERT INTO labs.instruction_categories (name, description, display_order) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, maxOrder + 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating instruction category:', error);
    res.status(500).json({ error: 'Ошибка при создании категории' });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
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
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(id);

    const result = await query(
      `UPDATE labs.instruction_categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating instruction category:', error);
    res.status(500).json({ error: 'Ошибка при обновлении категории' });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if category has instructions
    const instructionsCheck = await query(
      'SELECT COUNT(*) as count FROM labs.instructions WHERE category_id = $1',
      [id]
    );

    if (parseInt(instructionsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Невозможно удалить категорию с инструкциями. Сначала удалите или переместите инструкции.'
      });
    }

    const result = await query(
      'DELETE FROM labs.instruction_categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Error deleting instruction category:', error);
    res.status(500).json({ error: 'Ошибка при удалении категории' });
  }
});

// Reorder categories (admin only)
router.post('/reorder', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { categories } = req.body; // Array of { id, order }

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Неверный формат данных' });
    }

    // Update orders in a transaction
    for (const cat of categories) {
      await query(
        'UPDATE labs.instruction_categories SET display_order = $1 WHERE id = $2',
        [cat.order, cat.id]
      );
    }

    res.json({ message: 'Порядок категорий обновлен' });
  } catch (error) {
    console.error('Error reordering instruction categories:', error);
    res.status(500).json({ error: 'Ошибка при изменении порядка категорий' });
  }
});

// Toggle category visibility (admin only)
router.patch('/:id/visibility', verifyToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    if (typeof is_visible !== 'boolean') {
      return res.status(400).json({ error: 'is_visible должен быть boolean' });
    }

    const result = await query(
      'UPDATE labs.instruction_categories SET is_visible = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_visible, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling instruction category visibility:', error);
    res.status(500).json({ error: 'Ошибка при изменении видимости категории' });
  }
});

export default router;
