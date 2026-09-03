import { Rule } from "./types";
import {
  validateAustraliaTFN,
  validateAustraliaMedicare,
  validateAustraliaABN,
} from "../validators/oceania";

export const OCEANIA_RULES: Rule[] = [
  {
    id: "RULE_AU_TFN",
    type: "FIN_TFN",
    category: "oceania",
    pattern: /\b\d{3}\s?\d{3}\s?\d{2,3}\b/g,
    tokenPrefix: "TFN",
    validator: (tfn) => validateAustraliaTFN(tfn),
  },
  {
    id: "RULE_AU_MEDICARE",
    type: "HLTH_MEDICARE",
    category: "oceania",
    pattern: /\b[2-6]\d{3}\s?\d{5}\s?\d\b/g,
    tokenPrefix: "MEDICARE",
    validator: (med) => validateAustraliaMedicare(med),
  },
  {
    id: "RULE_AU_ABN",
    type: "FIN_ABN",
    category: "oceania",
    pattern: /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g,
    tokenPrefix: "ABN",
    validator: (abn) => validateAustraliaABN(abn),
  },
];
