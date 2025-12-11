-- Count unique artists
CREATE OR REPLACE FUNCTION count_unique_artists()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT artist_name) FROM plays WHERE artist_name IS NOT NULL;
$$;

-- Count unique tracks
CREATE OR REPLACE FUNCTION count_unique_tracks()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT track_id) FROM plays WHERE track_id IS NOT NULL;
$$;
