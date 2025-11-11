import { query } from './db';

export async function initializeDatabase() {
  try {
    console.log('Initializing database schema and tables...');

    await query('CREATE SCHEMA IF NOT EXISTS labs');
    console.log('Schema "labs" created or already exists');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.users" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.instructions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        tags TEXT[],
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.instructions" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME,
        location VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.events" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        item_type VARCHAR(20) NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        title VARCHAR(200),
        description TEXT,
        date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_type, item_id)
      )
    `);
    console.log('Table "labs.favorites" created');
    
    // Migrate existing favorites table if it exists with old schema
    try {
      await query(`ALTER TABLE labs.favorites ADD COLUMN IF NOT EXISTS item_type VARCHAR(20)`);
      await query(`ALTER TABLE labs.favorites ADD COLUMN IF NOT EXISTS item_id VARCHAR(100)`);
      await query(`ALTER TABLE labs.favorites ADD COLUMN IF NOT EXISTS title VARCHAR(200)`);
      await query(`ALTER TABLE labs.favorites ADD COLUMN IF NOT EXISTS description TEXT`);
      await query(`ALTER TABLE labs.favorites ADD COLUMN IF NOT EXISTS date VARCHAR(50)`);
      console.log('Migrated labs.favorites to new schema');
    } catch (err) {
      // Columns already exist, that's fine
    }

    await query(`
      CREATE TABLE IF NOT EXISTS labs.notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        title VARCHAR(200),
        content TEXT NOT NULL,
        linked_item JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.notes" created');
    
    // Migrate existing notes table if it exists with old schema
    try {
      await query(`ALTER TABLE labs.notes ADD COLUMN IF NOT EXISTS title VARCHAR(200)`);
      await query(`ALTER TABLE labs.notes ADD COLUMN IF NOT EXISTS linked_item JSONB`);
      // Drop old constraint if exists
      await query(`ALTER TABLE labs.notes DROP CONSTRAINT IF EXISTS notes_user_id_instruction_id_key`);
      console.log('Migrated labs.notes to new schema');
    } catch (err) {
      // Columns already exist, that's fine
    }

    await query(`
      CREATE TABLE IF NOT EXISTS labs.questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        instruction_id INTEGER REFERENCES labs.instructions(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT,
        is_correct BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.questions" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        event_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(20),
        event_title VARCHAR(200),
        author_name VARCHAR(100) NOT NULL,
        author_role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES labs.comments(id) ON DELETE CASCADE,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.comments" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        instruction_id INTEGER REFERENCES labs.instructions(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, instruction_id)
      )
    `);
    console.log('Table "labs.progress" created');

    await query('CREATE INDEX IF NOT EXISTS idx_instructions_user_id ON labs.instructions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_category ON labs.instructions(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_user_id ON labs.events(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_date ON labs.events(event_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON labs.favorites(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_favorites_item ON labs.favorites(item_type, item_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON labs.notes(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_event_id ON labs.comments(event_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON labs.comments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_progress_user_instruction ON labs.progress(user_id, instruction_id)');
    console.log('Indexes created');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
