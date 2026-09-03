export type CanonicalCategory =
  | "global"
  | "south_east_asia"
  | "asia_non_sea"
  | "north_america"
  | "south_america"
  | "european_union"
  | "europe_non_eu"
  | "africa"
  | "oceania"
  | "corporate";

export interface EntityRule {
  id: string;
  type: string;
  category: CanonicalCategory;
  pattern: RegExp;
  tokenPrefix: string;
  validator?: (match: string) => boolean;
  priority?: number;
}

export type Rule = EntityRule;

export const CANONICAL_PACK_IDS = [
  "south_east_asia",
  "asia_non_sea",
  "north_america",
  "south_america",
  "european_union",
  "europe_non_eu",
  "africa",
  "oceania",
  "corporate",
  "global",
] as const;

export const CANONICAL_PACK_ALIASES: Record<string, CanonicalCategory> = {
  global: "global",
  south_east_asia: "south_east_asia",
  "south-east-asia": "south_east_asia",
  "south east asia": "south_east_asia",
  asia_non_sea: "asia_non_sea",
  "asia-non-sea": "asia_non_sea",
  "asia non-sea": "asia_non_sea",
  "asia non sea": "asia_non_sea",
  north_america: "north_america",
  "north-america": "north_america",
  "north america": "north_america",
  south_america: "south_america",
  "south-america": "south_america",
  "south america": "south_america",
  european_union: "european_union",
  "european-union": "european_union",
  "european union": "european_union",
  europe_non_eu: "europe_non_eu",
  "europe-non-eu": "europe_non_eu",
  "europe non-eu": "europe_non_eu",
  "europe non eu": "europe_non_eu",
  africa: "africa",
  oceania: "oceania",
  corporate: "corporate",
};
