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

    await query(`
      CREATE TABLE IF NOT EXISTS labs.news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        author_avatar VARCHAR(500),
        date VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image VARCHAR(500),
        is_new BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.news" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.recordings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        date VARCHAR(50) NOT NULL,
        duration VARCHAR(50),
        instructor VARCHAR(100) NOT NULL,
        thumbnail VARCHAR(500),
        views INTEGER DEFAULT 0,
        description TEXT,
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.recordings" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.faq (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        helpful INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.faq" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.email_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(300),
        html_content TEXT,
        text_content TEXT,
        template_id VARCHAR(100),
        recipients_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_by INTEGER REFERENCES labs.users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.email_campaigns" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.email_logs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES labs.email_campaigns(id) ON DELETE CASCADE,
        recipient_email VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notisend_id VARCHAR(100),
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.email_logs" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.password_reset_tokens" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.initial_password_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.initial_password_tokens" created');

    const tokenHashExists = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'labs' 
      AND table_name = 'initial_password_tokens' 
      AND column_name = 'token_hash'
    `);

    if (tokenHashExists.rows.length === 0) {
      await query(`ALTER TABLE labs.initial_password_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255)`);
      await query(`ALTER TABLE labs.initial_password_tokens DROP COLUMN IF EXISTS token`);
      console.log('Migrated labs.initial_password_tokens to token_hash');
    }

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
    await query('CREATE INDEX IF NOT EXISTS idx_news_category ON labs.news(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_news_created_at ON labs.news(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON labs.recordings(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_faq_category ON labs.faq(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON labs.email_campaigns(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON labs.email_campaigns(created_by)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON labs.email_logs(campaign_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_status ON labs.email_logs(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON labs.password_reset_tokens(token)');
    await query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON labs.password_reset_tokens(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_initial_password_tokens_user_id ON labs.initial_password_tokens(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_initial_password_tokens_token_hash ON labs.initial_password_tokens(token_hash)');
    console.log('Indexes created');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
