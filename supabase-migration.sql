-- Add missing columns to cron_logs table
ALTER TABLE cron_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE cron_logs ADD COLUMN IF NOT EXISTS plays_saved INTEGER DEFAULT 0;
ALTER TABLE cron_logs ADD COLUMN IF NOT EXISTS response_data JSONB;
ALTER TABLE cron_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Ensure executed_at column exists (might be named created_at in old schema)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cron_logs' AND column_name='executed_at') THEN
    ALTER TABLE cron_logs ADD COLUMN executed_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;
