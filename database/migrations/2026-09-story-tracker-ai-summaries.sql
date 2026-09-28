-- Cache GPT-6 Luna summaries until another publisher report joins the story.
CREATE TABLE IF NOT EXISTS story_event_summaries (
  story_event_id BIGINT NOT NULL PRIMARY KEY,
  summary_json LONGTEXT NOT NULL,
  source_updated_at TIMESTAMP NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_story_summary_event
    FOREIGN KEY (story_event_id) REFERENCES story_events(id) ON DELETE CASCADE
);
