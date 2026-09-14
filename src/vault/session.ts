export interface TokenSessionData {
  sessionId: string;
  tokenMap: Record<string, string>;
  expiresAt: string;
}

// In-memory session store fallback for local dev mode or zero-D1 setups
const memorySessions = new Map<string, TokenSessionData>();
const MAX_MEMORY_SESSIONS = 5000;
let lastSweepTime = 0;

/**
 * Periodically purges expired entries from in-memory Map to prevent memory leaks
 */
function purgeExpiredMemorySessions(): void {
  const now = Date.now();
  // Throttle sweep to once every 10 seconds
  if (now - lastSweepTime > 10000 && memorySessions.size > 200) {
    lastSweepTime = now;
    const nowStr = new Date(now).toISOString();
    for (const [id, data] of memorySessions.entries()) {
      if (data.expiresAt <= nowStr) {
        memorySessions.delete(id);
      }
    }
  }

  // Hard FIFO bound to guarantee memory stability under high throughput benchmarks
  while (memorySessions.size > MAX_MEMORY_SESSIONS) {
    const oldestKey = memorySessions.keys().next().value;
    if (oldestKey) {
      memorySessions.delete(oldestKey);
    } else {
      break;
    }
  }
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

/**
 * Saves a token mapping session with a specified TTL (in seconds)
 */
export async function saveTokenSession(
  db: D1Database | undefined,
  sessionId: string,
  tokenMap: Record<string, string>,
  ttlSeconds: number = 300,
  executionCtx?: ExecutionContextLike
): Promise<string> {
  purgeExpiredMemorySessions();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const sessionData: TokenSessionData = { sessionId, tokenMap: tokenMap || {}, expiresAt };

  // 1. Store in memory fallback (instant sub-millisecond access for all sessions, including 0-entity)
  memorySessions.set(sessionId, sessionData);

  // 2. Persist to D1 database asynchronously in background only when tokens exist
  if (db && Object.keys(tokenMap).length > 0) {
    const d1Task = (async () => {
      try {
        const query = `
          INSERT OR REPLACE INTO token_sessions (session_id, mapping_json, expires_at)
          VALUES (?, ?, ?)
        `;
        await db
          .prepare(query)
          .bind(sessionId, JSON.stringify(tokenMap), expiresAt)
          .run();
      } catch {
        // D1 unavailable; memory fallback handles request
      }
    })();

    if (executionCtx && typeof executionCtx.waitUntil === "function") {
      try {
        executionCtx.waitUntil(d1Task);
      } catch {
        // Context closed or unavailable
      }
    }
  }

  return expiresAt;
}

/**
 * Retrieves an active token mapping session by sessionId
 */
export async function getTokenSession(
  db: D1Database | undefined,
  sessionId: string
): Promise<Record<string, string> | null> {
  const nowStr = new Date().toISOString();

  // 1. Check memory fallback first
  if (memorySessions.has(sessionId)) {
    const memData = memorySessions.get(sessionId)!;
    if (memData.expiresAt > nowStr) {
      return memData.tokenMap;
    } else {
      memorySessions.delete(sessionId);
      return null;
    }
  }

  // 2. Check D1 database if available
  if (db) {
    try {
      const query = `
        SELECT mapping_json, expires_at FROM token_sessions
        WHERE session_id = ? AND expires_at > ?
      `;
      const res = await db.prepare(query).bind(sessionId, nowStr).first();

      if (res && res.mapping_json) {
        const tokenMap = JSON.parse(res.mapping_json as string);
        // Cache in memory
        memorySessions.set(sessionId, {
          sessionId,
          tokenMap,
          expiresAt: res.expires_at as string,
        });
        return tokenMap;
      }
    } catch {
      // D1 lookup error fallback
    }
  }

  return null;
}

/**
 * Purges a token mapping session immediately (zero-retention enforcement)
 */
export async function purgeTokenSession(
  db: D1Database | undefined,
  sessionId: string,
  executionCtx?: ExecutionContextLike
): Promise<void> {
  memorySessions.delete(sessionId);

  if (db) {
    const purgeTask = (async () => {
      try {
        const query = `DELETE FROM token_sessions WHERE session_id = ?`;
        await db.prepare(query).bind(sessionId).run();
      } catch {
        // D1 purge error fallback
      }
    })();

    if (executionCtx && typeof executionCtx.waitUntil === "function") {
      executionCtx.waitUntil(purgeTask);
    }
  }
}
