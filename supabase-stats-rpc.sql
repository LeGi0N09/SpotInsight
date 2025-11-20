-- Optimized RPC function for play statistics aggregation
CREATE OR REPLACE FUNCTION get_play_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Aggregate track and artist stats in a single query
  WITH track_stats AS (
    SELECT 
      track_id,
      MAX(track_name) as track_name,
      MAX(artist_name) as artist_name,
      MAX(album_image) as album_image,
      COUNT(*) as play_count,
      SUM(ms_played) as total_time
    FROM plays
    WHERE track_id IS NOT NULL
    GROUP BY track_id
    ORDER BY play_count DESC
    LIMIT 100
  ),
  artist_stats AS (
    SELECT 
      TRIM(unnest(string_to_array(artist_name, ','))) as artist,
      COUNT(*) as play_count,
      SUM(ms_played) as total_time
    FROM plays
    WHERE artist_name IS NOT NULL
    GROUP BY TRIM(unnest(string_to_array(artist_name, ',')))
    ORDER BY play_count DESC
    LIMIT 100
  )
  SELECT json_build_object(
    'trackStats', (SELECT json_agg(row_to_json(t)) FROM track_stats t),
    'artistStats', (SELECT json_agg(row_to_json(a)) FROM artist_stats a)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add album_image column if it doesn't exist
ALTER TABLE plays ADD COLUMN IF NOT EXISTS album_image TEXT;

-- Create indexes for faster aggregation
CREATE INDEX IF NOT EXISTS idx_plays_track_stats ON plays(track_id, track_name, artist_name) WHERE track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plays_artist_stats ON plays(artist_name) WHERE artist_name IS NOT NULL;
