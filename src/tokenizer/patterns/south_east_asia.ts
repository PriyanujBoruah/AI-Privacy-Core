import { Rule } from "./types";
import {
  validateSingaporeNRIC,
  validateIndonesiaNIK,
  validateThailandNationalID,
  validateVietnamCCCD,
} from "../validators/south_east_asia";

export const SOUTH_EAST_ASIA_RULES: Rule[] = [
  // Singapore (SG)
  {
    id: "RULE_SG_NRIC",
    type: "GOV_ID_NRIC",
    category: "south_east_asia",
    pattern: /\b[STFGM]\d{7}[A-Z]\b/gi,
    tokenPrefix: "NRIC",
    validator: (nric) => validateSingaporeNRIC(nric),
  },
  {
    id: "RULE_SG_UEN",
    type: "FIN_UEN",
    category: "south_east_asia",
    pattern: /\b(?:\d{9}[A-Z]|[TSR]\d{2}[A-Z]{2}\d{4}[A-Z]|\d{8}[A-Z])\b/g,
    tokenPrefix: "UEN",
  },

  // Malaysia (MY)
  {
    id: "RULE_MY_MYKAD",
    type: "GOV_ID_MYKAD",
    category: "south_east_asia",
    pattern: /\b\d{6}-\d{2}-\d{4}\b/g,
    tokenPrefix: "MYKAD",
  },
  {
    id: "RULE_MY_TIN",
    type: "FIN_MY_TIN",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:TIN:?\s?|(?:Cukai\s?|LHDN\s?)?(?:SG|OG|C))([0-9]{10,11})\b/gi,
    tokenPrefix: "MY_TIN",
  },
  {
    id: "RULE_MY_SSM",
    type: "FIN_MY_SSM",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:SSM:?\s?|No\.?\s?Syarikat:?\s?)((?:19|20)\d{10}|\d{6}-[A-Z])\b/gi,
    tokenPrefix: "MY_SSM",
  },

  // Indonesia (ID)
  {
    id: "RULE_ID_NIK",
    type: "GOV_ID_ID_NIK",
    category: "south_east_asia",
    pattern: /\b[1-9]\d{15}\b/g,
    tokenPrefix: "ID_NIK",
    validator: (nik) => validateIndonesiaNIK(nik),
  },
  {
    id: "RULE_ID_NPWP",
    type: "FIN_ID_NPWP",
    category: "south_east_asia",
    pattern: /\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b/g,
    tokenPrefix: "ID_NPWP",
  },

  // Thailand (TH)
  {
    id: "RULE_TH_NID",
    type: "GOV_ID_TH_NID",
    category: "south_east_asia",
    pattern: /\b(?:\d-\d{4}-\d{5}-\d{2}-\d|\d{13})\b/g,
    tokenPrefix: "TH_NID",
    validator: (idStr) => validateThailandNationalID(idStr),
  },
  {
    id: "RULE_TH_TIN",
    type: "FIN_TH_TIN",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:TIN:?\s?|เลขประจำตัวผู้เสียภาษี:?\s?)(\d{13})\b/gi,
    tokenPrefix: "TH_TIN",
  },

  // Vietnam (VN)
  {
    id: "RULE_VN_CCCD",
    type: "GOV_ID_VN_CCCD",
    category: "south_east_asia",
    pattern: /\b0\d{2}[0-3]\d{2}\d{6}\b/g,
    tokenPrefix: "VN_CCCD",
    validator: (cccd) => validateVietnamCCCD(cccd),
  },
  {
    id: "RULE_VN_MST",
    type: "FIN_VN_MST",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:MST:?\s?|Mã\s?số\s?thuế:?\s?)(\d{10}(?:-\d{3})?)\b/gi,
    tokenPrefix: "VN_MST",
  },

  // Philippines (PH)
  {
    id: "RULE_PH_PCN",
    type: "GOV_ID_PH_PCN",
    category: "south_east_asia",
    pattern: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,
    tokenPrefix: "PH_PCN",
  },
  {
    id: "RULE_PH_SSS",
    type: "GOV_ID_PH_SSS",
    category: "south_east_asia",
    pattern: /\b\d{2}-\d{7}-\d\b/g,
    tokenPrefix: "PH_SSS",
  },
  {
    id: "RULE_PH_TIN",
    type: "FIN_PH_TIN",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:TIN:?\s?|BIR:?\s?)(\d{3}-\d{3}-\d{3}(?:-\d{3})?)\b/gi,
    tokenPrefix: "PH_TIN",
  },
  {
    id: "RULE_PH_PHILHEALTH",
    type: "HLTH_PH_PHILHEALTH",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:PhilHealth:?\s?|PIN:?\s?)(\d{2}-\d{9}-\d)\b/gi,
    tokenPrefix: "PH_PHILHEALTH",
  },

  // Myanmar (MM)
  {
    id: "RULE_MM_NRC",
    type: "GOV_ID_MM_NRC",
    category: "south_east_asia",
    pattern: /\b\d{1,2}\/[A-Z]{6}\([NPE]\)\d{6}\b/g,
    tokenPrefix: "MM_NRC",
  },

  // Cambodia (KH)
  {
    id: "RULE_KH_ID",
    type: "GOV_ID_KH_ID",
    category: "south_east_asia",
    pattern: /(?:^|\s)(?:Khmer\s?ID:?|ID\s?Card:?|National\s?ID:?)\s?(\d{9})\b/gi,
    tokenPrefix: "KH_ID",
  },

  // Brunei (BN)
  {
    id: "RULE_BN_IC",
    type: "GOV_ID_BN_IC",
    category: "south_east_asia",
    pattern: /\b0[01]-\d{6}\b/g,
    tokenPrefix: "BN_IC",
  },
];
