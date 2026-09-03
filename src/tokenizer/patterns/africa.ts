import { Rule } from "./types";
import {
  validateSouthAfricaID,
  validateEgyptNationalID,
  validateRwandaNationalID,
} from "../validators/africa";

export const AFRICA_RULES: Rule[] = [
  // Kenya
  {
    id: "RULE_KE_KRA_PIN",
    type: "FIN_KRA_PIN",
    category: "africa",
    pattern: /\b[AP]\d{9}[A-Z]\b/g,
    tokenPrefix: "KRA_PIN",
  },
  {
    id: "RULE_KE_ID",
    type: "GOV_ID_KE_ID",
    category: "africa",
    pattern: /(?:^|\s)(?:National\s?ID|ID\s?No\.?):?\s?(\d{7,8})\b/gi,
    tokenPrefix: "KE_ID",
  },

  // Nigeria
  {
    id: "RULE_NG_NIN",
    type: "GOV_ID_NIN",
    category: "africa",
    pattern: /\b\d{11}\b/g,
    tokenPrefix: "NIN",
  },
  {
    id: "RULE_NG_BVN",
    type: "FIN_BVN",
    category: "africa",
    pattern: /(?:^|\s)(?:BVN:?\s?|BVN#\s?)(\d{11})\b/gi,
    tokenPrefix: "BVN",
  },

  // South Africa
  {
    id: "RULE_ZA_ID",
    type: "GOV_ID_ZA_ID",
    category: "africa",
    pattern: /\b\d{13}\b/g,
    tokenPrefix: "ZA_ID",
    validator: (idStr) => validateSouthAfricaID(idStr),
  },
  {
    id: "RULE_ZA_TAX",
    type: "FIN_ZA_TAX",
    category: "africa",
    pattern: /(?:^|\s)(?:Tax\s?Ref(?:erence)?(?:\s?No\.?)?:?\s?)([0-39]\d{9})\b/gi,
    tokenPrefix: "ZA_TAX",
  },

  // Egypt
  {
    id: "RULE_EG_NID",
    type: "GOV_ID_EG_NID",
    category: "africa",
    pattern: /\b[23]\d{13}\b/g,
    tokenPrefix: "EG_NID",
    validator: (str) => validateEgyptNationalID(str),
  },
  {
    id: "RULE_EG_TAX",
    type: "FIN_EG_TAX",
    category: "africa",
    pattern: /(?:^|\s)(?:Tax\s?Card|بطاقة\s?ضريبية|TRN:?\s?)(\d{3}[-\s]?\d{3}[-\s]?\d{3})\b/gi,
    tokenPrefix: "EG_TAX",
  },

  // Ghana
  {
    id: "RULE_GH_CARD",
    type: "GOV_ID_GH_CARD",
    category: "africa",
    pattern: /\bGHA-\d{9}-\d\b/g,
    tokenPrefix: "GH_CARD",
  },
  {
    id: "RULE_GH_TIN",
    type: "FIN_GH_TIN",
    category: "africa",
    pattern: /(?:^|\s)(?:Ghana\s?TIN|GRA\s?TIN|TIN:?\s?)(P\d{9}[A-Z])\b/gi,
    tokenPrefix: "GH_TIN",
  },

  // Ethiopia
  {
    id: "RULE_ET_FAYDA",
    type: "GOV_ID_ET_FAYDA",
    category: "africa",
    pattern: /(?:^|\s)(?:Fayda|FIN:?\s?)(\d{4}\s?\d{4}\s?\d{4})\b/gi,
    tokenPrefix: "ET_FAYDA",
  },

  // Morocco
  {
    id: "RULE_MA_CNIE",
    type: "GOV_ID_MA_CNIE",
    category: "africa",
    pattern: /(?:^|\s)(?:CNIE:?\s?|CIN:?\s?)([A-Z]{1,2}\d{5,6})\b/gi,
    tokenPrefix: "MA_CNIE",
  },

  // Uganda
  {
    id: "RULE_UG_NIN",
    type: "GOV_ID_UG_NIN",
    category: "africa",
    pattern: /\bC[MF]\d{8}[A-Z0-9]{4}\b/g,
    tokenPrefix: "UG_NIN",
  },

  // Tanzania
  {
    id: "RULE_TZ_NIDA",
    type: "GOV_ID_TZ_NIDA",
    category: "africa",
    pattern: /\b\d{8}-\d{5}-\d{5}-\d{2}\b/g,
    tokenPrefix: "TZ_NIDA",
  },

  // Rwanda
  {
    id: "RULE_RW_NID",
    type: "GOV_ID_RW_NID",
    category: "africa",
    pattern: /\b1\s?\d{4}\s?[78]\s?\d{7}\s?\d\s?\d{2}\b/g,
    tokenPrefix: "RW_NID",
    validator: (str) => validateRwandaNationalID(str),
  },

  // Algeria
  {
    id: "RULE_DZ_NIN",
    type: "GOV_ID_DZ_NIN",
    category: "africa",
    pattern: /\b\d{18}\b/g,
    tokenPrefix: "DZ_NIN",
  },

  // Tunisia
  {
    id: "RULE_TN_CIN",
    type: "GOV_ID_TN_CIN",
    category: "africa",
    pattern: /(?:^|\s)(?:CIN:?\s?|بطاقة\s?تعريف:?\s?)(\d{8})\b/gi,
    tokenPrefix: "TN_CIN",
  },

  // Ivory Coast (Côte d'Ivoire)
  {
    id: "RULE_CI_NNI",
    type: "GOV_ID_CI_NNI",
    category: "africa",
    pattern: /(?:^|\s)(?:NNI:?\s?)(\d{11})\b/gi,
    tokenPrefix: "CI_NNI",
  },

  // Senegal
  {
    id: "RULE_SN_CNI",
    type: "GOV_ID_SN_CNI",
    category: "africa",
    pattern: /\b[12]\s?\d{3}\s?\d{4}\s?\d{5}\s?\d{4}\b/g,
    tokenPrefix: "SN_CNI",
  },

  // Zimbabwe
  {
    id: "RULE_ZW_ID",
    type: "GOV_ID_ZW_ID",
    category: "africa",
    pattern: /\b\d{2}-\d{6,7}[-\s]?[A-Z][-\s]?\d{2}\b/gi,
    tokenPrefix: "ZW_ID",
  },

  // Zambia
  {
    id: "RULE_ZM_NRC",
    type: "GOV_ID_ZM_NRC",
    category: "africa",
    pattern: /\b\d{6}\/\d{2}\/\d\b/g,
    tokenPrefix: "ZM_NRC",
  },

  // Angola
  {
    id: "RULE_AO_BI",
    type: "GOV_ID_AO_BI",
    category: "africa",
    pattern: /\b\d{9}[A-Z]{2}\d{3}\b/g,
    tokenPrefix: "AO_BI",
  },
];
