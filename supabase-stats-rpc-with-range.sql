-- Updated RPC function with time range support
CREATE OR REPLACE FUNCTION get_play_stats(time_range TEXT DEFAULT 'all')
RETURNS JSON AS $$
DECLARE
  result JSON;
  date_filter TIMESTAMP;
BEGIN
  -- Calculate date filter based on range
  CASE time_range
    WHEN 'month' THEN
      date_filter := NOW() - INTERVAL '1 month';
    WHEN 'year' THEN
      date_filter := NOW() - INTERVAL '12 months';
    ELSE
      date_filter := '1970-01-01'::TIMESTAMP; -- All time
  END CASE;

  -- Aggregate track and artist stats with time filter
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
      AND played_at >= date_filter
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
      AND played_at >= date_filter
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

-- Create index on played_at for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at DESC);
