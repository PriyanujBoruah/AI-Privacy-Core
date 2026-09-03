/**
 * Asia Non-SEA (East Asia, South Asia, Middle East, Central Asia) Checksum Validators
 */

import { passesLuhnAlgorithm } from "./global";

// Dihedral D5 tables for Verhoeff check (India Aadhaar)
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates Indian Aadhaar number using the Verhoeff checksum algorithm.
 * 12 digits, cannot start with 0 or 1.
 */
export function validateAadhaar(aadhaarStr: string): boolean {
  if (!aadhaarStr || typeof aadhaarStr !== "string") return false;
  const clean = aadhaarStr.replace(/[\s-]/g, "");
  if (!/^[2-9]\d{11}$/.test(clean)) return false;

  let c = 0;
  const digits = clean.split("").map(Number);
  for (let i = 0; i < digits.length; i++) {
    const digit = digits[digits.length - 1 - i];
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  }
  return c === 0;
}

/**
 * Validates Indian PAN card format (10 characters).
 * 4th char must be an entity code: A, B, C, F, G, H, J, L, P, T.
 */
export function validatePan(panStr: string): boolean {
  if (!panStr || typeof panStr !== "string") return false;
  const clean = panStr.trim().toUpperCase();
  return /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/.test(clean);
}

/**
 * Validates Indian GSTIN (15 characters).
 */
export function validateGstin(gstinStr: string): boolean {
  if (!gstinStr || typeof gstinStr !== "string") return false;
  const clean = gstinStr.trim().toUpperCase();
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(clean)) return false;
  const stateCode = parseInt(clean.substring(0, 2), 10);
  return stateCode >= 1 && (stateCode <= 38 || stateCode === 97 || stateCode === 99);
}

/**
 * Validates Japan Individual Number (My Number / 個人番号, 12 digits) via Mod-11.
 */
export function validateJapanMyNumber(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(clean)) return false;

  let sum = 0;
  for (let n = 1; n <= 11; n++) {
    const p = parseInt(clean[11 - n], 10);
    const q = n <= 6 ? n + 1 : n - 5;
    sum += p * q;
  }
  const rem = sum % 11;
  const expectedCheck = rem <= 1 ? 0 : 11 - rem;
  return parseInt(clean[11], 10) === expectedCheck;
}

/**
 * Validates South Korea Resident Registration Number (RRN, 13 digits) via weighted Mod-11.
 */
export function validateSouthKoreaRRN(rrnStr: string): boolean {
  if (!rrnStr || typeof rrnStr !== "string") return false;
  const clean = rrnStr.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(clean)) return false;

  const gender = parseInt(clean[6], 10);
  if (gender < 1 || gender > 8) return false;

  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const expectedCheck = (11 - (sum % 11)) % 10;
  return parseInt(clean[12], 10) === expectedCheck;
}

/**
 * Validates South Korea Business Registration Number (BRN, 10 digits).
 */
export function validateSouthKoreaBRN(brnStr: string): boolean {
  if (!brnStr || typeof brnStr !== "string") return false;
  const clean = brnStr.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const d8 = parseInt(clean[8], 10);
  sum += Math.floor((d8 * 5) / 10) + ((d8 * 5) % 10);
  const expectedCheck = (10 - (sum % 10)) % 10;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Taiwan National Identification Card Number (1 letter + 9 digits).
 */
export function validateTaiwanID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.trim().toUpperCase();
  if (!/^[A-Z][1289]\d{8}$/.test(clean)) return false;

  const letterCodes: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, J: 18, K: 19,
    L: 20, M: 21, N: 22, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29,
    X: 30, Y: 31, W: 32, Z: 33, I: 34, O: 35,
  };

  const code = String(letterCodes[clean[0]]);
  let sum = parseInt(code[0], 10) * 1 + parseInt(code[1], 10) * 9;
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i + 1], 10) * weights[i];
  }
  sum += parseInt(clean[9], 10);
  return sum % 10 === 0;
}

/**
 * Validates Chinese Resident Identity Card (18 characters) via ISO 7064 Mod 11-2.
 */
export function validateChinaResidentID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(clean)) return false;

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return clean[17] === checkCodes[sum % 11];
}

/**
 * Validates Hong Kong Identity Card (HKID, 1-2 letters + 6 digits + check in parentheses).
 */
export function validateHongKongHKID(hkidStr: string): boolean {
  if (!hkidStr || typeof hkidStr !== "string") return false;
  const clean = hkidStr.replace(/[\s()]/g, "").toUpperCase();
  if (!/^[A-Z]{1,2}\d{6}[0-9A]$/.test(clean)) return false;

  let sum = 0;
  let digits: string;
  let checkChar: string;

  if (/^[A-Z]\d{7}/.test(clean)) {
    // Single letter
    sum = 9 * 36 + (clean.charCodeAt(0) - 64) * 8;
    digits = clean.substring(1, 7);
    checkChar = clean[7];
  } else {
    // Two letters
    sum = (clean.charCodeAt(0) - 64) * 9 + (clean.charCodeAt(1) - 64) * 8;
    digits = clean.substring(2, 8);
    checkChar = clean[8];
  }

  const weights = [7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 6; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = rem === 0 ? "0" : rem === 1 ? "A" : String(11 - rem);
  return checkChar === expectedCheck;
}

/**
 * Validates Saudi Arabia National ID / Iqama (10 digits starting with 1 or 2) via Luhn Mod-10.
 */
export function validateSaudiNationalID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^[12]\d{9}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates UAE Emirates ID (15 digits starting with 784) via Luhn Mod-10.
 */
export function validateUAEEmiratesID(eidStr: string): boolean {
  if (!eidStr || typeof eidStr !== "string") return false;
  const clean = eidStr.replace(/[\s-]/g, "");
  if (!/^784\d{12}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Israel Teudat Zehut (Israeli ID, 9 digits) via Luhn Mod-10.
 */
export function validateIsraelID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  let clean = idStr.trim();
  if (!/^\d{8,9}$/.test(clean)) return false;
  if (clean.length === 8) clean = "0" + clean;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Turkey TC Kimlik No (TCKN, 11 digits).
 */
export function validateTurkeyTCKN(tcknStr: string): boolean {
  if (!tcknStr || typeof tcknStr !== "string") return false;
  const clean = tcknStr.trim();
  if (!/^[1-9]\d{10}$/.test(clean)) return false;

  const d = clean.split("").map((ch) => parseInt(ch, 10));
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const d9Expected = (((oddSum * 7 - evenSum) % 10) + 10) % 10;
  if (d[9] !== d9Expected) return false;

  let sum10 = 0;
  for (let i = 0; i < 10; i++) sum10 += d[i];
  return d[10] === sum10 % 10;
}

/**
 * Validates Kazakhstan Individual Identification Number (IIN, 12 digits) via Mod-11.
 */
export function validateKazakhstanIIN(iinStr: string): boolean {
  if (!iinStr || typeof iinStr !== "string") return false;
  const clean = iinStr.trim();
  if (!/^\d{12}$/.test(clean)) return false;

  const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  let sum1 = 0;
  for (let i = 0; i < 11; i++) {
    sum1 += parseInt(clean[i], 10) * w1[i];
  }
  let check = sum1 % 11;
  if (check === 10) {
    const w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
    let sum2 = 0;
    for (let i = 0; i < 11; i++) {
      sum2 += parseInt(clean[i], 10) * w2[i];
    }
    check = sum2 % 11;
  }
  if (check === 10) return false;
  return parseInt(clean[11], 10) === check;
}
