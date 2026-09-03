-- =========================================================================
-- Standalone Data De-identification & Reversible Tokenization Engine Schema
-- Database: Cloudflare D1 (SQLite)
-- =========================================================================

CREATE TABLE IF NOT EXISTS token_sessions (
    session_id TEXT PRIMARY KEY,
    mapping_json TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for sub-millisecond session lookup & TTL expiration queries
CREATE INDEX IF NOT EXISTS idx_token_sessions_expires_at ON token_sessions(expires_at);

