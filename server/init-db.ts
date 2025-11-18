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
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.users" created');

    // Migrate existing users table to add name fields
    try {
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`);
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`);
      console.log('Added first_name and last_name columns to labs.users');
    } catch (err) {
      // Columns already exist, that's fine
    }

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
      CREATE TABLE IF NOT EXISTS labs.recording_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        recording_id INTEGER REFERENCES labs.recordings(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, recording_id)
      )
    `);
    console.log('Table "labs.recording_views" created');

    await query('CREATE INDEX IF NOT EXISTS idx_recording_views_user_id ON labs.recording_views(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_recording_views_recording_id ON labs.recording_views(recording_id)');

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

    await query(`ALTER TABLE labs.recordings ADD COLUMN IF NOT EXISTS loom_embed_url TEXT`);
    await query(`ALTER TABLE labs.instructions ADD COLUMN IF NOT EXISTS loom_embed_url TEXT`);
    console.log('Added loom_embed_url columns to recordings and instructions');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        type VARCHAR(200) NOT NULL,
        duration_weeks INTEGER,
        default_price DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'not_for_sale',
        project_start_date DATE,
        project_end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.products" created');
    
    await query(`ALTER TABLE labs.products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'not_for_sale'`);
    await query(`ALTER TABLE labs.products ADD COLUMN IF NOT EXISTS project_start_date DATE`);
    await query(`ALTER TABLE labs.products ADD COLUMN IF NOT EXISTS project_end_date DATE`);
    await query(`ALTER TABLE labs.products ALTER COLUMN type TYPE VARCHAR(200)`);
    console.log('Added product status and project dates columns');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.pricing_tiers (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES labs.products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        tier_level INTEGER NOT NULL,
        features JSONB,
        access_start_date DATE,
        access_end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, tier_level)
      )
    `);
    console.log('Table "labs.pricing_tiers" created');
    
    await query(`ALTER TABLE labs.pricing_tiers ADD COLUMN IF NOT EXISTS access_start_date DATE`);
    await query(`ALTER TABLE labs.pricing_tiers ADD COLUMN IF NOT EXISTS access_end_date DATE`);
    console.log('Added access dates to pricing tiers');

    // Миграция: добавить новые поля если их нет
    try {
      await query(`ALTER TABLE labs.pricing_tiers ADD COLUMN IF NOT EXISTS access_start_date DATE`);
      await query(`ALTER TABLE labs.pricing_tiers ADD COLUMN IF NOT EXISTS access_end_date DATE`);
      console.log('Migrated labs.pricing_tiers table');
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.error('Error migrating pricing_tiers table:', err);
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS labs.cohorts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES labs.products(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        max_participants INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.cohorts" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.product_resources (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES labs.products(id) ON DELETE CASCADE,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER NOT NULL,
        min_tier_level INTEGER DEFAULT 1,
        cohort_ids JSONB,
        tier_ids JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, resource_type, resource_id)
      )
    `);
    console.log('Table "labs.product_resources" created');

    // Миграция: добавить новые поля если их нет
    try {
      await query(`ALTER TABLE labs.product_resources ADD COLUMN IF NOT EXISTS cohort_ids JSONB`);
      await query(`ALTER TABLE labs.product_resources ADD COLUMN IF NOT EXISTS tier_ids JSONB`);
      console.log('Migrated labs.product_resources table');
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.error('Error migrating product_resources table:', err);
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS labs.user_enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES labs.products(id) ON DELETE CASCADE,
        pricing_tier_id INTEGER REFERENCES labs.pricing_tiers(id) ON DELETE SET NULL,
        cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'active',
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id, cohort_id)
      )
    `);
    console.log('Table "labs.user_enrollments" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.cohort_members (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        UNIQUE(cohort_id, user_id)
      )
    `);
    console.log('Table "labs.cohort_members" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.content_access (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(50) NOT NULL,
        content_id INTEGER NOT NULL,
        cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE,
        tier_id INTEGER REFERENCES labs.pricing_tiers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(content_type, content_id, cohort_id),
        UNIQUE(content_type, content_id, tier_id)
      )
    `);
    console.log('Table "labs.content_access" created for cohort/tier-based content visibility');

    // Миграция: добавить новые поля к users для нового дизайна админки
    try {
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`);
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS country VARCHAR(100)`);
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
      await query(`ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
      console.log('Added gender, country, city, phone columns to labs.users');
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.error('Error adding user profile fields:', err);
      }
    }

    // Создать таблицу materials для связи контента с потоками (новый дизайн)
    await query(`
      CREATE TABLE IF NOT EXISTS labs.materials (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE,
        material_type VARCHAR(50) NOT NULL,
        material_id INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cohort_id, material_type, material_id)
      )
    `);
    console.log('Table "labs.materials" created for cohort-material relationships');

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
    await query('CREATE INDEX IF NOT EXISTS idx_products_type ON labs.products(type)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_is_active ON labs.products(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_status ON labs.products(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_product_id ON labs.pricing_tiers(product_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_tier_level ON labs.pricing_tiers(tier_level)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_tier_lookup ON labs.pricing_tiers(product_id, tier_level)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohorts_product_id ON labs.cohorts(product_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohorts_dates ON labs.cohorts(start_date, end_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohorts_active ON labs.cohorts(is_active, product_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_product_resources_product ON labs.product_resources(product_id, resource_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_product_resources_resource ON labs.product_resources(resource_type, resource_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_product_resources_tier_level ON labs.product_resources(min_tier_level)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON labs.user_enrollments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_product_id ON labs.user_enrollments(product_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_pricing_tier_id ON labs.user_enrollments(pricing_tier_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_cohort_id ON labs.user_enrollments(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_status ON labs.user_enrollments(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_product ON labs.user_enrollments(user_id, product_id, status)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_enrollments_expires_at ON labs.user_enrollments(expires_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON labs.cohort_members(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON labs.cohort_members(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_cohort_members_active ON labs.cohort_members(cohort_id, user_id) WHERE left_at IS NULL');
    await query('CREATE INDEX IF NOT EXISTS idx_content_access_content ON labs.content_access(content_type, content_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_content_access_cohort ON labs.content_access(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_content_access_tier ON labs.content_access(tier_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_status ON labs.products(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_materials_cohort_id ON labs.materials(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_materials_material ON labs.materials(material_type, material_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_materials_visible ON labs.materials(cohort_id, is_visible)');
    console.log('Indexes created');

    const defaultProduct = await query(`
      SELECT id FROM labs.products WHERE name = 'Общая программа' LIMIT 1
    `);

    if (defaultProduct.rows.length === 0) {
      const product = await query(`
        INSERT INTO labs.products (name, description, type, is_active)
        VALUES ('Общая программа', 'Универсальная образовательная программа для всех пользователей', 'general', TRUE)
        RETURNING id
      `);
      console.log('Default product "Общая программа" created');

      const productId = product.rows[0].id;

      const tier = await query(`
        INSERT INTO labs.pricing_tiers (product_id, name, description, price, tier_level, is_active)
        VALUES ($1, 'Стандартный', 'Полный доступ ко всем материалам', 0.00, 1, TRUE)
        RETURNING id
      `, [productId]);
      console.log('Default pricing tier created');

      const tierId = tier.rows[0].id;

      const cohort = await query(`
        INSERT INTO labs.cohorts (product_id, name, description, start_date, end_date, is_active)
        VALUES ($1, 'Основной поток', 'Основной поток для всех пользователей', '2024-01-01', '2099-12-31', TRUE)
        RETURNING id
      `, [productId]);
      console.log('Default cohort created');

      const cohortId = cohort.rows[0].id;

      const users = await query('SELECT id FROM labs.users');
      
      for (const user of users.rows) {
        await query(`
          INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status)
          VALUES ($1, $2, $3, $4, 'active')
          ON CONFLICT (user_id, product_id, cohort_id) DO NOTHING
        `, [user.id, productId, tierId, cohortId]);

        await query(`
          INSERT INTO labs.cohort_members (cohort_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT (cohort_id, user_id) DO NOTHING
        `, [cohortId, user.id]);
      }
      
      console.log(`Enrolled ${users.rows.length} existing users into default product`);
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
