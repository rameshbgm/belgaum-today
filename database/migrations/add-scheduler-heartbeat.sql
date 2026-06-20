-- Scheduler heartbeat / liveness tracking
-- Lets the dashboard show whether the in-process scheduler is actually alive,
-- since on shared hosting the Node process (and its setInterval) can be reaped.
-- A single-row table: one row per named scheduler job.

CREATE TABLE IF NOT EXISTS scheduler_heartbeat (
    job_name        VARCHAR(64) PRIMARY KEY,
    last_started_at TIMESTAMP NULL DEFAULT NULL,   -- when the most recent tick began
    last_success_at TIMESTAMP NULL DEFAULT NULL,   -- when the most recent tick finished OK
    last_status     ENUM('running','success','error') NOT NULL DEFAULT 'running',
    last_error      TEXT NULL,                      -- message from the most recent failed tick
    tick_count      INT NOT NULL DEFAULT 0,         -- total ticks since first registration
    process_pid     INT NULL,                       -- pid that owns the current timer (changes on restart)
    registered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
