-- Enhanced cron_logs table with duration tracking
CREATE TABLE IF NOT EXISTS cron_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  plays_saved INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  response_data JSONB
);

-- System health tracking for APIs and tokens
CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  component TEXT NOT NULL,
  endpoint TEXT,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  checked_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cron_logs_executed_at ON cron_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health(component, checked_at DESC);

-- View for uptime calculation
CREATE OR REPLACE VIEW cron_uptime AS
SELECT 
  DATE(executed_at) as date,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as uptime_percentage
FROM cron_logs
WHERE executed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(executed_at)
ORDER BY date DESC;
