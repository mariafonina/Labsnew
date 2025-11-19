-- Migration 001: Email Tracking & Segmentation
-- Adds fields for tracking email opens, clicks, and campaign segmentation

-- Email logs tracking fields
ALTER TABLE labs.email_logs
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Update existing rows to have default values
UPDATE labs.email_logs
SET open_count = 0, click_count = 0
WHERE open_count IS NULL;

-- Email campaigns segmentation fields
ALTER TABLE labs.email_campaigns
  ADD COLUMN IF NOT EXISTS segment_type VARCHAR(20) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS segment_product_id INTEGER REFERENCES labs.products(id),
  ADD COLUMN IF NOT EXISTS segment_cohort_id INTEGER REFERENCES labs.cohorts(id),
  ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;

-- Backfill existing campaigns
UPDATE labs.email_campaigns
SET segment_type = 'all', opened_count = 0, clicked_count = 0
WHERE segment_type IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking
  ON labs.email_logs(campaign_id, status, opened_at, clicked_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_opened
  ON labs.email_logs(opened_at)
  WHERE opened_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_clicked
  ON labs.email_logs(clicked_at)
  WHERE clicked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_segment
  ON labs.email_campaigns(segment_type, segment_product_id, segment_cohort_id);

-- Optimize common queries
CREATE INDEX IF NOT EXISTS idx_cohort_members_count
  ON labs.cohort_members(cohort_id)
  WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_enrollments_active
  ON labs.user_enrollments(product_id, status, cohort_id)
  WHERE status = 'active';

-- Covering index for products admin list
CREATE INDEX IF NOT EXISTS idx_products_admin_list
  ON labs.products(id, name, created_at)
  WHERE is_active = TRUE;
