-- Add additional user fields
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE labs.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON labs.users(status);
CREATE INDEX IF NOT EXISTS idx_users_country ON labs.users(country);
