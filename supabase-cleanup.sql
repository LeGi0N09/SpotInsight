-- Delete duplicates: keep only 1 play per track per 5-minute window
WITH ranked_plays AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, track_id, 
                        FLOOR(EXTRACT(EPOCH FROM played_at) / 300)
           ORDER BY played_at DESC, id DESC
         ) as rn
  FROM plays
)
DELETE FROM plays
WHERE id IN (
  SELECT id FROM ranked_plays WHERE rn > 1
);
