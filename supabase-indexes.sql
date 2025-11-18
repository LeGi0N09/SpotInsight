-- Performance indexes for faster queries

-- Plays table indexes
CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays (played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_track_id ON plays (track_id);
CREATE INDEX IF NOT EXISTS idx_plays_user_id ON plays (user_id);
CREATE INDEX IF NOT EXISTS idx_plays_artist_name ON plays (artist_name);
CREATE INDEX IF NOT EXISTS idx_plays_user_played_at ON plays (user_id, played_at DESC);

-- Snapshots table indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_synced_at ON snapshots (synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots (user_id);

-- Cron logs indexes
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs (status);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health (checked_at DESC);
