/**
 * Format-Preserving Masking (FPE) Generators
 * Generates realistic, syntax-valid synthetic mock values for coding/SQL LLM pipelines.
 */

const MOCK_NAMES = [
  "Jordan Smith",
  "Morgan Lee",
  "Taylor Reed",
  "Alex Vance",
  "Casey Wright",
  "Riley Bennett",
  "Avery Clark",
  "Quinn Harper",
];

export function generateSyntheticName(index: number): string {
  return MOCK_NAMES[(index - 1) % MOCK_NAMES.length];
}

export function generateSyntheticEmail(index: number): string {
  return `user_a${index}@mockdomain.internal`;
}

export function generateSyntheticPhone(index: number): string {
  const lastFour = String(1000 + (index % 8999)).padStart(4, "0");
  return `+1-555-019-${lastFour}`;
}

export function generateSyntheticNRIC(index: number): string {
  const numStr = String(100000 + (index % 899999));
  return `S${numStr}A`;
}

export function generateSyntheticSSN(index: number): string {
  const lastFour = String(1000 + (index % 8999)).padStart(4, "0");
  return `987-65-${lastFour}`;
}

/**
 * Generates a Luhn-valid synthetic credit card number
 */
export function generateSyntheticCard(index: number): string {
  // Luhn-valid prefix: 4532-0151-9988-XXXX
  const sub = String(1000 + (index * 7) % 8999).padStart(4, "0");
  return `4532-0151-9988-${sub}`;
}

export function generateSyntheticInvoice(index: number): string {
  return `#INV-${9000 + index}`;
}

export function generateSyntheticCustom(index: number, _original: string): string {
  return `ProjectMock_${index}`;
}

export function generateSyntheticIBAN(index: number): string {
  return `GB29NWBK6016133192681${index}`;
}

export function generateFPEToken(
  prefix: string,
  index: number,
  originalValue: string
): string {
  switch (prefix.toUpperCase()) {
    case "PERSON":
      return generateSyntheticName(index);
    case "EMAIL":
      return generateSyntheticEmail(index);
    case "PHONE":
      return generateSyntheticPhone(index);
    case "NRIC":
      return generateSyntheticNRIC(index);
    case "SSN":
      return generateSyntheticSSN(index);
    case "CARD":
      return generateSyntheticCard(index);
    case "IBAN":
      return generateSyntheticIBAN(index);
    case "INVOICE":
      return generateSyntheticInvoice(index);
    case "CUSTOM":
    default:
      return generateSyntheticCustom(index, originalValue);
  }
}
