-- Migration: Add token_hash column to initial_password_tokens
-- This migrates from plaintext tokens to HMAC-SHA-256 hashed tokens for security

-- Phase 1: Add token_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'labs' 
    AND table_name = 'initial_password_tokens' 
    AND column_name = 'token_hash'
  ) THEN
    ALTER TABLE labs.initial_password_tokens ADD COLUMN token_hash VARCHAR(255);
  END IF;
END $$;

-- Phase 2: Create index on token_hash for efficient lookups
CREATE INDEX IF NOT EXISTS idx_initial_password_tokens_token_hash 
ON labs.initial_password_tokens(token_hash);

-- Phase 3: Drop old plaintext token column (ONLY after code is deployed)
-- Uncomment this AFTER verifying all tokens have token_hash populated:
-- ALTER TABLE labs.initial_password_tokens DROP COLUMN IF EXISTS token;
