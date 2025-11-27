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
      CREATE TABLE IF NOT EXISTS labs.instruction_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.instruction_categories" created');

    await query(`
      CREATE TABLE IF NOT EXISTS labs.instructions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES labs.users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES labs.instruction_categories(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        tags TEXT[],
        image_url VARCHAR(500),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.instructions" created');

    // Migrate existing instructions table
    try {
      await query(`ALTER TABLE labs.instructions ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES labs.instruction_categories(id) ON DELETE SET NULL`);
      await query(`ALTER TABLE labs.instructions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);
      console.log('Migrated labs.instructions table');
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.error('Error migrating instructions table:', err);
      }
    }

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
        segment_type VARCHAR(20) DEFAULT 'all',
        segment_product_id INTEGER,
        segment_cohort_id INTEGER,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES labs.users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.email_campaigns" created');

    // Migrate existing email_campaigns table
    try {
      await query(`ALTER TABLE labs.email_campaigns ADD COLUMN IF NOT EXISTS segment_type VARCHAR(20) DEFAULT 'all'`);
      await query(`ALTER TABLE labs.email_campaigns ADD COLUMN IF NOT EXISTS segment_product_id INTEGER`);
      await query(`ALTER TABLE labs.email_campaigns ADD COLUMN IF NOT EXISTS segment_cohort_id INTEGER`);
      await query(`ALTER TABLE labs.email_campaigns ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0`);
      await query(`ALTER TABLE labs.email_campaigns ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0`);
      await query(`UPDATE labs.email_campaigns SET segment_type = 'all', opened_count = 0, clicked_count = 0 WHERE segment_type IS NULL`);
      console.log('Migrated labs.email_campaigns for segmentation');
    } catch (err) {
      // Columns already exist, that's fine
    }

    await query(`
      CREATE TABLE IF NOT EXISTS labs.email_logs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES labs.email_campaigns(id) ON DELETE CASCADE,
        recipient_email VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notisend_id VARCHAR(100),
        error_message TEXT,
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        last_opened_at TIMESTAMP,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "labs.email_logs" created');

    // Migrate existing email_logs table
    try {
      await query(`ALTER TABLE labs.email_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP`);
      await query(`ALTER TABLE labs.email_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP`);
      await query(`ALTER TABLE labs.email_logs ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP`);
      await query(`ALTER TABLE labs.email_logs ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0`);
      await query(`ALTER TABLE labs.email_logs ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0`);
      await query(`UPDATE labs.email_logs SET open_count = 0, click_count = 0 WHERE open_count IS NULL`);
      console.log('Migrated labs.email_logs for tracking');
    } catch (err) {
      // Columns already exist, that's fine
    }

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
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        tier_level INTEGER,
        features JSONB,
        access_start_date DATE,
        access_end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Миграция: перенести тарифы с product_id на cohort_id
    try {
      await query(`ALTER TABLE labs.pricing_tiers ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      console.log('Added cohort_id to pricing_tiers');

      // Удалить старый UNIQUE constraint если он есть
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pricing_tiers_product_id_tier_level_key'
          ) THEN
            ALTER TABLE labs.pricing_tiers DROP CONSTRAINT pricing_tiers_product_id_tier_level_key;
          END IF;
        END $$;
      `);
      console.log('Removed old UNIQUE constraint from pricing_tiers');

      // Удалить новый UNIQUE constraint если он есть (чтобы можно было сделать tier_level nullable)
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pricing_tiers_cohort_id_tier_level_key'
          ) THEN
            ALTER TABLE labs.pricing_tiers DROP CONSTRAINT pricing_tiers_cohort_id_tier_level_key;
          END IF;
        END $$;
      `);
      console.log('Removed cohort_id/tier_level UNIQUE constraint from pricing_tiers');

      // Сделать tier_level nullable
      await query(`ALTER TABLE labs.pricing_tiers ALTER COLUMN tier_level DROP NOT NULL`);
      console.log('Made tier_level nullable in pricing_tiers');

      // ГЛАВНАЯ МИГРАЦИЯ: Перенести тарифы без cohort_id на первый поток продукта
      // Сначала проверим, существует ли колонка product_id
      const productIdColumnExists = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'labs'
        AND table_name = 'pricing_tiers'
        AND column_name = 'product_id'
      `);

      if (productIdColumnExists.rows.length > 0) {
        const tiersWithoutCohort = await query(`
          SELECT pt.id, pt.product_id
          FROM labs.pricing_tiers pt
          WHERE pt.cohort_id IS NULL AND pt.product_id IS NOT NULL
        `);

        if (tiersWithoutCohort.rows.length > 0) {
          console.log(`Found ${tiersWithoutCohort.rows.length} tiers without cohort_id, migrating...`);

          for (const tier of tiersWithoutCohort.rows) {
            // Найти первый активный поток для этого продукта
            const cohort = await query(`
              SELECT id FROM labs.cohorts
              WHERE product_id = $1 AND is_active = TRUE
              ORDER BY created_at ASC
              LIMIT 1
            `, [tier.product_id]);

            if (cohort.rows.length > 0) {
              await query(`
                UPDATE labs.pricing_tiers
                SET cohort_id = $1
                WHERE id = $2
              `, [cohort.rows[0].id, tier.id]);
              console.log(`  Migrated tier ${tier.id} to cohort ${cohort.rows[0].id}`);
            } else {
              console.warn(`  WARNING: No cohort found for product ${tier.product_id}, tier ${tier.id} will remain without cohort`);
            }
          }
        }
      } else {
        console.log('Column product_id does not exist in pricing_tiers, skipping migration');
      }

      // Удалить старые индексы для product_id
      await query(`DROP INDEX IF EXISTS labs.idx_pricing_tiers_product_id`);
      await query(`DROP INDEX IF EXISTS labs.idx_pricing_tiers_tier_lookup`);
      console.log('Dropped old pricing_tiers indexes for product_id');

      // Удалить product_id foreign key constraint
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'pricing_tiers_product_id_fkey'
            AND table_schema = 'labs'
          ) THEN
            ALTER TABLE labs.pricing_tiers DROP CONSTRAINT pricing_tiers_product_id_fkey;
            RAISE NOTICE 'Dropped product_id foreign key constraint from pricing_tiers';
          END IF;
        END $$;
      `);
      console.log('Dropped product_id foreign key from pricing_tiers');

      // Удалить колонку product_id
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'labs'
            AND table_name = 'pricing_tiers'
            AND column_name = 'product_id'
          ) THEN
            ALTER TABLE labs.pricing_tiers DROP COLUMN product_id;
            RAISE NOTICE 'Dropped product_id column from pricing_tiers';
          END IF;
        END $$;
      `);
      console.log('Dropped product_id column from pricing_tiers');

      // Сделать cohort_id обязательным
      await query(`ALTER TABLE labs.pricing_tiers ALTER COLUMN cohort_id SET NOT NULL`);
      console.log('Made cohort_id NOT NULL in pricing_tiers');

    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.error('Error migrating pricing_tiers to cohort-based:', err);
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

    // Таблица для категорий базы знаний потоков
    await query(`
      CREATE TABLE IF NOT EXISTS labs.cohort_knowledge_categories (
        id SERIAL PRIMARY KEY,
        cohort_id INTEGER NOT NULL REFERENCES labs.cohorts(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cohort_id, name)
      )
    `);
    console.log('Table "labs.cohort_knowledge_categories" created');

    // Индексы для cohort_knowledge_categories
    await query(`
      CREATE INDEX IF NOT EXISTS idx_cohort_knowledge_categories_cohort_id
        ON labs.cohort_knowledge_categories(cohort_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_cohort_knowledge_categories_display_order
        ON labs.cohort_knowledge_categories(cohort_id, display_order)
    `);
    console.log('Indexes for "labs.cohort_knowledge_categories" created');

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

    // Добавить foreign key constraints для email_campaigns после создания products/cohorts
    try {
      await query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'email_campaigns_segment_product_id_fkey'
            AND table_schema = 'labs'
          ) THEN
            ALTER TABLE labs.email_campaigns
            ADD CONSTRAINT email_campaigns_segment_product_id_fkey
            FOREIGN KEY (segment_product_id) REFERENCES labs.products(id);
          END IF;
        END $$;
      `);
      await query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'email_campaigns_segment_cohort_id_fkey'
            AND table_schema = 'labs'
          ) THEN
            ALTER TABLE labs.email_campaigns
            ADD CONSTRAINT email_campaigns_segment_cohort_id_fkey
            FOREIGN KEY (segment_cohort_id) REFERENCES labs.cohorts(id);
          END IF;
        END $$;
      `);
      console.log('Added foreign key constraints to email_campaigns');
    } catch (err) {
      // Constraints already exist, that's fine
    }

    // Migration: Add cohort_id to materials tables
    try {
      await query(`ALTER TABLE labs.instructions ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      await query(`ALTER TABLE labs.recordings ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      await query(`ALTER TABLE labs.news ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      await query(`ALTER TABLE labs.events ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      await query(`ALTER TABLE labs.faq ADD COLUMN IF NOT EXISTS cohort_id INTEGER REFERENCES labs.cohorts(id) ON DELETE CASCADE`);
      console.log('Added cohort_id to materials tables (instructions, recordings, news, events, faq)');
    } catch (err) {
      console.error('Error adding cohort_id to materials tables:', err);
    }

    // Migration: Add cohort_category_id to instructions for cohort knowledge base
    try {
      await query(`ALTER TABLE labs.instructions ADD COLUMN IF NOT EXISTS cohort_category_id INTEGER REFERENCES labs.cohort_knowledge_categories(id) ON DELETE SET NULL`);
      console.log('Added cohort_category_id to labs.instructions');
    } catch (err) {
      console.error('Error adding cohort_category_id to instructions:', err);
    }

    await query('CREATE INDEX IF NOT EXISTS idx_instructions_user_id ON labs.instructions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_category ON labs.instructions(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_category_id ON labs.instructions(category_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_display_order ON labs.instructions(category_id, display_order)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_cohort_id ON labs.instructions(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_cohort_category_id ON labs.instructions(cohort_category_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_instructions_cohort_lookup ON labs.instructions(cohort_id, cohort_category_id, display_order)');
    await query('CREATE INDEX IF NOT EXISTS idx_instruction_categories_display_order ON labs.instruction_categories(display_order)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_user_id ON labs.events(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_date ON labs.events(event_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_cohort_id ON labs.events(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON labs.favorites(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_favorites_item ON labs.favorites(item_type, item_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON labs.notes(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_event_id ON labs.comments(event_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON labs.comments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_progress_user_instruction ON labs.progress(user_id, instruction_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_news_category ON labs.news(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_news_created_at ON labs.news(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_news_cohort_id ON labs.news(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON labs.recordings(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_recordings_cohort_id ON labs.recordings(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_faq_category ON labs.faq(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_faq_cohort_id ON labs.faq(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON labs.email_campaigns(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON labs.email_campaigns(created_by)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON labs.email_logs(campaign_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_status ON labs.email_logs(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON labs.email_logs(campaign_id, status, opened_at, clicked_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_opened ON labs.email_logs(opened_at) WHERE opened_at IS NOT NULL');
    await query('CREATE INDEX IF NOT EXISTS idx_email_logs_clicked ON labs.email_logs(clicked_at) WHERE clicked_at IS NOT NULL');
    await query('CREATE INDEX IF NOT EXISTS idx_campaigns_segment ON labs.email_campaigns(segment_type, segment_product_id, segment_cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON labs.password_reset_tokens(token)');
    await query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON labs.password_reset_tokens(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_initial_password_tokens_user_id ON labs.initial_password_tokens(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_initial_password_tokens_token_hash ON labs.initial_password_tokens(token_hash)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_type ON labs.products(type)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_is_active ON labs.products(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_status ON labs.products(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_cohort_id ON labs.pricing_tiers(cohort_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_tier_level ON labs.pricing_tiers(tier_level)');
    await query('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_cohort_lookup ON labs.pricing_tiers(cohort_id, tier_level)');
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

    // Миграция: копировать категории в cohort_knowledge_categories для существующих потоков
    try {
      console.log('Starting cohort knowledge categories migration...');
      const cohortsWithInstructions = await query(`
        SELECT DISTINCT cohort_id
        FROM labs.instructions
        WHERE cohort_id IS NOT NULL
      `);

      console.log(`Found ${cohortsWithInstructions.rows.length} cohorts with instructions`);

      for (const cohortRow of cohortsWithInstructions.rows) {
        const cohortId = cohortRow.cohort_id;

        // Копируем категории из instruction_categories
        const existingCategories = await query(`
          SELECT DISTINCT ic.*
          FROM labs.instruction_categories ic
          INNER JOIN labs.instructions i ON i.category_id = ic.id
          WHERE i.cohort_id = $1
          ORDER BY ic.display_order
        `, [cohortId]);

        console.log(`  Cohort ${cohortId}: migrating ${existingCategories.rows.length} categories`);

        for (const category of existingCategories.rows) {
          // Вставляем категорию в cohort_knowledge_categories
          const newCategory = await query(`
            INSERT INTO labs.cohort_knowledge_categories
              (cohort_id, name, description, display_order)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (cohort_id, name) DO UPDATE SET display_order = EXCLUDED.display_order
            RETURNING id
          `, [cohortId, category.name, category.description, category.display_order]);

          const newCategoryId = newCategory.rows[0].id;

          // Обновляем инструкции этой категории
          const updateResult = await query(`
            UPDATE labs.instructions
            SET cohort_category_id = $1
            WHERE cohort_id = $2
              AND category_id = $3
              AND cohort_category_id IS NULL
          `, [newCategoryId, cohortId, category.id]);

          console.log(`    Category "${category.name}": ${updateResult.rowCount} instructions updated`);
        }
      }

      console.log('Cohort knowledge categories migration completed');
    } catch (err) {
      console.error('Error migrating cohort knowledge categories:', err);
      // Не бросаем ошибку, продолжаем инициализацию
    }

    // Миграция: удалить старые enrollments без cohort_id (невалидные данные)
    try {
      const invalidEnrollments = await query(`
        DELETE FROM labs.user_enrollments
        WHERE cohort_id IS NULL
        RETURNING id
      `);

      if (invalidEnrollments.rows.length > 0) {
        console.log(`Deleted ${invalidEnrollments.rows.length} invalid enrollments without cohort_id`);
      }
    } catch (err) {
      console.error('Error cleaning up invalid enrollments:', err);
    }

    // Миграция: создать enrollments для пользователей в cohort_members без enrollments
    try {
      console.log('Syncing cohort members with enrollments...');

      const orphanedMembers = await query(`
        SELECT DISTINCT cm.cohort_id, cm.user_id, c.product_id
        FROM labs.cohort_members cm
        JOIN labs.cohorts c ON cm.cohort_id = c.id
        LEFT JOIN labs.user_enrollments ue ON ue.user_id = cm.user_id
          AND ue.cohort_id = cm.cohort_id
          AND ue.product_id = c.product_id
        WHERE cm.left_at IS NULL
          AND ue.id IS NULL
      `);

      if (orphanedMembers.rows.length > 0) {
        console.log(`Found ${orphanedMembers.rows.length} cohort members without enrollments, creating...`);

        for (const member of orphanedMembers.rows) {
          // Найти первый тариф для этого потока
          const tier = await query(`
            SELECT id FROM labs.pricing_tiers
            WHERE cohort_id = $1
            ORDER BY tier_level ASC NULLS LAST, id ASC
            LIMIT 1
          `, [member.cohort_id]);

          if (tier.rows.length > 0) {
            await query(`
              INSERT INTO labs.user_enrollments (user_id, product_id, pricing_tier_id, cohort_id, status)
              VALUES ($1, $2, $3, $4, 'active')
              ON CONFLICT (user_id, product_id, cohort_id) DO NOTHING
            `, [member.user_id, member.product_id, tier.rows[0].id, member.cohort_id]);

            console.log(`  Created enrollment for user ${member.user_id} in cohort ${member.cohort_id}`);
          } else {
            console.warn(`  WARNING: No tier found for cohort ${member.cohort_id}, skipping user ${member.user_id}`);
          }
        }
      }
    } catch (err) {
      console.error('Error syncing cohort members with enrollments:', err);
    }

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

      const cohort = await query(`
        INSERT INTO labs.cohorts (product_id, name, description, start_date, end_date, is_active)
        VALUES ($1, 'Основной поток', 'Основной поток для всех пользователей', '2024-01-01', '2099-12-31', TRUE)
        RETURNING id
      `, [productId]);
      console.log('Default cohort created');

      const cohortId = cohort.rows[0].id;

      const tier = await query(`
        INSERT INTO labs.pricing_tiers (cohort_id, name, description, price, tier_level, is_active)
        VALUES ($1, 'Стандартный', 'Полный доступ ко всем материалам', 0.00, 1, TRUE)
        RETURNING id
      `, [cohortId]);
      console.log('Default pricing tier created');

      const tierId = tier.rows[0].id;

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
