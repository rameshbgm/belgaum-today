-- One analyzed and summarized story per category. The page reads only these picks.
CREATE TABLE IF NOT EXISTS ai_suggested_stories (
  category VARCHAR(50) NOT NULL PRIMARY KEY,
  story_event_id BIGINT NOT NULL,
  article_id INT NOT NULL,
  ai_score INT NOT NULL,
  ai_reasoning VARCHAR(200) NOT NULL,
  selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_suggested_event FOREIGN KEY (story_event_id) REFERENCES story_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_suggested_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_ai_suggested_selected (selected_at)
);
