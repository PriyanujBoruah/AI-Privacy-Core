/**
 * South East Asia (ASEAN) Checksum Validators
 */

/**
 * Validates Singapore NRIC/FIN numbers (S/T/F/G/M + 7 digits + checksum letter).
 * Uses official weighted mod-11 checksum verification.
 */
export function validateSingaporeNRIC(nricStr: string): boolean {
  const clean = nricStr.trim().toUpperCase();
  if (!/^[STFGM]\d{7}[A-Z]$/.test(clean)) {
    return false;
  }

  const first = clean[0];
  const digits = clean.substring(1, 8).split("").map((d) => parseInt(d, 10));
  const last = clean[8];

  const weights = [2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * weights[i];
  }

  if (first === "T" || first === "G") {
    sum += 4;
  } else if (first === "M") {
    sum += 3;
  }

  const remainder = sum % 11;
  const offset = 11 - remainder;

  let expectedChar = "";
  if (first === "S" || first === "T") {
    const stMap: Record<number, string> = {
      1: "J",
      2: "Z",
      3: "I",
      4: "H",
      5: "G",
      6: "F",
      7: "E",
      8: "D",
      9: "C",
      10: "B",
      11: "A",
    };
    expectedChar = stMap[offset];
  } else if (first === "F" || first === "G") {
    const fgMap: Record<number, string> = {
      1: "X",
      2: "W",
      3: "U",
      4: "T",
      5: "R",
      6: "Q",
      7: "P",
      8: "N",
      9: "M",
      10: "L",
      11: "K",
    };
    expectedChar = fgMap[offset];
  } else if (first === "M") {
    const mMap: Record<number, string> = {
      1: "X",
      2: "W",
      3: "U",
      4: "T",
      5: "R",
      6: "Q",
      7: "P",
      8: "N",
      9: "J",
      10: "L",
      11: "K",
    };
    expectedChar = mMap[offset];
  }

  return last === expectedChar;
}

/**
 * Validates Thailand National ID Number (13 digits) via weighted Mod-11.
 */
export function validateThailandNationalID(idStr: string): boolean {
  if (!idStr || typeof idStr !== "string") return false;
  const clean = idStr.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(clean)) return false;

  const weights = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const expectedCheck = (11 - (sum % 11)) % 10;
  return parseInt(clean[12], 10) === expectedCheck;
}

/**
 * Validates Indonesia NIK (Nomor Induk Kependudukan, 16 digits).
 * Structure: Province (11-94) + Regency + District + Birthdate (with +40 female offset) + Sequence.
 */
export function validateIndonesiaNIK(nikStr: string): boolean {
  if (!nikStr || typeof nikStr !== "string") return false;
  const clean = nikStr.replace(/[\s-]/g, "");
  if (!/^[1-9]\d{15}$/.test(clean)) return false;

  const prov = parseInt(clean.substring(0, 2), 10);
  if (prov < 11 || prov > 94) return false;

  let day = parseInt(clean.substring(6, 8), 10);
  if (day > 40) day -= 40; // Female day of birth offset by +40
  if (day < 1 || day > 31) return false;

  const month = parseInt(clean.substring(8, 10), 10);
  if (month < 1 || month > 12) return false;

  return true;
}

/**
 * Validates Vietnam CCCD (Căn cước công dân, 12 digits).
 * Structure: 3-digit province code (001-096) + 1-digit century/gender (0-3) + 2-digit birth year + 6-digit sequence.
 */
export function validateVietnamCCCD(cccdStr: string): boolean {
  if (!cccdStr || typeof cccdStr !== "string") return false;
  const clean = cccdStr.replace(/[\s-]/g, "");
  if (!/^0\d{11}$/.test(clean)) return false;

  const prov = parseInt(clean.substring(0, 3), 10);
  if (prov < 1 || prov > 96) return false;

  const centuryGender = parseInt(clean[3], 10);
  if (centuryGender < 0 || centuryGender > 3) return false;

  return true;
}
