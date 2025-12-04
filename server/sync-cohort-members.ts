import { config } from 'dotenv';
import { query } from './db';

config();

async function syncCohortMembers() {
  try {
    console.log('Синхронизация cohort_members с user_enrollments...\n');

    const missingMembers = await query(`
      SELECT ue.user_id, ue.cohort_id, u.email
      FROM labs.user_enrollments ue
      JOIN labs.users u ON ue.user_id = u.id
      LEFT JOIN labs.cohort_members cm ON ue.cohort_id = cm.cohort_id AND ue.user_id = cm.user_id
      WHERE ue.status = 'active'
        AND (cm.id IS NULL OR cm.left_at IS NOT NULL)
    `);

    console.log(`Найдено ${missingMembers.rows.length} записей для синхронизации\n`);

    if (missingMembers.rows.length === 0) {
      console.log('Все данные синхронизированы. Ничего делать не нужно.');
      process.exit(0);
    }

    let synced = 0;
    for (const row of missingMembers.rows) {
      await query(`
        INSERT INTO labs.cohort_members (cohort_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (cohort_id, user_id) DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP
      `, [row.cohort_id, row.user_id]);
      
      synced++;
      if (synced % 100 === 0) {
        console.log(`Синхронизировано ${synced}/${missingMembers.rows.length}...`);
      }
    }

    console.log(`\n✓ Синхронизация завершена! Добавлено ${synced} записей в cohort_members`);

    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM labs.user_enrollments WHERE status = 'active') as total_enrollments,
        (SELECT COUNT(*) FROM labs.cohort_members WHERE left_at IS NULL) as total_members
    `);
    
    console.log('\nСтатистика:');
    console.log(`  Зачислений (user_enrollments): ${stats.rows[0].total_enrollments}`);
    console.log(`  Участников (cohort_members): ${stats.rows[0].total_members}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    process.exit(1);
  }
}

syncCohortMembers();
