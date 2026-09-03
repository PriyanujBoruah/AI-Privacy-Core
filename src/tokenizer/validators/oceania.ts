/**
 * Oceania Checksum Validators
 */

/**
 * Validates Australian Tax File Number (TFN) (8 or 9 digits) via weighted Mod-11.
 */
export function validateAustraliaTFN(tfnStr: string): boolean {
  if (!tfnStr || typeof tfnStr !== "string") return false;
  const clean = tfnStr.replace(/[\s-]/g, "");
  if (!/^\d{8,9}$/.test(clean)) return false;

  const weights = clean.length === 9
    ? [1, 4, 3, 7, 5, 8, 6, 9, 10]
    : [10, 7, 8, 4, 6, 3, 5, 1];

  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum % 11 === 0;
}

/**
 * Validates Australian Business Number (ABN) (11 digits) via Mod-89.
 */
export function validateAustraliaABN(abnStr: string): boolean {
  if (!abnStr || typeof abnStr !== "string") return false;
  const clean = abnStr.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = (parseInt(clean[0], 10) - 1) * weights[0];
  for (let i = 1; i < 11; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum % 89 === 0;
}

/**
 * Validates Australian Medicare Card Number (10 digits) via Mod-10.
 */
export function validateAustraliaMedicare(medicareStr: string): boolean {
  if (!medicareStr || typeof medicareStr !== "string") return false;
  const clean = medicareStr.replace(/[\s-]/g, "");
  if (!/^[2-6]\d{9}$/.test(clean)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }
  return sum % 10 === parseInt(clean[8], 10);
}
