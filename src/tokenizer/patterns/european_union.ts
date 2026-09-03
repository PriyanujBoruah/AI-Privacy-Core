import { Rule } from "./types";
import {
  validateItalyCodiceFiscale,
  validateSpainDNI,
  validatePolandPESEL,
  validatePolandNIP,
  validateNetherlandsBSN,
  validateBelgiumRRN,
  validateSwedenPIN,
  validatePortugalNIF,
  validateIrelandPPSN,
  validateCzechBirthNumber,
  validateRomaniaCNP,
  validateHungaryTIN,
  validateDenmarkCPR,
  validateFinlandHETU,
  validateBulgariaEGN,
  validateCroatiaOIB,
} from "../validators/european_union";

export const EUROPEAN_UNION_RULES: Rule[] = [
  // 1. Germany (DE)
  {
    id: "RULE_DE_STEUER_ID",
    type: "FIN_STEUER_ID",
    category: "european_union",
    pattern: /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
    tokenPrefix: "STEUER_ID",
  },
  {
    id: "RULE_DE_STEUER_NR",
    type: "FIN_DE_STEUER_NR",
    category: "european_union",
    pattern: /\b\d{2,3}\/\d{3,4}\/\d{4,5}\b/g,
    tokenPrefix: "DE_STEUER_NR",
  },

  // 2. France (FR)
  {
    id: "RULE_FR_NIR",
    type: "GOV_ID_NIR",
    category: "european_union",
    pattern: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    tokenPrefix: "NIR",
  },
  {
    id: "RULE_FR_SIREN",
    type: "FIN_FR_SIREN",
    category: "european_union",
    pattern: /(?:^|\s)(?:SIREN|SIRET):?\s?(\d{9}|\d{14})\b/gi,
    tokenPrefix: "FR_SIREN",
  },

  // 3. Italy (IT)
  {
    id: "RULE_IT_CODICE_FISCALE",
    type: "GOV_ID_CODICE_FISCALE",
    category: "european_union",
    pattern: /\b[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]\b/gi,
    tokenPrefix: "CODICE_FISCALE",
    validator: (cf) => validateItalyCodiceFiscale(cf),
  },
  {
    id: "RULE_IT_PIVA",
    type: "FIN_IT_PIVA",
    category: "european_union",
    pattern: /(?:^|\s)(?:P\.?IVA|Partita\s?IVA):?\s?(\d{11})\b/gi,
    tokenPrefix: "IT_PIVA",
  },

  // 4. Spain (ES)
  {
    id: "RULE_ES_DNI",
    type: "GOV_ID_DNI",
    category: "european_union",
    pattern: /\b[XYZ\d]\d{7}[A-Z]\b/gi,
    tokenPrefix: "DNI",
    validator: (dni) => validateSpainDNI(dni),
  },
  {
    id: "RULE_ES_CIF",
    type: "FIN_ES_CIF",
    category: "european_union",
    pattern: /\b[A-HJ-NP-SUVW]\d{7}[0-9A-J]\b/gi,
    tokenPrefix: "ES_CIF",
  },

  // 5. Poland (PL)
  {
    id: "RULE_PL_PESEL",
    type: "GOV_ID_PL_PESEL",
    category: "european_union",
    pattern: /\b\d{11}\b/g,
    tokenPrefix: "PL_PESEL",
    validator: (pesel) => validatePolandPESEL(pesel),
  },
  {
    id: "RULE_PL_NIP",
    type: "FIN_PL_NIP",
    category: "european_union",
    pattern: /\b(?:\d{3}-\d{3}-\d{2}-\d{2}|\d{10})\b/g,
    tokenPrefix: "PL_NIP",
    validator: (nip) => validatePolandNIP(nip),
  },

  // 6. Netherlands (NL)
  {
    id: "RULE_NL_BSN",
    type: "GOV_ID_NL_BSN",
    category: "european_union",
    pattern: /\b\d{8,9}\b/g,
    tokenPrefix: "NL_BSN",
    validator: (bsn) => validateNetherlandsBSN(bsn),
  },

  // 7. Belgium (BE)
  {
    id: "RULE_BE_RRN",
    type: "GOV_ID_BE_RRN",
    category: "european_union",
    pattern: /\b(?:\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}|\d{6}-\d{3}\.?\d{2})\b/g,
    tokenPrefix: "BE_RRN",
    validator: (rrn) => validateBelgiumRRN(rrn),
  },
  {
    id: "RULE_BE_CBE",
    type: "FIN_BE_CBE",
    category: "european_union",
    pattern: /(?:^|\s)(?:KBO|CBE|BCE):?\s?([01]\d{9})\b/gi,
    tokenPrefix: "BE_CBE",
  },

  // 8. Sweden (SE)
  {
    id: "RULE_SE_PIN",
    type: "GOV_ID_SE_PIN",
    category: "european_union",
    pattern: /\b(?:19|20)?\d{6}[-+]\d{4}\b/g,
    tokenPrefix: "SE_PIN",
    validator: (pin) => validateSwedenPIN(pin),
  },

  // 9. Austria (AT)
  {
    id: "RULE_AT_SVNR",
    type: "HLTH_AT_SVNR",
    category: "european_union",
    pattern: /\b\d{4}\s?\d{6}\b/g,
    tokenPrefix: "AT_SVNR",
  },

  // 10. Portugal (PT)
  {
    id: "RULE_PT_NIF",
    type: "FIN_PT_NIF",
    category: "european_union",
    pattern: /\b[1-9]\d{8}\b/g,
    tokenPrefix: "PT_NIF",
    validator: (nif) => validatePortugalNIF(nif),
  },

  // 11. Ireland (IE)
  {
    id: "RULE_IE_PPSN",
    type: "GOV_ID_IE_PPSN",
    category: "european_union",
    pattern: /\b\d{7}[A-W][A-W]?\b/gi,
    tokenPrefix: "IE_PPSN",
    validator: (ppsn) => validateIrelandPPSN(ppsn),
  },

  // 12. Greece (GR)
  {
    id: "RULE_GR_AFM",
    type: "FIN_GR_AFM",
    category: "european_union",
    pattern: /(?:^|\s)(?:AFM|ΑΦΜ|TIN:?\s?)(\d{9})\b/gi,
    tokenPrefix: "GR_AFM",
  },
  {
    id: "RULE_GR_AMKA",
    type: "HLTH_GR_AMKA",
    category: "european_union",
    pattern: /(?:^|\s)(?:AMKA|ΑΜΚΑ):?\s?(\d{11})\b/gi,
    tokenPrefix: "GR_AMKA",
  },

  // 13. Czech Republic (CZ)
  {
    id: "RULE_CZ_RC",
    type: "GOV_ID_CZ_RC",
    category: "european_union",
    pattern: /\b\d{6}\/?\d{3,4}\b/g,
    tokenPrefix: "CZ_RC",
    validator: (rc) => validateCzechBirthNumber(rc),
  },

  // 14. Romania (RO)
  {
    id: "RULE_RO_CNP",
    type: "GOV_ID_RO_CNP",
    category: "european_union",
    pattern: /\b[1-8]\d{12}\b/g,
    tokenPrefix: "RO_CNP",
    validator: (cnp) => validateRomaniaCNP(cnp),
  },

  // 15. Hungary (HU)
  {
    id: "RULE_HU_TIN",
    type: "FIN_HU_TIN",
    category: "european_union",
    pattern: /\b8\d{9}\b/g,
    tokenPrefix: "HU_TIN",
    validator: (tin) => validateHungaryTIN(tin),
  },

  // 16. Denmark (DK)
  {
    id: "RULE_DK_CPR",
    type: "GOV_ID_DK_CPR",
    category: "european_union",
    pattern: /\b\d{6}-?\d{4}\b/g,
    tokenPrefix: "DK_CPR",
    validator: (cpr) => validateDenmarkCPR(cpr),
  },

  // 17. Finland (FI)
  {
    id: "RULE_FI_HETU",
    type: "GOV_ID_FI_HETU",
    category: "european_union",
    pattern: /\b\d{6}[-+A-FU-Y]\d{3}[0-9A-Z]\b/gi,
    tokenPrefix: "FI_HETU",
    validator: (hetu) => validateFinlandHETU(hetu),
  },

  // 18. Slovakia (SK)
  {
    id: "RULE_SK_RC",
    type: "GOV_ID_SK_RC",
    category: "european_union",
    pattern: /(?:^|\s)(?:RČ|RC):?\s?(\d{6}\/?\d{3,4})\b/gi,
    tokenPrefix: "SK_RC",
    validator: (rc) => validateCzechBirthNumber(rc),
  },

  // 19. Bulgaria (BG)
  {
    id: "RULE_BG_EGN",
    type: "GOV_ID_BG_EGN",
    category: "european_union",
    pattern: /\b\d{10}\b/g,
    tokenPrefix: "BG_EGN",
    validator: (egn) => validateBulgariaEGN(egn),
  },

  // 20. Croatia (HR)
  {
    id: "RULE_HR_OIB",
    type: "GOV_ID_HR_OIB",
    category: "european_union",
    pattern: /\b\d{11}\b/g,
    tokenPrefix: "HR_OIB",
    validator: (oib) => validateCroatiaOIB(oib),
  },

  // 21. Lithuania (LT)
  {
    id: "RULE_LT_AK",
    type: "GOV_ID_LT_AK",
    category: "european_union",
    pattern: /\b[1-6]\d{10}\b/g,
    tokenPrefix: "LT_AK",
  },

  // 22. Slovenia (SI)
  {
    id: "RULE_SI_TIN",
    type: "FIN_SI_TIN",
    category: "european_union",
    pattern: /(?:^|\s)(?:Davčna|SI):?\s?(\d{8})\b/gi,
    tokenPrefix: "SI_TIN",
  },
  {
    id: "RULE_SI_EMSO",
    type: "GOV_ID_SI_EMSO",
    category: "european_union",
    pattern: /(?:^|\s)(?:EMŠO|EMSO):?\s?(\d{13})\b/gi,
    tokenPrefix: "SI_EMSO",
  },

  // 23. Latvia (LV)
  {
    id: "RULE_LV_PK",
    type: "GOV_ID_LV_PK",
    category: "european_union",
    pattern: /\b(?:[0-3]\d[0-1]\d\d{2}|32\d{4})-?\d{5}\b/g,
    tokenPrefix: "LV_PK",
  },

  // 24. Estonia (EE)
  {
    id: "RULE_EE_IK",
    type: "GOV_ID_EE_IK",
    category: "european_union",
    pattern: /\b[1-6]\d{10}\b/g,
    tokenPrefix: "EE_IK",
  },

  // 25. Cyprus (CY)
  {
    id: "RULE_CY_TIC",
    type: "FIN_CY_TIC",
    category: "european_union",
    pattern: /(?:^|\s)(?:TIC|TIN):?\s?(\d{8}[A-Z])\b/gi,
    tokenPrefix: "CY_TIC",
  },

  // 26. Luxembourg (LU)
  {
    id: "RULE_LU_NID",
    type: "GOV_ID_LU_NID",
    category: "european_union",
    pattern: /(?:^|\s)(?:Matricule|LU:?)\s?((?:19|20)\d{9}\d{2})\b/gi,
    tokenPrefix: "LU_NID",
  },

  // 27. Malta (MT)
  {
    id: "RULE_MT_ID",
    type: "GOV_ID_MT_ID",
    category: "european_union",
    pattern: /\b\d{1,7}[MGLHABZ]\b/gi,
    tokenPrefix: "MT_ID",
  },
];
