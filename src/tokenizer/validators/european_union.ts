/**
 * European Union (EU-27) Checksum Validators
 */

import { passesLuhnAlgorithm } from "./global";

/**
 * Validates Spanish DNI / NIE (National Identity / Foreigner ID) via Mod-23.
 */
export function validateSpainDNI(dniStr: string): boolean {
  if (!dniStr || typeof dniStr !== "string") return false;
  const clean = dniStr.trim().toUpperCase().replace(/[-\s]/g, "");
  if (!/^[XYZ\d]\d{7}[A-Z]$/.test(clean)) return false;

  let numPart = clean.slice(0, 8);
  if (numPart.startsWith("X")) numPart = "0" + numPart.slice(1);
  else if (numPart.startsWith("Y")) numPart = "1" + numPart.slice(1);
  else if (numPart.startsWith("Z")) numPart = "2" + numPart.slice(1);

  const num = parseInt(numPart, 10);
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return clean[8] === letters[num % 23];
}

/**
 * Validates Italian Codice Fiscale (16 characters) via Mod-26 parity check.
 */
export function validateItalyCodiceFiscale(cfStr: string): boolean {
  if (!cfStr || typeof cfStr !== "string") return false;
  const clean = cfStr.trim().toUpperCase();
  if (!/^[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]$/.test(clean)) return false;

  const oddMap: Record<string, number> = {
    "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
    "A": 1, "B": 0, "C": 5, "D": 7, "E": 9, "F": 13, "G": 15, "H": 17, "I": 19, "J": 21,
    "K": 2, "L": 4, "M": 18, "N": 20, "O": 11, "P": 3, "Q": 6, "R": 8, "S": 12, "T": 14,
    "U": 16, "V": 10, "W": 22, "X": 25, "Y": 24, "Z": 23,
  };

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = clean[i];
    if ((i + 1) % 2 !== 0) {
      sum += oddMap[char] ?? 0;
    } else {
      const code = char.charCodeAt(0);
      sum += code >= 65 ? code - 65 : code - 48;
    }
  }

  const expectedCheckChar = String.fromCharCode(65 + (sum % 26));
  return clean[15] === expectedCheckChar;
}

/**
 * Validates Poland PESEL (National ID, 11 digits) via weighted Mod-10.
 */
export function validatePolandPESEL(peselStr: string): boolean {
  if (!peselStr || typeof peselStr !== "string") return false;
  const clean = peselStr.trim();
  if (!/^\d{11}$/.test(clean)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const check = (10 - (sum % 10)) % 10;
  return parseInt(clean[10], 10) === check;
}

/**
 * Validates Poland NIP (Tax ID, 10 digits) via weighted Mod-11.
 */
export function validatePolandNIP(nipStr: string): boolean {
  if (!nipStr || typeof nipStr !== "string") return false;
  const clean = nipStr.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const check = sum % 11;
  if (check === 10) return false;
  return parseInt(clean[9], 10) === check;
}

/**
 * Validates Netherlands BSN (Burgerservicenummer, 8 or 9 digits) via 11-proof (Elfproef).
 */
export function validateNetherlandsBSN(bsnStr: string): boolean {
  if (!bsnStr || typeof bsnStr !== "string") return false;
  let clean = bsnStr.trim();
  if (!/^\d{8,9}$/.test(clean)) return false;
  if (clean.length === 8) clean = "0" + clean;

  const weights = [9, 8, 7, 6, 5, 4, 3, 2, -1];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum !== 0 && sum % 11 === 0;
}

/**
 * Validates Belgium National Register Number (RRN, 11 digits) via Mod-97.
 */
export function validateBelgiumRRN(rrnStr: string): boolean {
  if (!rrnStr || typeof rrnStr !== "string") return false;
  const clean = rrnStr.replace(/[\s.-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;

  const base = parseInt(clean.substring(0, 9), 10);
  const check = parseInt(clean.substring(9, 11), 10);

  // Check for pre-2000 birth
  if (97 - (base % 97) === check) return true;
  // Check for post-2000 birth (+2000000000)
  if (97 - ((2000000000 + base) % 97) === check) return true;

  return false;
}

/**
 * Validates Sweden Personnummer (10 or 12 digits) via Luhn algorithm.
 */
export function validateSwedenPIN(pinStr: string): boolean {
  if (!pinStr || typeof pinStr !== "string") return false;
  const clean = pinStr.replace(/[\s+-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;
  const tenDigits = clean.slice(-10);
  return passesLuhnAlgorithm(tenDigits);
}

/**
 * Validates Portugal NIF (9 digits) via weighted Mod-11.
 */
export function validatePortugalNIF(nifStr: string): boolean {
  if (!nifStr || typeof nifStr !== "string") return false;
  const clean = nifStr.trim();
  if (!/^[1-9]\d{8}$/.test(clean)) return false;

  const weights = [9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const check = rem < 2 ? 0 : 11 - rem;
  return parseInt(clean[8], 10) === check;
}

/**
 * Validates Ireland PPS Number (7 digits + 1 or 2 letters) via Mod-23.
 */
export function validateIrelandPPSN(ppsnStr: string): boolean {
  if (!ppsnStr || typeof ppsnStr !== "string") return false;
  const clean = ppsnStr.trim().toUpperCase();
  if (!/^\d{7}[A-W][A-W]?$/.test(clean)) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  if (clean.length === 9) {
    sum += (clean.charCodeAt(8) - 64) * 9;
  }
  const rem = sum % 23;
  const expectedChar = rem === 0 ? "W" : String.fromCharCode(64 + rem);
  return clean[7] === expectedChar;
}

/**
 * Validates Romania CNP (13 digits) via standard weighted Mod-11.
 */
export function validateRomaniaCNP(cnpStr: string): boolean {
  if (!cnpStr || typeof cnpStr !== "string") return false;
  const clean = cnpStr.trim();
  if (!/^[1-8]\d{12}$/.test(clean)) return false;

  const constant = "279146358279";
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * parseInt(constant[i], 10);
  }
  const rem = sum % 11;
  const expectedCheck = rem === 10 ? 1 : rem;
  return parseInt(clean[12], 10) === expectedCheck;
}

/**
 * Validates Hungary Tax Number (Adóazonosító jel, 10 digits) via weighted Mod-11.
 */
export function validateHungaryTIN(tinStr: string): boolean {
  if (!tinStr || typeof tinStr !== "string") return false;
  const clean = tinStr.trim();
  if (!/^8\d{9}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (i + 1);
  }
  const expectedCheck = sum % 11;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Denmark CPR Number (10 digits: DDMMYY-XXXX) via Mod-11.
 */
export function validateDenmarkCPR(cprStr: string): boolean {
  if (!cprStr || typeof cprStr !== "string") return false;
  const clean = cprStr.replace(/-/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum % 11 === 0;
}

/**
 * Validates Finland Personal Identity Code (HETU, 11 chars: DDMMYY[+-A-FU-Y]NNNC).
 */
export function validateFinlandHETU(hetuStr: string): boolean {
  if (!hetuStr || typeof hetuStr !== "string") return false;
  const clean = hetuStr.trim().toUpperCase();
  if (!/^\d{6}[-+A-FU-Y]\d{3}[0-9A-Z]$/.test(clean)) return false;

  const numPart = parseInt(clean.substring(0, 6) + clean.substring(7, 10), 10);
  const checkTable = "0123456789ABCDEFHJKLMNPRSTUVWXY";
  const expectedChar = checkTable[numPart % 31];
  return clean[10] === expectedChar;
}

/**
 * Validates Bulgaria Uniform Civil Number (EGN, 10 digits) via weighted Mod-11.
 */
export function validateBulgariaEGN(egnStr: string): boolean {
  if (!egnStr || typeof egnStr !== "string") return false;
  const clean = egnStr.trim();
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = rem === 10 ? 0 : rem;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Croatia OIB (11 digits) via ISO 7064 Mod 11, 10.
 */
export function validateCroatiaOIB(oibStr: string): boolean {
  if (!oibStr || typeof oibStr !== "string") return false;
  const clean = oibStr.trim();
  if (!/^\d{11}$/.test(clean)) return false;

  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = (a + parseInt(clean[i], 10)) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  const expectedCheck = (11 - a) % 10;
  return parseInt(clean[10], 10) === expectedCheck;
}

/**
 * Validates Czech and Slovak Birth Number (Rodné Číslo, 9 or 10 digits).
 */
export function validateCzechBirthNumber(rcStr: string): boolean {
  if (!rcStr || typeof rcStr !== "string") return false;
  const clean = rcStr.replace(/[\s/]/g, "");
  if (!/^\d{9,10}$/.test(clean)) return false;

  if (clean.length === 10) {
    const num = parseInt(clean, 10);
    return num % 11 === 0;
  }
  return true; // 9-digit formats were issued prior to 1954
}
