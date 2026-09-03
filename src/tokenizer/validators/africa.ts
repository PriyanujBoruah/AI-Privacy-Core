/**
 * Pan-African Checksum Validators
 */

import { passesLuhnAlgorithm } from "./global";

/**
 * Validates South African National ID Number (13 digits) via Luhn Mod-10.
 */
export function validateSouthAfricaID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Egyptian National ID (الرقم القومي) (14 digits).
 * Structure:
 * Digit 1: Century indicator (2 for 1900-1999, 3 for 2000-2099)
 * Digits 2-7: Birth Date (YYMMDD)
 * Digits 8-9: Official Governorate Code (01-04, 11-19, 21-29, 31-35, 88)
 * Digits 10-13: Sequence Number
 * Digit 14: Verification Digit
 */
export function validateEgyptNationalID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^[23]\d{13}$/.test(clean)) return false;

  const month = parseInt(clean.substring(3, 5), 10);
  const day = parseInt(clean.substring(5, 7), 10);
  const govCode = clean.substring(7, 9);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const validGovCodes = new Set([
    "01", "02", "03", "04",
    "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "31", "32", "33", "34", "35",
    "88", // Born outside Egypt
  ]);

  return validGovCodes.has(govCode);
}

/**
 * Validates Rwandan National ID (16 digits).
 * Structure:
 * Digit 1: Must be '1' (citizen indicator)
 * Digits 2-5: 4-digit birth year (1900-2099)
 * Digit 6: Gender indicator ('7' for male, '8' for female)
 * Digits 7-16: Sequence and verification digits
 */
export function validateRwandaNationalID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^1\d{15}$/.test(clean)) return false;

  const year = parseInt(clean.substring(1, 5), 10);
  if (year < 1900 || year > 2099) return false;

  const gender = clean[5];
  if (gender !== "7" && gender !== "8") return false;

  return true;
}
