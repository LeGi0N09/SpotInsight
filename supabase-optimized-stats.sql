-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_play_stats();

-- Optimized RPC function for play statistics
CREATE FUNCTION get_play_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH track_stats AS (
    SELECT 
      track_id,
      MAX(track_name) as track_name,
      MAX(artist_name) as artist_name,
      MAX(album_image) as album_image,
      COUNT(*) as play_count,
      COALESCE(SUM(ms_played), 0) as total_time
    FROM plays
    WHERE track_id IS NOT NULL AND track_id != ''
    GROUP BY track_id
    ORDER BY play_count DESC
    LIMIT 100
  ),
  artist_stats AS (
    SELECT 
      TRIM(unnest(string_to_array(artist_name, ','))) as artist,
      COUNT(*) as play_count,
      COALESCE(SUM(ms_played), 0) as total_time
    FROM plays
    WHERE artist_name IS NOT NULL AND artist_name != ''
    GROUP BY TRIM(unnest(string_to_array(artist_name, ',')))
    ORDER BY play_count DESC
  )
  SELECT json_build_object(
    'trackStats', COALESCE((SELECT json_agg(row_to_json(t)) FROM track_stats t), '[]'::json),
    'artistStats', COALESCE((SELECT json_agg(row_to_json(a)) FROM artist_stats a), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Add album_image column
ALTER TABLE plays ADD COLUMN IF NOT EXISTS album_image TEXT;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_plays_track_agg ON plays(track_id) WHERE track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plays_artist_agg ON plays(artist_name) WHERE artist_name IS NOT NULL;

-- Analyze for better performance
ANALYZE plays;
