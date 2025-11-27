import { config } from 'dotenv';
import { query } from './db';

config();

async function fixEnrollments() {
  try {
    console.log('Checking for users without enrollments...');

    // Find users without active enrollments
    const usersWithoutEnrollments = await query(`
      SELECT u.id, u.email, u.username
      FROM labs.users u
      LEFT JOIN labs.user_enrollments ue ON u.id = ue.user_id AND ue.status = 'active'
      WHERE ue.id IS NULL
    `);

    console.log(`Found ${usersWithoutEnrollments.rows.length} users without enrollments`);

    if (usersWithoutEnrollments.rows.length === 0) {
      console.log('All users have enrollments. Nothing to fix.');
      process.exit(0);
    }

    // Get the default product, cohort, and tier
    const defaultSetup = await query(`
      SELECT p.id as product_id, c.id as cohort_id, pt.id as tier_id
      FROM labs.products p
      JOIN labs.cohorts c ON c.product_id = p.id AND c.name = 'Основной поток'
      JOIN labs.pricing_tiers pt ON pt.cohort_id = c.id AND pt.tier_level = 1
      WHERE p.name = 'Общая программа'
      LIMIT 1
    `);

    if (defaultSetup.rows.length === 0) {
      console.error('Default product/cohort/tier not found. Please run migration first.');
      process.exit(1);
    }

    const { product_id, cohort_id, tier_id } = defaultSetup.rows[0];
    console.log(`Using default setup: product=${product_id}, cohort=${cohort_id}, tier=${tier_id}`);

    // Enroll each user
    for (const user of usersWithoutEnrollments.rows) {
      console.log(`Enrolling user: ${user.email} (ID: ${user.id})`);

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

      console.log(`  ✓ Enrolled ${user.email}`);
    }

    console.log('\n✓ All users enrolled successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing enrollments:', error);
    process.exit(1);
  }
}

fixEnrollments();
