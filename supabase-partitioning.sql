-- Table Partitioning for plays table (for 1M+ rows)
-- Run this when your plays table grows large

-- Step 1: Create partitioned table
CREATE TABLE plays_partitioned (
  id BIGSERIAL,
  user_id TEXT DEFAULT 'default_user',
  track_id TEXT NOT NULL,
  track_name TEXT,
  artist_name TEXT,
  played_at TIMESTAMPTZ NOT NULL,
  ms_played INTEGER DEFAULT 0,
  source TEXT DEFAULT 'import',
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, played_at)
) PARTITION BY RANGE (played_at);

-- Step 2: Create monthly partitions (example for 2024-2025)
CREATE TABLE plays_2024_11 PARTITION OF plays_partitioned
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE plays_2024_12 PARTITION OF plays_partitioned
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE plays_2025_01 PARTITION OF plays_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Add more partitions as needed...

-- Step 3: Create indexes on partitioned table
CREATE INDEX idx_plays_part_played_at ON plays_partitioned (played_at DESC);
CREATE INDEX idx_plays_part_track_id ON plays_partitioned (track_id);
CREATE INDEX idx_plays_part_user_played ON plays_partitioned (user_id, played_at DESC);

-- Step 4: Migrate data (when ready)
-- INSERT INTO plays_partitioned SELECT * FROM plays;

-- Step 5: Rename tables (when migration complete)
-- ALTER TABLE plays RENAME TO plays_old;
-- ALTER TABLE plays_partitioned RENAME TO plays;

-- Note: Only implement when plays table exceeds 1M rows
-- Impact: 5-10x faster queries on large datasets
