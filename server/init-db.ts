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
        instruction_id INTEGER REFERENCES labs.instructions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, instruction_id)
      )
    `);
    console.log('Table "labs.favorites" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        instruction_id INTEGER REFERENCES labs.instructions(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, instruction_id)
      )
    `);
    console.log('Table "labs.notes" created');

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

    await query(`
      CREATE INDEX IF NOT EXISTS idx_instructions_user_id ON labs.instructions(user_id);
      CREATE INDEX IF NOT EXISTS idx_instructions_category ON labs.instructions(category);
      CREATE INDEX IF NOT EXISTS idx_events_user_id ON labs.events(user_id);
      CREATE INDEX IF NOT EXISTS idx_events_date ON labs.events(event_date);
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON labs.favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_instruction ON labs.notes(user_id, instruction_id);
      CREATE INDEX IF NOT EXISTS idx_progress_user_instruction ON labs.progress(user_id, instruction_id);
    `);
    console.log('Indexes created');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
