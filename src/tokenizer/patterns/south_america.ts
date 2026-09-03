import { Rule } from "./types";
import {
  validateBrazilCPF,
  validateBrazilCNPJ,
  validateArgentinaCUIT,
  validateChileRUT,
  validateColombiaNIT,
  validatePeruRUC,
  validateEcuadorCedula,
  validateUruguayCI,
} from "../validators/south_america";

export const SOUTH_AMERICA_RULES: Rule[] = [
  // Brazil (BR)
  {
    id: "RULE_BR_CPF",
    type: "GOV_ID_CPF",
    category: "south_america",
    pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    tokenPrefix: "CPF",
    validator: (cpf) => validateBrazilCPF(cpf),
  },
  {
    id: "RULE_BR_CNPJ",
    type: "FIN_CNPJ",
    category: "south_america",
    pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    tokenPrefix: "CNPJ",
    validator: (cnpj) => validateBrazilCNPJ(cnpj),
  },
  {
    id: "RULE_BR_RG",
    type: "GOV_ID_BR_RG",
    category: "south_america",
    pattern: /(?:^|\s)(?:RG:?\s?)(\d{2}\.\d{3}\.\d{3}-[\dX])\b/gi,
    tokenPrefix: "BR_RG",
  },

  // Argentina (AR)
  {
    id: "RULE_AR_CUIT",
    type: "FIN_AR_CUIT",
    category: "south_america",
    pattern: /\b(?:20|23|24|27|30|33|34)-\d{8}-\d\b/g,
    tokenPrefix: "AR_CUIT",
    validator: (cuit) => validateArgentinaCUIT(cuit),
  },
  {
    id: "RULE_AR_DNI",
    type: "GOV_ID_AR_DNI",
    category: "south_america",
    pattern: /(?:^|\s)(?:DNI:?\s?)(\d{7,8}|\d{1,2}\.\d{3}\.\d{3})\b/gi,
    tokenPrefix: "AR_DNI",
  },

  // Chile (CL)
  {
    id: "RULE_CL_RUT",
    type: "GOV_ID_CL_RUT",
    category: "south_america",
    pattern: /\b(?:\d{1,2}\.\d{3}\.\d{3}|\d{7,8})-[\dK]\b/g,
    tokenPrefix: "CL_RUT",
    validator: (rut) => validateChileRUT(rut),
  },

  // Colombia (CO)
  {
    id: "RULE_CO_NIT",
    type: "FIN_CO_NIT",
    category: "south_america",
    pattern: /\b\d{9}-\d\b/g,
    tokenPrefix: "CO_NIT",
    validator: (nit) => validateColombiaNIT(nit),
  },
  {
    id: "RULE_CO_CC",
    type: "GOV_ID_CO_CC",
    category: "south_america",
    pattern: /(?:^|\s)(?:CC|Cédula):?\s?(\d{6,10})\b/gi,
    tokenPrefix: "CO_CC",
  },

  // Peru (PE)
  {
    id: "RULE_PE_RUC",
    type: "FIN_PE_RUC",
    category: "south_america",
    pattern: /\b(?:10|15|17|20)\d{9}\b/g,
    tokenPrefix: "PE_RUC",
    validator: (ruc) => validatePeruRUC(ruc),
  },
  {
    id: "RULE_PE_DNI",
    type: "GOV_ID_PE_DNI",
    category: "south_america",
    pattern: /(?:^|\s)(?:DNI:?\s?)(\d{8})\b/gi,
    tokenPrefix: "PE_DNI",
  },

  // Venezuela (VE)
  {
    id: "RULE_VE_RIF",
    type: "FIN_VE_RIF",
    category: "south_america",
    pattern: /\b[JVEGP]-?\d{8}-?\d\b/g,
    tokenPrefix: "VE_RIF",
  },
  {
    id: "RULE_VE_CI",
    type: "GOV_ID_VE_CI",
    category: "south_america",
    pattern: /\b[VE]-?\d{7,8}\b/g,
    tokenPrefix: "VE_CI",
  },

  // Ecuador (EC)
  {
    id: "RULE_EC_CEDULA",
    type: "GOV_ID_EC_CEDULA",
    category: "south_america",
    pattern: /\b\d{10}\b/g,
    tokenPrefix: "EC_CEDULA",
    validator: (cedula) => validateEcuadorCedula(cedula),
  },
  {
    id: "RULE_EC_RUC",
    type: "FIN_EC_RUC",
    category: "south_america",
    pattern: /\b\d{10}001\b/g,
    tokenPrefix: "EC_RUC",
  },

  // Uruguay (UY)
  {
    id: "RULE_UY_CI",
    type: "GOV_ID_UY_CI",
    category: "south_america",
    pattern: /\b(?:\d\.\d{3}\.\d{3}-\d|\d{6,7}-?\d)\b/g,
    tokenPrefix: "UY_CI",
    validator: (ci) => validateUruguayCI(ci),
  },
  {
    id: "RULE_UY_RUT",
    type: "FIN_UY_RUT",
    category: "south_america",
    pattern: /\b21\d{10}\b/g,
    tokenPrefix: "UY_RUT",
  },

  // Paraguay (PY)
  {
    id: "RULE_PY_RUC",
    type: "FIN_PY_RUC",
    category: "south_america",
    pattern: /(?:^|\s)(?:RUC:?\s?)(\d{5,8}-\d)\b/gi,
    tokenPrefix: "PY_RUC",
  },
  {
    id: "RULE_PY_CI",
    type: "GOV_ID_PY_CI",
    category: "south_america",
    pattern: /(?:^|\s)(?:CI:?\s?)(\d{6,7})\b/gi,
    tokenPrefix: "PY_CI",
  },

  // Bolivia (BO)
  {
    id: "RULE_BO_CI",
    type: "GOV_ID_BO_CI",
    category: "south_america",
    pattern: /(?:^|\s)(?:CI:?\s?)(\d{6,8})\b/gi,
    tokenPrefix: "BO_CI",
  },
  {
    id: "RULE_BO_NIT",
    type: "FIN_BO_NIT",
    category: "south_america",
    pattern: /(?:^|\s)(?:NIT:?\s?)(\d{7,10})\b/gi,
    tokenPrefix: "BO_NIT",
  },

  // Guyana (GY)
  {
    id: "RULE_GY_TIN",
    type: "FIN_GY_TIN",
    category: "south_america",
    pattern: /(?:^|\s)(?:TIN:?\s?)(\d{9})\b/gi,
    tokenPrefix: "GY_TIN",
  },

  // Suriname (SR)
  {
    id: "RULE_SR_ID",
    type: "GOV_ID_SR_ID",
    category: "south_america",
    pattern: /\b[A-Z]{2}\d{5,6}\b/g,
    tokenPrefix: "SR_ID",
  },
];
