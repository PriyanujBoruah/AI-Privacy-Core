import {
  CanonicalCategory,
  Rule,
  EntityRule,
  CANONICAL_PACK_IDS,
  CANONICAL_PACK_ALIASES,
} from "./types";

import { GLOBAL_RULES } from "./global";
import { SOUTH_EAST_ASIA_RULES } from "./south_east_asia";
import { ASIA_NON_SEA_RULES } from "./asia_non_sea";
import { NORTH_AMERICA_RULES } from "./north_america";
import { SOUTH_AMERICA_RULES } from "./south_america";
import { EUROPEAN_UNION_RULES } from "./european_union";
import { EUROPE_NON_EU_RULES } from "./europe_non_eu";
import { AFRICA_RULES } from "./africa";
import { OCEANIA_RULES } from "./oceania";

// Re-export types and individual pack collections
export * from "./types";
export * from "./global";
export * from "./south_east_asia";
export * from "./asia_non_sea";
export * from "./north_america";
export * from "./south_america";
export * from "./european_union";
export * from "./europe_non_eu";
export * from "./africa";
export * from "./oceania";

/**
 * Master Enterprise Ruleset combining all Canonical Packs
 */
export const ENTERPRISE_RULESET: Rule[] = [
  ...GLOBAL_RULES,
  ...ASIA_NON_SEA_RULES,
  ...SOUTH_EAST_ASIA_RULES,
  ...NORTH_AMERICA_RULES,
  ...SOUTH_AMERICA_RULES,
  ...EUROPEAN_UNION_RULES,
  ...EUROPE_NON_EU_RULES,
  ...AFRICA_RULES,
  ...OCEANIA_RULES,
];

/**
 * Pre-index rules into O(1) Category Registry for sub-millisecond lookups
 */
export const CATEGORY_REGISTRY = new Map<CanonicalCategory, Rule[]>();
for (const rule of ENTERPRISE_RULESET) {
  if (!CATEGORY_REGISTRY.has(rule.category)) {
    CATEGORY_REGISTRY.set(rule.category, []);
  }
  CATEGORY_REGISTRY.get(rule.category)!.push(rule);
}

export const MAX_ALLOWED_CATEGORIES = 2;

/**
 * Resolves requested Canonical Pack IDs into a deduplicated, bounded Rule list.
 * Always includes 'global' baseline rules.
 * Strictly limited to a maximum of 2 Canonical Pack IDs per request.
 */
export function resolveActiveRules(categories?: string[]): {
  rules: Rule[];
  resolvedPacks: CanonicalCategory[];
  error?: string;
} {
  const requested = !categories || categories.length === 0 ? [] : categories;

  if (requested.length > MAX_ALLOWED_CATEGORIES) {
    return {
      rules: [],
      resolvedPacks: [],
      error: `Maximum of ${MAX_ALLOWED_CATEGORIES} Canonical Pack IDs allowed per request to maintain sub-5ms SLA. Received ${requested.length}.`,
    };
  }

  const canonicalSet = new Set<CanonicalCategory>();
  canonicalSet.add("global"); // Global baseline is always enabled

  for (const raw of requested) {
    const slug = raw.toLowerCase().trim();
    const canonical = CANONICAL_PACK_ALIASES[slug];
    if (!canonical) {
      return {
        rules: [],
        resolvedPacks: [],
        error: `Invalid pack ID '${raw}'. The API only accepts Canonical Pack IDs (max 2): south_east_asia, asia_non_sea, north_america, south_america, european_union, europe_non_eu, africa, oceania, corporate, global.`,
      };
    }
    canonicalSet.add(canonical);
  }

  const activeRules: Rule[] = [];
  for (const cat of canonicalSet) {
    const packRules = CATEGORY_REGISTRY.get(cat);
    if (packRules) {
      activeRules.push(...packRules);
    }
  }

  return { rules: activeRules, resolvedPacks: Array.from(canonicalSet) };
}
