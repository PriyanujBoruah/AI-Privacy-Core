import { Rule } from "./types";
import {
  validateUSSSN,
  validateUSDEA,
  validateUSABARouting,
  validateCanadaSIN,
  validateOntarioOHIP,
  validateMexicoCURP,
  validateMexicoRFC,
  validateMexicoNSS,
  validateDominicanCedula,
} from "../validators/north_america";

export const NORTH_AMERICA_RULES: Rule[] = [
  // United States (US)
  {
    id: "RULE_SSN",
    type: "GOV_ID_SSN",
    category: "north_america",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    tokenPrefix: "SSN",
    validator: (ssn) => validateUSSSN(ssn),
  },
  {
    id: "RULE_US_ITIN",
    type: "GOV_ID_ITIN",
    category: "north_america",
    pattern: /\b9\d{2}-\d{2}-\d{4}\b/g,
    tokenPrefix: "ITIN",
  },
  {
    id: "RULE_US_EIN",
    type: "FIN_EIN",
    category: "north_america",
    pattern: /\b\d{2}-\d{7}\b/g,
    tokenPrefix: "EIN",
  },
  {
    id: "RULE_US_DEA",
    type: "HLTH_DEA",
    category: "north_america",
    pattern: /\b[A-Z]{2}\d{7}\b/g,
    tokenPrefix: "DEA",
    validator: (dea) => validateUSDEA(dea),
  },
  {
    id: "RULE_US_ABA",
    type: "FIN_US_ABA",
    category: "north_america",
    pattern: /\b\d{9}\b/g,
    tokenPrefix: "US_ABA_ROUTING",
    validator: (aba) => validateUSABARouting(aba),
  },
  {
    id: "RULE_US_MBI",
    type: "HLTH_US_MBI",
    category: "north_america",
    pattern: /(?:^|\s)(?:MBI:?\s?|Medicare:?\s?)([1-9][A-Z][A-Z0-9][0-9][- ]?[A-Z][A-Z0-9][0-9][- ]?[A-Z0-9]{4})\b/gi,
    tokenPrefix: "US_MBI",
  },

  // Canada (CA)
  {
    id: "RULE_CA_SIN",
    type: "GOV_ID_SIN",
    category: "north_america",
    pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
    tokenPrefix: "SIN",
    validator: (sin) => validateCanadaSIN(sin),
  },
  {
    id: "RULE_CA_BN",
    type: "FIN_CA_BN",
    category: "north_america",
    pattern: /(?:^|\s)(?:BN|GST\/HST):?\s?(\d{9}(?:RT\d{4})?)\b/gi,
    tokenPrefix: "CA_BN",
  },
  {
    id: "RULE_CA_OHIP",
    type: "HLTH_CA_OHIP",
    category: "north_america",
    pattern: /\b\d{4}[-\s]?\d{3}[-\s]?\d{3}\b/g,
    tokenPrefix: "CA_HEALTH",
    validator: (ohip) => validateOntarioOHIP(ohip),
  },
  {
    id: "RULE_CA_PASSPORT",
    type: "GOV_ID_CA_PASSPORT",
    category: "north_america",
    pattern: /(?:^|\s)(?:Passport|Passeport):?\s?([A-Z]{2}\d{6})\b/gi,
    tokenPrefix: "CA_PASSPORT",
  },

  // Mexico (MX)
  {
    id: "RULE_MX_CURP",
    type: "GOV_ID_MX_CURP",
    category: "north_america",
    pattern: /\b[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d\b/g,
    tokenPrefix: "MX_CURP",
    validator: (curp) => validateMexicoCURP(curp),
  },
  {
    id: "RULE_MX_RFC",
    type: "FIN_MX_RFC",
    category: "north_america",
    pattern: /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/g,
    tokenPrefix: "MX_RFC",
    validator: (rfc) => validateMexicoRFC(rfc),
  },
  {
    id: "RULE_MX_NSS",
    type: "HLTH_MX_NSS",
    category: "north_america",
    pattern: /\b\d{11}\b/g,
    tokenPrefix: "MX_NSS",
    validator: (nss) => validateMexicoNSS(nss),
  },
  {
    id: "RULE_MX_INE",
    type: "GOV_ID_MX_INE",
    category: "north_america",
    pattern: /\b[A-Z]{6}\d{8}[HM]\d{3}\b/g,
    tokenPrefix: "MX_INE",
  },

  // Dominican Republic (DO)
  {
    id: "RULE_DO_CEDULA",
    type: "GOV_ID_DO_CEDULA",
    category: "north_america",
    pattern: /\b\d{3}-\d{7}-\d\b/g,
    tokenPrefix: "DO_CEDULA",
    validator: (cedula) => validateDominicanCedula(cedula),
  },

  // Costa Rica (CR)
  {
    id: "RULE_CR_CEDULA",
    type: "GOV_ID_CR_CEDULA",
    category: "north_america",
    pattern: /\b(?:[1-9]\d{8}|\d-\d{4}-\d{4})\b/g,
    tokenPrefix: "CR_CEDULA",
  },

  // Guatemala (GT)
  {
    id: "RULE_GT_CUI",
    type: "GOV_ID_GT_CUI",
    category: "north_america",
    pattern: /\b\d{4}\s?\d{5}\s?\d{4}\b/g,
    tokenPrefix: "GT_CUI",
  },
  {
    id: "RULE_GT_NIT",
    type: "FIN_GT_NIT",
    category: "north_america",
    pattern: /(?:^|\s)(?:NIT:?\s?)(\d{1,8}-?[0-9K])\b/gi,
    tokenPrefix: "GT_NIT",
  },

  // Panama (PA)
  {
    id: "RULE_PA_CEDULA",
    type: "GOV_ID_PA_CEDULA",
    category: "north_america",
    pattern: /\b(?:[1-9]|PE|E|N)-\d{1,4}-\d{1,6}\b/g,
    tokenPrefix: "PA_CEDULA",
  },

  // Jamaica (JM)
  {
    id: "RULE_JM_TRN",
    type: "FIN_JM_TRN",
    category: "north_america",
    pattern: /(?:^|\s)(?:TRN:?\s?)(\d{3}-\d{3}-\d{3})\b/gi,
    tokenPrefix: "JM_TRN",
  },
];
