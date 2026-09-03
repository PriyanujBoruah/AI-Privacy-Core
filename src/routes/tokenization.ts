import { Hono, Context } from "hono";
import { tokenize, rehydrate } from "../tokenizer/engine";
import { saveTokenSession, getTokenSession, purgeTokenSession } from "../vault/session";

export interface Env {
  DB?: D1Database;
}

const MAX_PAYLOAD_BYTES = 1_048_576; // 1 MB payload limit safeguard for Edge isolates

/**
 * Data De-identification & Reversible Tokenization Engine Router
 */
const tokenizationApp = new Hono<{ Bindings: Env }>();

/**
 * Extract Custom Enterprise Entities/Keywords from request headers
 */
function resolveCustomKeywords(c: Context): string[] {
  const headerVal = c.req.header("x-custom-entities") || c.req.header("x-custom-keywords");
  if (!headerVal) return [];

  try {
    const trimmed = headerVal.trim();
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    return trimmed.split(",").map((s: string) => s.trim());
  } catch {
    return [];
  }
}

/**
 * Extract Detection Categories from request body or headers
 */
function resolveCategories(c: Context, bodyCategories?: string[]): string[] {
  if (Array.isArray(bodyCategories) && bodyCategories.length > 0) {
    return bodyCategories;
  }
  const headerVal = c.req.header("x-detection-categories") || c.req.header("x-categories");
  if (!headerVal) return [];

  try {
    const trimmed = headerVal.trim();
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    return trimmed.split(",").map((s: string) => s.trim());
  } catch {
    return [];
  }
}

// =========================================================================
// 1. Data De-identification API: POST /tokenize (Anonymize Payload)
// =========================================================================
tokenizationApp.post("/tokenize", async (c) => {
  try {
    const body = await c.req.json<{
      text: string;
      mode?: "structural" | "fpe";
      categories?: string[];
      customKeywords?: string[];
      ttlSeconds?: number;
    }>();

    if (!body.text || typeof body.text !== "string") {
      return c.json(
        { error: { type: "invalid_request_error", message: "Field 'text' is required." } },
        400
      );
    }

    // Top-level payload limit check to prevent edge isolate CPU/memory exhaustion
    if (body.text.length > MAX_PAYLOAD_BYTES) {
      return c.json(
        { error: { type: "payload_too_large", message: "Payload text exceeds maximum size limit of 1MB." } },
        413
      );
    }

    const categories = resolveCategories(c, body.categories);
    if (categories.length > 2) {
      return c.json(
        {
          error: {
            type: "category_limit_exceeded",
            message: "Maximum of 2 Canonical Pack IDs allowed per request to maintain sub-5ms SLA.",
          },
        },
        400
      );
    }

    const ttlSeconds = body.ttlSeconds && body.ttlSeconds > 0 ? Math.min(body.ttlSeconds, 86400) : 300;
    const headerKeywords = resolveCustomKeywords(c);
    const combinedKeywords = Array.from(
      new Set([
        ...(body.customKeywords || []),
        ...headerKeywords,
      ])
    );

    const tokenResult = tokenize(body.text, {
      customKeywords: combinedKeywords,
      mode: body.mode || "structural",
      categories,
    });
    const sessionId = `sess_tok_${Math.random().toString(36).substring(2, 12)}`;

    const expiresAt = await saveTokenSession(
      c.env?.DB,
      sessionId,
      tokenResult.tokenMap,
      ttlSeconds
    );

    return c.json({
      mode: tokenResult.mode,
      sessionId,
      sanitizedText: tokenResult.sanitizedText,
      entitiesCount: tokenResult.count,
      entitiesDetected: tokenResult.entitiesDetected,
      categoriesApplied: tokenResult.categoriesApplied,
      expiresAt,
    });
  } catch (err: any) {
    return c.json(
      { error: { type: "invalid_request_error", message: err?.message || "Failed to process tokenization request." } },
      400
    );
  }
});

// =========================================================================
// 2. Reversible Tokenization API: POST /detokenize (Rehydrate Payload)
// =========================================================================
tokenizationApp.post("/detokenize", async (c) => {
  try {
    const body = await c.req.json<{
      sessionId: string;
      tokenizedText: string;
      purgeAfterRead?: boolean;
    }>();

    if (!body.sessionId || !body.tokenizedText) {
      return c.json(
        { error: { type: "invalid_request_error", message: "Fields 'sessionId' and 'tokenizedText' are required." } },
        400
      );
    }

    if (body.tokenizedText.length > MAX_PAYLOAD_BYTES) {
      return c.json(
        { error: { type: "payload_too_large", message: "Payload tokenizedText exceeds maximum size limit of 1MB." } },
        413
      );
    }

    const tokenMap = await getTokenSession(c.env?.DB, body.sessionId);
    if (!tokenMap) {
      return c.json(
        { error: { type: "session_expired_error", message: `Session '${body.sessionId}' not found or expired.` } },
        404
      );
    }

    const rehydratedText = rehydrate(body.tokenizedText, tokenMap);

    let tokensResolved = 0;
    for (const token of Object.keys(tokenMap)) {
      if (body.tokenizedText.includes(token)) {
        tokensResolved++;
      }
    }

    let sessionStatus = "active";
    if (body.purgeAfterRead === true) {
      await purgeTokenSession(c.env?.DB, body.sessionId);
      sessionStatus = "purged";
    }

    return c.json({
      rehydratedText,
      tokensResolved,
      sessionStatus,
    });
  } catch (err: any) {
    return c.json(
      { error: { type: "detokenize_error", message: "Failed to process detokenization request." } },
      500
    );
  }
});

export default tokenizationApp;
