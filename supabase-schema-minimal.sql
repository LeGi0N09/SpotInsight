-- Minimal schema (only what's currently used)

-- Snapshots table
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

-- Plays table
CREATE TABLE IF NOT EXISTS plays (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  track_id TEXT NOT NULL,
  track_name TEXT,
  artist_name TEXT,
  played_at TIMESTAMPTZ NOT NULL,
  ms_played INTEGER DEFAULT 0,
  source TEXT DEFAULT 'import',
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id, played_at)
);

CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_track_id ON plays(track_id);
CREATE INDEX IF NOT EXISTS idx_plays_user_time ON plays(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_artist ON plays(artist_name);

-- Comments
COMMENT ON TABLE snapshots IS 'Stores Spotify API snapshots with rankings';
COMMENT ON TABLE plays IS 'Individual play records - source of truth for play counts';
