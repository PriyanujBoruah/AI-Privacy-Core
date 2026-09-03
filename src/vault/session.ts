export interface TokenSessionData {
  sessionId: string;
  tokenMap: Record<string, string>;
  expiresAt: string;
}

// In-memory session store fallback for local dev mode or zero-D1 setups
const memorySessions = new Map<string, TokenSessionData>();

/**
 * Periodically purges expired entries from in-memory Map to prevent memory leaks
 */
function purgeExpiredMemorySessions(): void {
  if (memorySessions.size > 200) {
    const nowStr = new Date().toISOString();
    for (const [id, data] of memorySessions.entries()) {
      if (data.expiresAt <= nowStr) {
        memorySessions.delete(id);
      }
    }
  }
}

/**
 * Saves a token mapping session with a specified TTL (in seconds)
 */
export async function saveTokenSession(
  db: D1Database | undefined,
  sessionId: string,
  tokenMap: Record<string, string>,
  ttlSeconds: number = 300
): Promise<string> {
  purgeExpiredMemorySessions();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const sessionData: TokenSessionData = { sessionId, tokenMap, expiresAt };

  // 1. Store in memory fallback
  memorySessions.set(sessionId, sessionData);

  // 2. Store in D1 database if available
  if (db) {
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
  sessionId: string
): Promise<void> {
  memorySessions.delete(sessionId);

  if (db) {
    try {
      const query = `DELETE FROM token_sessions WHERE session_id = ?`;
      await db.prepare(query).bind(sessionId).run();
    } catch {
      // D1 purge error fallback
    }
  }
}
