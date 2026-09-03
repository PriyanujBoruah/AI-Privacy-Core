/**
 * South America Checksum Validators
 */

/**
 * Validates Brazil CPF (11 digits) via two-stage Mod-11.
 */
export function validateBrazilCPF(cpfStr: string): boolean {
  if (!cpfStr || typeof cpfStr !== "string") return false;
  const clean = cpfStr.replace(/\D/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean[i], 10) * (10 - i);
  }
  let rest1 = (sum1 * 10) % 11;
  if (rest1 === 10 || rest1 === 11) rest1 = 0;
  if (rest1 !== parseInt(clean[9], 10)) return false;

  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean[i], 10) * (11 - i);
  }
  let rest2 = (sum2 * 10) % 11;
  if (rest2 === 10 || rest2 === 11) rest2 = 0;
  return rest2 === parseInt(clean[10], 10);
}

/**
 * Validates Brazil CNPJ (14 digits) via two-stage Mod-11.
 */
export function validateBrazilCNPJ(cnpjStr: string): boolean {
  if (!cnpjStr || typeof cnpjStr !== "string") return false;
  const clean = cnpjStr.replace(/\D/g, "");
  if (!/^\d{14}$/.test(clean)) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i], 10) * w1[i];
  }
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;
  if (d1 !== parseInt(clean[12], 10)) return false;

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean[i], 10) * w2[i];
  }
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;
  return d2 === parseInt(clean[13], 10);
}

/**
 * Validates Argentina CUIT / CUIL (11 digits) via Mod-11.
 */
export function validateArgentinaCUIT(cuitStr: string): boolean {
  if (!cuitStr || typeof cuitStr !== "string") return false;
  const clean = cuitStr.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;

  const prefix = clean.substring(0, 2);
  const validPrefixes = ["20", "23", "24", "27", "30", "33", "34"];
  if (!validPrefixes.includes(prefix)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = rem === 0 ? 0 : 11 - rem === 11 ? 0 : 11 - rem;
  return parseInt(clean[10], 10) === expectedCheck;
}

/**
 * Validates Chile RUN / RUT (8-9 chars) via Mod-11.
 */
export function validateChileRUT(rutStr: string): boolean {
  if (!rutStr || typeof rutStr !== "string") return false;
  const clean = rutStr.replace(/[\s.-]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;

  const body = clean.slice(0, -1);
  const checkChar = clean.slice(-1);

  const weights = [2, 3, 4, 5, 6, 7, 2, 3];
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum += parseInt(body[body.length - 1 - i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = 11 - rem === 11 ? "0" : 11 - rem === 10 ? "K" : String(11 - rem);
  return checkChar === expectedCheck;
}

/**
 * Validates Colombia NIT (Número de Identificación Tributaria, 9 digits + check) via DIAN Mod-11.
 */
export function validateColombiaNIT(nitStr: string): boolean {
  if (!nitStr || typeof nitStr !== "string") return false;
  const clean = nitStr.replace(/[\s.-]/g, "");
  if (!/^\d{10}$/.test(clean)) return false;

  const weights = [41, 37, 29, 23, 19, 17, 13, 7, 3];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = rem > 1 ? 11 - rem : rem;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Peru RUC (11 digits) via SUNAT Mod-11.
 */
export function validatePeruRUC(rucStr: string): boolean {
  if (!rucStr || typeof rucStr !== "string") return false;
  const clean = rucStr.trim();
  if (!/^(?:10|15|17|20)\d{9}$/.test(clean)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  const rem = sum % 11;
  const expectedCheck = 11 - rem === 11 ? 0 : 11 - rem === 10 ? 0 : 11 - rem;
  return parseInt(clean[10], 10) === expectedCheck;
}

/**
 * Validates Ecuador Cédula (10 digits) via Mod-10 and province bounds.
 */
export function validateEcuadorCedula(cedulaStr: string): boolean {
  if (!cedulaStr || typeof cedulaStr !== "string") return false;
  const clean = cedulaStr.trim();
  if (!/^\d{10}$/.test(clean)) return false;

  const prov = parseInt(clean.substring(0, 2), 10);
  if (prov < 1 || (prov > 24 && prov !== 30)) return false;

  const thirdDigit = parseInt(clean[2], 10);
  if (thirdDigit >= 6) return false;

  const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = parseInt(clean[i], 10) * weights[i];
    if (p >= 10) p -= 9;
    sum += p;
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  return parseInt(clean[9], 10) === expectedCheck;
}

/**
 * Validates Uruguay Cédula de Identidad (7-8 digits) via Mod-10.
 */
export function validateUruguayCI(ciStr: string): boolean {
  if (!ciStr || typeof ciStr !== "string") return false;
  const clean = ciStr.replace(/[\s.-]/g, "");
  if (!/^\d{7,8}$/.test(clean)) return false;

  const padded = clean.padStart(8, "0");
  const weights = [2, 9, 8, 7, 6, 3, 4];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(padded[i], 10) * weights[i];
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  return parseInt(padded[7], 10) === expectedCheck;
}
