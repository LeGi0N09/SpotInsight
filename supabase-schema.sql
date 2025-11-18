-- Snapshots table with all time ranges
CREATE TABLE IF NOT EXISTS snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  synced_at TIMESTAMPTZ NOT NULL,
  profile JSONB,
  top_artists_short JSONB,
  top_artists_medium JSONB,
  top_artists_long JSONB,
  top_tracks_short JSONB,
  top_tracks_medium JSONB,
  top_tracks_long JSONB,
  recently_played JSONB,
  available_genres JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_synced_at ON snapshots(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON snapshots(user_id, synced_at DESC);

-- Track mapping table for normalization
CREATE TABLE IF NOT EXISTS track_map (
  id BIGSERIAL PRIMARY KEY,
  spotify_id TEXT UNIQUE,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_map_spotify_id ON track_map(spotify_id);
CREATE INDEX IF NOT EXISTS idx_track_map_names ON track_map(track_name, artist_name);

-- Plays table with enhanced structure
CREATE TABLE IF NOT EXISTS plays (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  track_id TEXT NOT NULL,
  track_name TEXT,
  artist_name TEXT,
  played_at TIMESTAMPTZ NOT NULL,
  ms_played INTEGER DEFAULT 0,
  source TEXT DEFAULT 'import', -- 'import' or 'sync'
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id, played_at)
);

CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_track_id ON plays(track_id);

-- Comments for documentation
COMMENT ON TABLE snapshots IS 'Stores Spotify API snapshots with rankings for all time ranges';
COMMENT ON TABLE plays IS 'Individual play records from imports and syncs - source of truth for play counts';
COMMENT ON TABLE track_map IS 'Normalized track metadata for accurate ID mapping';
COMMENT ON TABLE user_profiles IS 'Cached user profile data to reduce API calls';
COMMENT ON MATERIALIZED VIEW monthly_stats IS 'Pre-aggregated monthly statistics for fast queries';
COMMENT ON MATERIALIZED VIEW artist_stats IS 'Pre-aggregated artist statistics for fast queries';
CREATE INDEX IF NOT EXISTS idx_plays_user_time ON plays(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_artist ON plays(artist_name);

-- User profile cache table
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  profile_data JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_expires ON user_profiles(expires_at);

-- Materialized view for monthly stats (fast aggregation)
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_stats AS
SELECT 
  user_id,
  DATE_TRUNC('month', played_at) AS month,
  track_id,
  track_name,
  artist_name,
  COUNT(*) AS play_count,
  SUM(ms_played) AS total_ms_played
FROM plays
GROUP BY user_id, month, track_id, track_name, artist_name;

CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_month ON monthly_stats(user_id, month DESC);

-- Materialized view for artist stats
CREATE MATERIALIZED VIEW IF NOT EXISTS artist_stats AS
SELECT 
  user_id,
  artist_name,
  COUNT(*) AS play_count,
  SUM(ms_played) AS total_ms_played,
  COUNT(DISTINCT track_id) AS unique_tracks,
  MIN(played_at) AS first_play,
  MAX(played_at) AS last_play
FROM plays
WHERE artist_name IS NOT NULL
GROUP BY user_id, artist_name;

CREATE INDEX IF NOT EXISTS idx_artist_stats_user ON artist_stats(user_id, play_count DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_stats_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_stats;
END;
$$ LANGUAGE plpgsql;

-- Listening streaks view
CREATE OR REPLACE VIEW listening_streaks AS
WITH daily_plays AS (
  SELECT 
    user_id,
    DATE(played_at) AS play_date,
    COUNT(*) AS plays_count
  FROM plays
  GROUP BY user_id, DATE(played_at)
),
streak_groups AS (
  SELECT 
    user_id,
    play_date,
    play_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY play_date))::INTEGER AS streak_group
  FROM daily_plays
)
SELECT 
  user_id,
  MIN(play_date) AS streak_start,
  MAX(play_date) AS streak_end,
  COUNT(*) AS streak_days
FROM streak_groups
GROUP BY user_id, streak_group
ORDER BY user_id, streak_start DESC;
