import { initializeDatabase } from './init-db';

async function runMigration() {
  try {
    console.log('Running database migration...');
    await initializeDatabase();
    console.log('✓ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
