// Shared scheduler timing constants — kept in one place so the timer, the
// staleness/recovery check, and the dashboard health badge all agree.

export const RSS_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes — matches instrumentation.node.ts

// A single tick can run long (dozens of feeds + an AI call), so we tolerate a
// few missed intervals before declaring the scheduler dead. ~3 missed ticks.
export const SCHEDULER_STALE_AFTER_MS = 20 * 60 * 1000; // 20 minutes

// View tracking is considered stalled if no view events landed in this window.
export const VIEW_TRACKING_STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour
