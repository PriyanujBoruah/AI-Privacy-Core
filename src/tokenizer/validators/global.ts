/**
 * Global Checksum Validators
 */

/**
 * Generic Luhn (Mod-10) algorithm for arbitrary length numeric strings
 */
export function passesLuhnAlgorithm(digitsOnly: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validates credit card numbers using the standard Luhn (Mod-10) algorithm.
 * Filters out random 16-digit timestamps, serial numbers, or tracking codes.
 */
export function passesLuhnChecksum(cardStr: string): boolean {
  const digitsOnly = cardStr.replace(/\D/g, "");
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }
  return passesLuhnAlgorithm(digitsOnly);
}

/**
 * Validates International Bank Account Numbers (IBAN) using ISO 7064 Mod 97-10 algorithm.
 */
export function validateIBAN(ibanStr: string): boolean {
  if (!ibanStr || typeof ibanStr !== "string") return false;
  const clean = ibanStr.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;

  // Rearrange: move country code + 2 check digits to end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Replace letters A-Z with numbers 10-35
  let numericStr = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numericStr += (code - 55).toString();
    } else if (code >= 48 && code <= 57) {
      numericStr += rearranged[i];
    } else {
      return false;
    }
  }

  try {
    return BigInt(numericStr) % 97n === 1n;
  } catch {
    return false;
  }
}

const RESERVED_DIRECTIVES = new Set([
  "media",
  "import",
  "keyframes",
  "font-face",
  "charset",
  "page",
  "supports",
  "property",
  "layer",
  "tailwind",
  "apply",
  "override",
  "param",
  "return",
  "returns",
  "deprecated",
  "author",
  "see",
  "type",
  "typedef",
  "example",
  "version",
  "throws",
  "exception",
  "component",
  "injectable",
  "observable",
  "decorator",
  "include",
  "mixin",
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "icloud",
  "proton",
  "protonmail",
  "aol",
]);

/**
 * Validates social media / system handles (@handle) to filter out code decorators,
 * CSS at-rules, and non-username tokens.
 */
export function validateHandleUsername(handleStr: string): boolean {
  if (!handleStr || typeof handleStr !== "string") return false;
  const name = (handleStr.startsWith("@") ? handleStr.slice(1) : handleStr).toLowerCase();
  if (name.length < 1 || name.length > 30) return false;
  if (RESERVED_DIRECTIVES.has(name)) return false;
  return true;
}

const SWIFT_ISO_COUNTRIES = new Set([
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
]);

const SWIFT_FALSE_POSITIVE_WORDS = new Set([
  "CONTRACT", "INCLUDED", "PURCHASE", "SCHEDULE", "DOCUMENT", "STANDARD", "SHIPPING", "DELIVERY",
  "CUSTOMER", "BAUGHMAN", "GALAVANT", "SKILLING", "HAEDICKE", "EBENEZER", "BUILDING", "TRAINING",
  "SECURITY", "SERVICES", "DIRECTOR", "ENGINEER", "DATABASE", "ACCOUNTS", "BUSINESS", "INTERNAL",
  "EXTERNAL", "DECEMBER", "NOVEMBER", "FEBRUARY", "SATURDAY", "THURSDAY", "DISPOSAL", "MINISTER",
  "HISTORIC", "RESEARCH", "OFFICIAL", "PERSONAL", "DIRECTLY", "VALUABLE", "SOFTWARE", "HARDWARE",
  "COMMERCE", "POSITION", "QUESTION", "ACTIVITY", "PROGRESS", "REPORTER", "EMPLOYEE", "WORKFLOW",
  "AUDITING", "PROPERTY", "PHYSICAL", "FEEDBACK", "ANALYSIS", "ANALYSTS", "CREATIVE", "CRITICAL",
  "SOLUTION", "PROBLEMS", "PRODUCTS", "RESOURCE", "PROJECTS", "MEMORIES", "OVERVIEW", "DECISION",
  "IMCEAFAX", "IMCEANOTES", "IMCEAEX"
]);

/**
 * Validates ISO 9362 SWIFT / BIC codes:
 * - 8 or 11 uppercase alphanumeric characters
 * - Chars 1-4: Bank code (letters only)
 * - Chars 5-6: ISO 3166-1 alpha-2 country code
 * - Chars 7-8: Location code
 * - Chars 9-11 (optional): Branch code
 * - Filters out dictionary words in uppercase
 */
export function validateSwiftBIC(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toUpperCase();
  if (clean.length !== 8 && clean.length !== 11) return false;
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/.test(clean)) return false;

  const country = clean.slice(4, 6);
  if (!SWIFT_ISO_COUNTRIES.has(country)) return false;

  if (SWIFT_FALSE_POSITIVE_WORDS.has(clean)) return false;

  return true;
}

const UNIVERSAL_ID_FALSE_POSITIVES = new Set([
  "null", "undefined", "true", "false", "none", "empty", "default", "unknown",
  "pending", "active", "inactive", "disabled", "enabled", "test", "sample",
  "example", "valid", "invalid", "error", "success", "failed", "status",
  "type", "name", "value", "string", "number", "boolean", "object", "array"
]);

/**
 * Validates generic/universal contextual identifiers
 */
export function validateUniversalContextId(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.trim();
  if (clean.length < 3 || clean.length > 64) return false;
  if (UNIVERSAL_ID_FALSE_POSITIVES.has(clean.toLowerCase())) return false;
  return true;
}


