import { Rule } from "./types";
import {
  validateUKNHS,
  validateSwissAHV,
  validateSwissUID,
  validateNorwayFodselsnummer,
  validateIcelandKennitala,
  validateUkraineIPN,
  validateBalkanJMBG,
} from "../validators/europe_non_eu";

export const EUROPE_NON_EU_RULES: Rule[] = [
  // United Kingdom (UK)
  {
    id: "RULE_UK_NINO",
    type: "GOV_ID_NINO",
    category: "europe_non_eu",
    pattern: /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi,
    tokenPrefix: "NINO",
  },
  {
    id: "RULE_UK_NHS",
    type: "HLTH_NHS",
    category: "europe_non_eu",
    pattern: /\b\d{3}\s?\d{3}\s?\d{4}\b/g,
    tokenPrefix: "NHS",
    validator: (nhs) => validateUKNHS(nhs),
  },
  {
    id: "RULE_UK_UTR",
    type: "FIN_UTR",
    category: "europe_non_eu",
    pattern: /\b\d{10}\b/g,
    tokenPrefix: "UTR",
  },
  {
    id: "RULE_UK_CRN",
    type: "FIN_UK_CRN",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:CRN:?\s?|Company\s?No\.?:?\s?)((?:[A-Z]{2}\d{6}|\d{8}))\b/gi,
    tokenPrefix: "UK_CRN",
  },
  {
    id: "RULE_UK_DL",
    type: "GOV_ID_UK_DL",
    category: "europe_non_eu",
    pattern: /\b[A-Z9]{5}\d{6}[A-Z9]{2}\d{3}\b/g,
    tokenPrefix: "UK_DL",
  },

  // Switzerland (CH)
  {
    id: "RULE_CH_AHV",
    type: "GOV_ID_CH_AHV",
    category: "europe_non_eu",
    pattern: /\b756(?:\.\d{4}\.\d{4}\.\d{2}|\d{10})\b/g,
    tokenPrefix: "CH_AHV",
    validator: (ahv) => validateSwissAHV(ahv),
  },
  {
    id: "RULE_CH_UID",
    type: "FIN_CH_UID",
    category: "europe_non_eu",
    pattern: /\bCHE-?\d{3}\.?\d{3}\.?\d{3}\b/gi,
    tokenPrefix: "CH_UID",
    validator: (uid) => validateSwissUID(uid),
  },

  // Norway (NO)
  {
    id: "RULE_NO_FODSEL",
    type: "GOV_ID_NO_FODSEL",
    category: "europe_non_eu",
    pattern: /\b\d{6}\s?\d{5}\b/g,
    tokenPrefix: "NO_FODSEL",
    validator: (fnr) => validateNorwayFodselsnummer(fnr),
  },
  {
    id: "RULE_NO_ORG",
    type: "FIN_NO_ORG",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:Org\.?(?:nr)?\.?:?\s?)(\d{9})\b/gi,
    tokenPrefix: "NO_ORG",
  },

  // Iceland (IS)
  {
    id: "RULE_IS_KENNITALA",
    type: "GOV_ID_IS_KENNITALA",
    category: "europe_non_eu",
    pattern: /\b\d{6}-?\d{4}\b/g,
    tokenPrefix: "IS_KENNITALA",
    validator: (kt) => validateIcelandKennitala(kt),
  },

  // Ukraine (UA)
  {
    id: "RULE_UA_IPN",
    type: "FIN_UA_IPN",
    category: "europe_non_eu",
    pattern: /\b\d{10}\b/g,
    tokenPrefix: "UA_IPN",
    validator: (ipn) => validateUkraineIPN(ipn),
  },
  {
    id: "RULE_UA_EDRPOU",
    type: "FIN_UA_EDRPOU",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:EDRPOU:?\s?|ЄДРПОУ:?\s?)(\d{8})\b/gi,
    tokenPrefix: "UA_EDRPOU",
  },
  {
    id: "RULE_UA_UNZR",
    type: "GOV_ID_UA_UNZR",
    category: "europe_non_eu",
    pattern: /\b\d{8}-\d{5}\b/g,
    tokenPrefix: "UA_UNZR",
  },

  // Western Balkans (RS, BA, MK, ME)
  {
    id: "RULE_BALKAN_JMBG",
    type: "GOV_ID_BALKAN_JMBG",
    category: "europe_non_eu",
    pattern: /\b\d{13}\b/g,
    tokenPrefix: "BALKAN_JMBG",
    validator: (jmbg) => validateBalkanJMBG(jmbg),
  },
  {
    id: "RULE_RS_PIB",
    type: "FIN_RS_PIB",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:PIB:?\s?)(\d{9})\b/gi,
    tokenPrefix: "RS_PIB",
  },

  // Albania (AL)
  {
    id: "RULE_AL_NID",
    type: "GOV_ID_AL_NID",
    category: "europe_non_eu",
    pattern: /\b[A-Z]\d{8}[A-Z]\b/g,
    tokenPrefix: "AL_NID",
  },
  {
    id: "RULE_AL_NIPT",
    type: "FIN_AL_NIPT",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:NIPT:?\s?)([A-Z]\d{8}[A-Z])\b/gi,
    tokenPrefix: "AL_NIPT",
  },

  // Moldova (MD)
  {
    id: "RULE_MD_IDNP",
    type: "GOV_ID_MD_IDNP",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:IDNP:?\s?)(\d{13})\b/gi,
    tokenPrefix: "MD_IDNP",
  },

  // Caucasus (GE, AM, AZ)
  {
    id: "RULE_GE_PN",
    type: "GOV_ID_GE_PN",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:Personal\s?No\.?:?\s?)(\d{11})\b/gi,
    tokenPrefix: "GE_PN",
  },
  {
    id: "RULE_AM_PSN",
    type: "GOV_ID_AM_PSN",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:PSN:?\s?|ՀԾՀ:?\s?)(\d{10})\b/gi,
    tokenPrefix: "AM_PSN",
  },
  {
    id: "RULE_AZ_FIN",
    type: "GOV_ID_AZ_FIN",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:F[Iİ]N:?\s?)([A-Z0-9]{7})\b/gi,
    tokenPrefix: "AZ_FIN",
  },

  // Liechtenstein (LI)
  {
    id: "RULE_LI_PEID",
    type: "GOV_ID_LI_PEID",
    category: "europe_non_eu",
    pattern: /(?:^|\s)(?:PEID:?\s?)(\d{12})\b/gi,
    tokenPrefix: "LI_PEID",
  },
];
