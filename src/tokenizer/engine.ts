import { resolveActiveRules, Rule } from "./patterns";
import { generateFPEToken } from "./fpe";

export interface DetectedEntity {
  type: string;
  token: string;
}

export interface TokenizeOptions {
  customKeywords?: string[];
  mode?: "structural" | "fpe";
  categories?: string[];
}

export interface TokenizeResult {
  mode: "structural" | "fpe";
  sanitizedText: string;
  tokenMap: Record<string, string>;
  count: number;
  entitiesDetected: DetectedEntity[];
  categoriesApplied?: string[];
}

export interface MatchSpan {
  start: number;
  end: number;
  ruleId: string;
  tokenPrefix: string;
  targetValue: string;
  priority: number;
}

/**
 * Normalizes input text options
 */
function resolveOptions(options?: TokenizeOptions | string[]): {
  customKeywords: string[];
  mode: "structural" | "fpe";
  categories?: string[];
} {
  if (Array.isArray(options)) {
    return { customKeywords: options, mode: "structural" };
  }
  return {
    customKeywords: options?.customKeywords || [],
    mode: options?.mode || "structural",
    categories: options?.categories,
  };
}

/**
 * Main Data De-identification & Anonymization Pipeline
 */
export function tokenize(
  text: string,
  options?: TokenizeOptions | string[]
): TokenizeResult {
  const { customKeywords, mode, categories } = resolveOptions(options);

  if (!text || typeof text !== "string") {
    return {
      mode,
      sanitizedText: "",
      tokenMap: {},
      count: 0,
      entitiesDetected: [],
      categoriesApplied: ["global"],
    };
  }

  // Resolve active rules scoped to requested categories (Max 2 Canonical Packs)
  const { rules: activeRules, resolvedPacks, error } = resolveActiveRules(categories);
  if (error) {
    throw new Error(error);
  }

  const rawSpans: MatchSpan[] = [];

  // =========================================================================
  // STEP 1: SCAN ACTIVE DETECTION RULES
  // =========================================================================

  for (const rule of activeRules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatchedText = match[0];
      const targetValue = match[1] || fullMatchedText;

      // Calculate exact start/end indices for extracted capture group
      let start = match.index;
      if (match[1]) {
        start = match.index + fullMatchedText.indexOf(match[1]);
      }
      const end = start + targetValue.length;

      // Validate checksum/format if validator attached
      if (rule.validator && !rule.validator(targetValue)) {
        continue;
      }

      // Assign priority score based on rule tier
      let priority = 10; // Default Tier 1
      if (rule.validator) {
        priority = 20; // Tier 2 Checksums (All verified algorithmic IDs)
      } else if (rule.id.startsWith("RULE_CONTEXT_NAME") || rule.id.startsWith("RULE_INVOICE") || match[1]) {
        priority = 15; // Tier 3 Contextual Anchors
      }

      rawSpans.push({
        start,
        end,
        ruleId: rule.id,
        tokenPrefix: rule.tokenPrefix,
        targetValue,
        priority,
      });
    }
  }

  // 2. Scan Tier 4: Dynamic Custom Enterprise Keywords
  if (customKeywords && customKeywords.length > 0) {
    for (const keyword of customKeywords) {
      if (!keyword || keyword.trim().length === 0) continue;

      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const customRegex = new RegExp(`\\b${escaped}\\b`, "gi");
      let match: RegExpExecArray | null;

      while ((match = customRegex.exec(text)) !== null) {
        rawSpans.push({
          start: match.index,
          end: match.index + match[0].length,
          ruleId: "RULE_CUSTOM_KEYWORD",
          tokenPrefix: "CUSTOM",
          targetValue: match[0],
          priority: 30, // Tier 4 Highest Priority
        });
      }
    }
  }

  // =========================================================================
  // STEP 2: SPAN DISAMBIGUATION PIPELINE (Longest-Match & Priority Sorting)
  // =========================================================================
  rawSpans.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenA !== lenB) return lenB - lenA; // Longest length wins
    return b.priority - a.priority;       // Higher priority score wins
  });

  const winningSpans: MatchSpan[] = [];

  for (const span of rawSpans) {
    let hasConflict = false;

    for (let i = 0; i < winningSpans.length; i++) {
      const existing = winningSpans[i];

      // Overlap check
      if (span.start < existing.end && span.end > existing.start) {
        hasConflict = true;

        const spanLen = span.end - span.start;
        const existingLen = existing.end - existing.start;

        if (
          span.priority > existing.priority ||
          (span.priority === existing.priority && spanLen > existingLen)
        ) {
          winningSpans[i] = span;
        }
        break;
      }
    }

    if (!hasConflict) {
      winningSpans.push(span);
    }
  }

  winningSpans.sort((a, b) => a.start - b.start);

  // =========================================================================
  // STEP 3: STABLE IDENTIFIER ASSIGNMENT & REVERSE-INDEX REPLACEMENT
  // =========================================================================
  const tokenMap: Record<string, string> = {};
  const valueToTokenMap: Map<string, string> = new Map();
  const counters: Record<string, number> = {};
  const entitiesDetected: DetectedEntity[] = [];
  let totalIntercepted = 0;

  // Pre-scan text for pre-existing literal token tags (e.g. <PERSON_1 />) to avoid collision
  const existingTokenRegex = /(?:<)?([A-Z]+)_(\d+)(?:>)?/g;
  let existingMatch;
  while ((existingMatch = existingTokenRegex.exec(text)) !== null) {
    const prefix = existingMatch[1];
    const num = parseInt(existingMatch[2], 10);
    if (!isNaN(num)) {
      counters[prefix] = Math.max(counters[prefix] || 0, num);
    }
  }

  const assignedSpans = winningSpans.map((span) => {
    let syntheticToken: string;

    if (valueToTokenMap.has(span.targetValue)) {
      syntheticToken = valueToTokenMap.get(span.targetValue)!;
    } else {
      counters[span.tokenPrefix] = (counters[span.tokenPrefix] || 0) + 1;
      const counter = counters[span.tokenPrefix];

      if (mode === "fpe") {
        syntheticToken = generateFPEToken(span.tokenPrefix, counter, span.targetValue);
      } else {
        syntheticToken = `${span.tokenPrefix}_${counter}`;
      }

      valueToTokenMap.set(span.targetValue, syntheticToken);
      tokenMap[syntheticToken] = span.targetValue;
      entitiesDetected.push({ type: span.ruleId, token: syntheticToken });
      totalIntercepted++;
    }

    return { ...span, syntheticToken };
  });

  // Coreference mention propagation: scan for un-captured repeated mentions of assigned entity names
  for (const [targetVal, syntheticToken] of valueToTokenMap.entries()) {
    // Only propagate name entities with length > 2
    if (targetVal.length > 2 && /^[A-Z\u00C0-\u00DD\u4E00-\u9FFF]/.test(targetVal)) {
      const escapedVal = targetVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`(?<![A-Za-z0-9_])${escapedVal}(?![A-Za-z0-9_])`, "gi");
      let nMatch: RegExpExecArray | null;

      while ((nMatch = nameRegex.exec(text)) !== null) {
        const nStart = nMatch.index;
        const nEnd = nStart + targetVal.length;

        const overlaps = assignedSpans.some(
          (s) => nStart < s.end && nEnd > s.start
        );

        if (!overlaps) {
          assignedSpans.push({
            start: nStart,
            end: nEnd,
            ruleId: "RULE_COREFERENCE",
            tokenPrefix: "PERSON",
            targetValue: targetVal,
            priority: 15,
            syntheticToken,
          });
        }
      }
    }
  }

  // Sort assigned spans by start index ascending for replacement
  assignedSpans.sort((a, b) => a.start - b.start);

  // Splicing replacement right-to-left to preserve index offsets
  let sanitizedText = text;
  for (let i = assignedSpans.length - 1; i >= 0; i--) {
    const span = assignedSpans[i];
    sanitizedText =
      sanitizedText.slice(0, span.start) +
      span.syntheticToken +
      sanitizedText.slice(span.end);
  }

  return {
    mode,
    sanitizedText,
    tokenMap,
    count: totalIntercepted,
    entitiesDetected,
    categoriesApplied: resolvedPacks,
  };
}

/**
 * Rehydrates a tokenized text string by replacing synthetic tokens (PERSON_1 or FPE mock data)
 * back to their original sensitive values.
 * Uses length-descending sorting and boundary constraints.
 */
export function rehydrate(
  text: string,
  tokenMap: Record<string, string>
): string {
  if (!text || !tokenMap || Object.keys(tokenMap).length === 0) {
    return text;
  }

  let rehydratedText = text;

  // Sort tokens by key length descending to prevent partial token matching (PERSON_10 before PERSON_1)
  const sortedTokens = Object.entries(tokenMap).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [token, originalValue] of sortedTokens) {
    const rawToken = token.replace(/^<|>$/g, "");
    const escapedToken = rawToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 1. Match bracketed token <PERSON_1> or [PERSON_1]
    const bracketedRegex = new RegExp(`<${escapedToken}>|\\[${escapedToken}\\]`, "g");
    rehydratedText = rehydratedText.replace(bracketedRegex, originalValue);

    // 2. Match unbracketed token PERSON_1 or FPE mock value
    // If token ends with digits (e.g. PERSON_1, EMAIL_1), use (?![0-9]) so concatenated LLM words like PERSON_1completed still rehydrate!
    const endsWithDigit = /\d$/.test(rawToken);
    const rightBoundary = endsWithDigit ? "(?![0-9])" : "(?![A-Za-z0-9_])";

    const unbracketedRegex = new RegExp(`(?<![A-Za-z0-9_])${escapedToken}${rightBoundary}`, "g");

    rehydratedText = rehydratedText.replace(unbracketedRegex, (match, offset, string) => {
      // If token is immediately followed by a letter (e.g. PERSON_1completed), insert a space after replacement
      const nextChar = string[offset + match.length];
      if (nextChar && /[a-zA-Z]/.test(nextChar)) {
        return originalValue + " ";
      }
      return originalValue;
    });
  }

  return rehydratedText;
}
