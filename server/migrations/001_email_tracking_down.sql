-- Rollback Migration 001: Email Tracking & Segmentation

-- Drop indexes
DROP INDEX IF EXISTS labs.idx_email_logs_tracking;
DROP INDEX IF EXISTS labs.idx_email_logs_opened;
DROP INDEX IF EXISTS labs.idx_email_logs_clicked;
DROP INDEX IF EXISTS labs.idx_campaigns_segment;
DROP INDEX IF EXISTS labs.idx_cohort_members_count;
DROP INDEX IF EXISTS labs.idx_user_enrollments_active;
DROP INDEX IF EXISTS labs.idx_products_admin_list;

-- Remove email_campaigns columns
ALTER TABLE labs.email_campaigns
  DROP COLUMN IF EXISTS segment_type,
  DROP COLUMN IF EXISTS segment_product_id,
  DROP COLUMN IF EXISTS segment_cohort_id,
  DROP COLUMN IF EXISTS opened_count,
  DROP COLUMN IF EXISTS clicked_count;

-- Remove email_logs columns
ALTER TABLE labs.email_logs
  DROP COLUMN IF EXISTS opened_at,
  DROP COLUMN IF EXISTS clicked_at,
  DROP COLUMN IF EXISTS last_opened_at,
  DROP COLUMN IF EXISTS open_count,
  DROP COLUMN IF EXISTS click_count;
