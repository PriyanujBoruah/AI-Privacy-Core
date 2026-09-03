/**
 * North America (US, CA, MX, Central America & Caribbean) Checksum Validators
 */

import { passesLuhnAlgorithm } from "./global";

/**
 * Validates US Social Security Numbers (SSN) with area and group exclusions
 */
export function validateUSSSN(ssnStr: string): boolean {
  if (!ssnStr || typeof ssnStr !== "string") return false;
  const clean = ssnStr.replace(/[\s-]/g, "");
  if (clean.length !== 9 || !/^\d{9}$/.test(clean)) return false;

  const area = parseInt(clean.substring(0, 3), 10);
  const group = parseInt(clean.substring(3, 5), 10);
  const serial = parseInt(clean.substring(5, 9), 10);

  // Invalid area numbers: 000, 666, 900-999
  if (area === 0 || area === 666 || area >= 900) return false;
  // Invalid group or serial: 00 or 0000
  if (group === 0 || serial === 0) return false;

  return true;
}

/**
 * Validates US Drug Enforcement Administration (DEA) registration numbers.
 * 2 letters + 7 digits: (d1+d3+d5) + 2*(d2+d4+d6) mod 10 === d7.
 */
export function validateUSDEA(deaStr: string): boolean {
  if (!deaStr || typeof deaStr !== "string") return false;
  const clean = deaStr.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{7}$/.test(clean)) return false;

  const d = clean.slice(2).split("").map(Number);
  const sum1 = d[0] + d[2] + d[4];
  const sum2 = (d[1] + d[3] + d[5]) * 2;
  const expectedCheck = (sum1 + sum2) % 10;
  return d[6] === expectedCheck;
}

/**
 * Validates US ABA Bank Routing Transit Number (9 digits) via weighted Mod-10.
 */
export function validateUSABARouting(routingStr: string): boolean {
  if (!routingStr || typeof routingStr !== "string") return false;
  const clean = routingStr.replace(/[\s-]/g, "");
  if (!/^\d{9}$/.test(clean)) return false;

  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum !== 0 && sum % 10 === 0;
}

/**
 * Validates Canadian Social Insurance Number (SIN) (9 digits) via standard Luhn.
 */
export function validateCanadaSIN(sinStr: string): boolean {
  if (!sinStr || typeof sinStr !== "string") return false;
  const clean = sinStr.replace(/[\s-]/g, "");
  if (!/^\d{9}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Ontario Health Insurance Number (OHIP, 10 digits) via Luhn Mod-10.
 */
export function validateOntarioOHIP(ohipStr: string): boolean {
  if (!ohipStr || typeof ohipStr !== "string") return false;
  const clean = ohipStr.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Mexico CURP (Clave Única de Registro de Población, 18 chars).
 */
export function validateMexicoCURP(curpStr: string): boolean {
  if (!curpStr || typeof curpStr !== "string") return false;
  const clean = curpStr.trim().toUpperCase();
  if (!/^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/.test(clean)) return false;

  const dict = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const pos = dict.indexOf(clean[i]);
    if (pos === -1) return false;
    sum += pos * (18 - i);
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  return parseInt(clean[17], 10) === expectedCheck;
}

/**
 * Validates Mexico RFC (Registro Federal de Contribuyentes, 12 or 13 chars).
 */
export function validateMexicoRFC(rfcStr: string): boolean {
  if (!rfcStr || typeof rfcStr !== "string") return false;
  const clean = rfcStr.trim().toUpperCase();
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(clean)) return false;

  const dateOffset = clean.length === 12 ? 3 : 4;
  const month = parseInt(clean.substring(dateOffset + 2, dateOffset + 4), 10);
  const day = parseInt(clean.substring(dateOffset + 4, dateOffset + 6), 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}

/**
 * Validates Mexico NSS (Número de Seguridad Social - IMSS, 11 digits) via Luhn Mod-10.
 */
export function validateMexicoNSS(nssStr: string): boolean {
  if (!nssStr || typeof nssStr !== "string") return false;
  const clean = nssStr.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}

/**
 * Validates Dominican Republic Cédula de Identidad y Electoral (11 digits) via Luhn Mod-10.
 */
export function validateDominicanCedula(cedulaStr: string): boolean {
  if (!cedulaStr || typeof cedulaStr !== "string") return false;
  const clean = cedulaStr.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  return passesLuhnAlgorithm(clean);
}
