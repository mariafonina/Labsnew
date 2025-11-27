import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { generateToken } from '../auth';
import { authLimiter } from '../utils/rate-limit';

const router = Router();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await query(
      'SELECT id FROM labs.users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO labs.users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, 'user']
    );

    const user = result.rows[0];

    // Автоматически зачислить в дефолтный продукт и cohort
    const defaultProduct = await query(`
      SELECT p.id as product_id, c.id as cohort_id, pt.id as tier_id
      FROM labs.products p
      JOIN labs.cohorts c ON c.product_id = p.id AND c.name = 'Основной поток'
      JOIN labs.pricing_tiers pt ON pt.cohort_id = c.id AND pt.tier_level = 1
      WHERE p.name = 'Общая программа'
      LIMIT 1
    `);

    if (defaultProduct.rows.length > 0) {
      const { product_id, cohort_id, tier_id } = defaultProduct.rows[0];

      await query(`
        INSERT INTO labs.user_enrollments (user_id, product_id, cohort_id, pricing_tier_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (user_id, product_id, cohort_id) DO NOTHING
      `, [user.id, product_id, cohort_id, tier_id]);

      await query(`
        INSERT INTO labs.cohort_members (cohort_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, user_id) DO NOTHING
      `, [cohort_id, user.id]);
    }

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('[Login] Attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      console.log('[Login] Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await query(
      'SELECT id, username, email, password_hash, role FROM labs.users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log('[Login] User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('[Login] Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    console.log('[Login] Success:', { userId: user.id, username: user.username, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
