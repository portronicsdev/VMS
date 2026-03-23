ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_app_users_reset_token_expires_at
  ON app_users(reset_token_expires_at);
