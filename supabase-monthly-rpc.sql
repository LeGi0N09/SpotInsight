-- RPC function for fast monthly aggregation
CREATE OR REPLACE FUNCTION get_monthly_plays()
RETURNS TABLE (
  month_key TEXT,
  plays BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(played_at, 'YYYY-MM') as month_key,
    COUNT(*) as plays
  FROM plays
  WHERE played_at IS NOT NULL
  GROUP BY TO_CHAR(played_at, 'YYYY-MM')
  ORDER BY month_key ASC;
END;
$$ LANGUAGE plpgsql STABLE;
