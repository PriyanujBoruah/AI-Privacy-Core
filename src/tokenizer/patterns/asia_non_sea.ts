import { Rule } from "./types";
import {
  validateAadhaar,
  validatePan,
  validateGstin,
  validateJapanMyNumber,
  validateSouthKoreaRRN,
  validateSouthKoreaBRN,
  validateTaiwanID,
  validateChinaResidentID,
  validateHongKongHKID,
  validateSaudiNationalID,
  validateUAEEmiratesID,
  validateIsraelID,
  validateTurkeyTCKN,
  validateKazakhstanIIN,
} from "../validators/asia_non_sea";

export const ASIA_NON_SEA_RULES: Rule[] = [
  // India (IN)
  {
    id: "RULE_IN_AADHAAR",
    type: "GOV_ID_AADHAAR",
    category: "asia_non_sea",
    pattern: /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g,
    tokenPrefix: "AADHAAR",
    validator: (str) => validateAadhaar(str),
  },
  {
    id: "RULE_IN_PAN",
    type: "GOV_ID_PAN",
    category: "asia_non_sea",
    pattern: /\b[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]\b/g,
    tokenPrefix: "PAN",
    validator: (str) => validatePan(str),
  },
  {
    id: "RULE_IN_GSTIN",
    type: "FIN_GSTIN",
    category: "asia_non_sea",
    pattern: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g,
    tokenPrefix: "GSTIN",
    validator: (str) => validateGstin(str),
  },
  {
    id: "RULE_IN_PASSPORT",
    type: "GOV_ID_PASSPORT",
    category: "asia_non_sea",
    pattern: /\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b/g,
    tokenPrefix: "PASSPORT",
  },
  {
    id: "RULE_IN_VOTER",
    type: "GOV_ID_VOTER",
    category: "asia_non_sea",
    pattern: /\b[A-Z]{3}\d{7}\b/g,
    tokenPrefix: "VOTER_ID",
  },
  {
    id: "RULE_IN_ABHA",
    type: "HLTH_ABHA",
    category: "asia_non_sea",
    pattern: /\b\d{2}-\d{4}-\d{4}-\d{4}\b/g,
    tokenPrefix: "ABHA",
  },

  // Japan (JP)
  {
    id: "RULE_JP_MYNUMBER",
    type: "GOV_ID_JP_MYNUMBER",
    category: "asia_non_sea",
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    tokenPrefix: "JP_MYNUMBER",
    validator: (idStr) => validateJapanMyNumber(idStr),
  },
  {
    id: "RULE_JP_CORP",
    type: "FIN_JP_CORP",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:法人番号|Corporate\s?No\.?:?\s?)(\d{13})\b/gi,
    tokenPrefix: "JP_CORP",
  },

  // South Korea (KR)
  {
    id: "RULE_KR_RRN",
    type: "GOV_ID_KR_RRN",
    category: "asia_non_sea",
    pattern: /\b\d{6}-[1-8]\d{6}\b/g,
    tokenPrefix: "KR_RRN",
    validator: (rrn) => validateSouthKoreaRRN(rrn),
  },
  {
    id: "RULE_KR_BRN",
    type: "FIN_KR_BRN",
    category: "asia_non_sea",
    pattern: /\b\d{3}-\d{2}-\d{5}\b/g,
    tokenPrefix: "KR_BRN",
    validator: (brn) => validateSouthKoreaBRN(brn),
  },

  // Taiwan (TW)
  {
    id: "RULE_TW_ID",
    type: "GOV_ID_TW_ID",
    category: "asia_non_sea",
    pattern: /\b[A-Z][1289]\d{8}\b/gi,
    tokenPrefix: "TW_ID",
    validator: (idStr) => validateTaiwanID(idStr),
  },
  {
    id: "RULE_TW_UBN",
    type: "FIN_TW_UBN",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:統一編號|UBN:?\s?)(\d{8})\b/gi,
    tokenPrefix: "TW_UBN",
  },

  // China (CN) & Hong Kong (HK)
  {
    id: "RULE_CN_RESIDENT_ID",
    type: "GOV_ID_RESIDENT_ID",
    category: "asia_non_sea",
    pattern: /\b\d{17}[\dX]\b/gi,
    tokenPrefix: "RESIDENT_ID",
    validator: (idStr) => validateChinaResidentID(idStr),
  },
  {
    id: "RULE_CN_USCC",
    type: "FIN_CN_USCC",
    category: "asia_non_sea",
    pattern: /\b[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}\b/g,
    tokenPrefix: "CN_USCC",
  },
  {
    id: "RULE_HK_HKID",
    type: "GOV_ID_HKID",
    category: "asia_non_sea",
    pattern: /\b[A-Z]{1,2}\d{6}(?:\([0-9A]\)|[0-9A]\b)/gi,
    tokenPrefix: "HKID",
    validator: (hkid) => validateHongKongHKID(hkid),
  },

  // Pakistan (PK) & Bangladesh (BD)
  {
    id: "RULE_PK_CNIC",
    type: "GOV_ID_CNIC",
    category: "asia_non_sea",
    pattern: /\b\d{5}-\d{7}-\d\b/g,
    tokenPrefix: "CNIC",
  },
  {
    id: "RULE_PK_NTN",
    type: "FIN_PK_NTN",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:NTN:?\s?)(\d{7}-[0-9A-Z])\b/gi,
    tokenPrefix: "PK_NTN",
  },
  {
    id: "RULE_BD_NID",
    type: "GOV_ID_NID",
    category: "asia_non_sea",
    pattern: /\b(?:\d{10}|\d{13}|\d{17})\b/g,
    tokenPrefix: "NID",
  },

  // Sri Lanka (LK) & Nepal (NP)
  {
    id: "RULE_LK_NIC",
    type: "GOV_ID_LK_NIC",
    category: "asia_non_sea",
    pattern: /\b(?:\d{9}[VX]|\d{12})\b/g,
    tokenPrefix: "LK_NIC",
  },
  {
    id: "RULE_NP_CITIZEN",
    type: "GOV_ID_NP_CITIZEN",
    category: "asia_non_sea",
    pattern: /\b\d{2}-\d{2}-\d{2}-\d{5}\b/g,
    tokenPrefix: "NP_CITIZEN",
  },

  // Middle East / West Asia (SA, AE, IL, TR, QA, KW, BH, OM)
  {
    id: "RULE_SA_NID",
    type: "GOV_ID_SA_NID",
    category: "asia_non_sea",
    pattern: /\b[12]\d{9}\b/g,
    tokenPrefix: "SA_NID",
    validator: (idStr) => validateSaudiNationalID(idStr),
  },
  {
    id: "RULE_SA_VAT",
    type: "FIN_SA_VAT",
    category: "asia_non_sea",
    pattern: /\b3\d{13}3\b/g,
    tokenPrefix: "SA_VAT",
  },
  {
    id: "RULE_AE_EMIRATES_ID",
    type: "GOV_ID_EMIRATES_ID",
    category: "asia_non_sea",
    pattern: /\b784-?\d{4}-?\d{7}-?\d\b/g,
    tokenPrefix: "EMIRATES_ID",
    validator: (eid) => validateUAEEmiratesID(eid),
  },
  {
    id: "RULE_IL_ID",
    type: "GOV_ID_IL_ID",
    category: "asia_non_sea",
    pattern: /\b\d{9}\b/g,
    tokenPrefix: "IL_ID",
    validator: (idStr) => validateIsraelID(idStr),
  },
  {
    id: "RULE_TR_TCKN",
    type: "GOV_ID_TR_TCKN",
    category: "asia_non_sea",
    pattern: /\b[1-9]\d{10}\b/g,
    tokenPrefix: "TR_TCKN",
    validator: (tckn) => validateTurkeyTCKN(tckn),
  },
  {
    id: "RULE_TR_VKN",
    type: "FIN_TR_VKN",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:VKN:?\s?)(\d{10})\b/gi,
    tokenPrefix: "TR_VKN",
  },
  {
    id: "RULE_QA_QID",
    type: "GOV_ID_QA_QID",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:QID:?\s?)([23]\d{10})\b/gi,
    tokenPrefix: "QA_QID",
  },
  {
    id: "RULE_KW_CIVIL_ID",
    type: "GOV_ID_KW_CIVIL_ID",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:Civil\s?ID:?\s?)([23]\d{11})\b/gi,
    tokenPrefix: "KW_CIVIL_ID",
  },
  {
    id: "RULE_BH_CPR",
    type: "GOV_ID_BH_CPR",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:CPR:?\s?)(\d{9})\b/gi,
    tokenPrefix: "BH_CPR",
  },
  {
    id: "RULE_OM_CIVIL_ID",
    type: "GOV_ID_OM_CIVIL_ID",
    category: "asia_non_sea",
    pattern: /(?:^|\s)(?:Civil\s?No\.?:?\s?)(\d{8})\b/gi,
    tokenPrefix: "OM_CIVIL_ID",
  },

  // Central Asia (KZ)
  {
    id: "RULE_KZ_IIN",
    type: "GOV_ID_KZ_IIN",
    category: "asia_non_sea",
    pattern: /\b\d{12}\b/g,
    tokenPrefix: "KZ_IIN",
    validator: (iin) => validateKazakhstanIIN(iin),
  },
];
