-- Keep the portal-wide counter non-null and repair rows where historical
-- article_view events exceed the denormalized counter.
UPDATE articles a
LEFT JOIN (
    SELECT article_id, COUNT(*) AS recorded_views
    FROM article_views
    GROUP BY article_id
) v ON v.article_id = a.id
SET a.view_count = GREATEST(COALESCE(a.view_count, 0), COALESCE(v.recorded_views, 0));

ALTER TABLE articles MODIFY view_count INT NOT NULL DEFAULT 0;
