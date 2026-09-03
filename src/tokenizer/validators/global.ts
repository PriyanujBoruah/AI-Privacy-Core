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
