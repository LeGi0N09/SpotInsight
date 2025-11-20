-- Create artist cache table
CREATE TABLE IF NOT EXISTS artist_cache (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  genres JSONB,
  followers INTEGER,
  popularity INTEGER,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_artist_cache_name ON artist_cache(name);
CREATE INDEX IF NOT EXISTS idx_artist_cache_synced ON artist_cache(last_synced DESC);

-- Function to get or create artist metadata
CREATE OR REPLACE FUNCTION get_artist_metadata(artist_names TEXT[])
RETURNS TABLE (
  name TEXT,
  image_url TEXT,
  genres JSONB,
  followers INTEGER,
  popularity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.name,
    ac.image_url,
    ac.genres,
    ac.followers,
    ac.popularity
  FROM unnest(artist_names) AS an(name)
  LEFT JOIN artist_cache ac ON LOWER(TRIM(ac.name)) = LOWER(TRIM(an.name))
  WHERE ac.last_synced > NOW() - INTERVAL '7 days' OR ac.last_synced IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;
