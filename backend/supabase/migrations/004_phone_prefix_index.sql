-- Fast prefix phone search for large datasets
-- Supports queries like: phone LIKE '8447%'

CREATE INDEX IF NOT EXISTS idx_visitors_phone_prefix
  ON visitors (phone text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_visits_phone_prefix
  ON visits (phone text_pattern_ops);
