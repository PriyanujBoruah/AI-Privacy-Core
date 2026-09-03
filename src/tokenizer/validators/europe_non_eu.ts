/**
 * Europe Non-EU Checksum Validators
 */

/**
 * Validates UK NHS Number (10 digits) using Modulus 11 algorithm.
 */
export function validateUKNHS(nhsStr: string): boolean {
  if (!nhsStr || typeof nhsStr !== "string") return false;
  const clean = nhsStr.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  const expectedCheck = checkDigit === 11 ? 0 : checkDigit;
  if (expectedCheck === 10) return false;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Swiss Social Security Number (AHV / AVS, 13 digits starting with 756) via EAN-13 / Mod-10.
 */
export function validateSwissAHV(ahvStr: string): boolean {
  if (!ahvStr || typeof ahvStr !== "string") return false;
  const clean = ahvStr.replace(/[\s.-]/g, "");
  if (!/^756\d{10}$/.test(clean)) return false;

  const weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  return parseInt(clean[12], 10) === expectedCheck;
}

/**
 * Validates Swiss Enterprise Identification Number (UID / IDE: CHE-xxx.xxx.xxx) via Mod-11.
 */
export function validateSwissUID(uidStr: string): boolean {
  if (!uidStr || typeof uidStr !== "string") return false;
  const clean = uidStr.replace(/[\s.CHE-]/gi, "");
  if (!/^\d{9}$/.test(clean)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = 11 - rem === 11 ? 0 : 11 - rem;
  if (expectedCheck === 10) return false;
  return parseInt(clean[8], 10) === expectedCheck;
}

/**
 * Validates Norwegian National Identity Number (Fødselsnummer / D-nummer, 11 digits) via dual Mod-11.
 */
export function validateNorwayFodselsnummer(fnrStr: string): boolean {
  if (!fnrStr || typeof fnrStr !== "string") return false;
  const clean = fnrStr.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;

  const w1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let s1 = 0;
  for (let i = 0; i < 9; i++) s1 += parseInt(clean[i], 10) * w1[i];
  const r1 = s1 % 11;
  const k1 = r1 === 0 ? 0 : 11 - r1;
  if (k1 === 10 || parseInt(clean[9], 10) !== k1) return false;

  const w2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let s2 = 0;
  for (let i = 0; i < 10; i++) s2 += parseInt(clean[i], 10) * w2[i];
  const r2 = s2 % 11;
  const k2 = r2 === 0 ? 0 : 11 - r2;
  if (k2 === 10 || parseInt(clean[10], 10) !== k2) return false;

  return true;
}

/**
 * Validates Iceland National Identification Number (Kennitala, 10 digits) via Mod-11 + century digit.
 */
export function validateIcelandKennitala(ktStr: string): boolean {
  if (!ktStr || typeof ktStr !== "string") return false;
  const clean = ktStr.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const check = rem === 0 ? 0 : 11 - rem;
  if (check === 10 || parseInt(clean[8], 10) !== check) return false;

  const century = clean[9];
  return century === "9" || century === "0" || century === "8";
}

/**
 * Validates Ukraine Individual Tax Number (RNTRC / IPN, 10 digits) via weighted Mod-11.
 */
export function validateUkraineIPN(ipnStr: string): boolean {
  if (!ipnStr || typeof ipnStr !== "string") return false;
  const clean = ipnStr.trim();
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = ((sum % 11) + 11) % 11;
  const expectedCheck = rem === 10 ? 0 : rem;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Balkan Unique Master Citizen Number (JMBG / EMBG: RS, BA, MK, ME, 13 digits) via Mod-11.
 */
export function validateBalkanJMBG(jmbgStr: string): boolean {
  if (!jmbgStr || typeof jmbgStr !== "string") return false;
  const clean = jmbgStr.trim();
  if (!/^\d{13}$/.test(clean)) return false;

  const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = rem <= 1 ? 0 : 11 - rem;
  return parseInt(clean[12], 10) === expectedCheck;
}
