import { describe, it, expect } from "vitest";
import { tokenize, rehydrate } from "./engine";

describe("Tokenizer Engine - Phase 1 & Phase 2 Feature Suites", () => {
  it("should tokenize Emails, Phones, SSNs, and Invoices in Structural Mode", () => {
    const input =
      "Contact John Doe at john.doe@acme.corp or +1-555-555-0199 regarding invoice #INV-9021 with SSN 123-45-6789.";

    const result = tokenize(input, { categories: ["north_america"] });

    expect(result.mode).toBe("structural");
    expect(result.sanitizedText).toContain("EMAIL_1");
    expect(result.sanitizedText).toContain("PHONE_1");
    expect(result.sanitizedText).toContain("INVOICE_1");
    expect(result.sanitizedText).toContain("SSN_1");
    expect(result.sanitizedText).not.toContain("john.doe@acme.corp");
    expect(result.sanitizedText).not.toContain("+1-555-555-0199");

    expect(result.tokenMap["EMAIL_1"]).toBe("john.doe@acme.corp");
    expect(result.tokenMap["PHONE_1"]).toBe("+1-555-555-0199");
  });

  it("should support Format-Preserving Masking (FPE Mode) with syntax-valid mock replacements", () => {
    const input = "Contact Alice Wong at alice.wong@acme.corp regarding card 4532-0151-1283-0366.";

    const result = tokenize(input, { mode: "fpe" });

    expect(result.mode).toBe("fpe");
    expect(result.sanitizedText).toContain("Jordan Smith");
    expect(result.sanitizedText).toContain("user_a1@mockdomain.internal");
    expect(result.sanitizedText).toContain("4532-0151-9988-1007");
    expect(result.sanitizedText).not.toContain("Alice Wong");
    expect(result.sanitizedText).not.toContain("alice.wong@acme.corp");

    // Verify rehydration of FPE tokens back to original PII
    const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
    expect(rehydrated).toBe(input);
  });

  it("should preserve possessive suffixes ('s) cleanly outside entity tokens", () => {
    const input = "Review Customer Alice Wong's account and check john.doe@acme.corp's inbox.";

    const result = tokenize(input);

    expect(result.sanitizedText).toBe("Review Customer PERSON_1's account and check EMAIL_1's inbox.");

    const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
    expect(rehydrated).toBe(input);
  });

  it("should reuse synthetic tokens for duplicate PII in the same request", () => {
    const input =
      "Send email to john.doe@acme.corp. Confirm again to john.doe@acme.corp.";

    const result = tokenize(input);

    expect(result.sanitizedText).toBe(
      "Send email to EMAIL_1. Confirm again to EMAIL_1."
    );
    expect(result.count).toBe(1);
    expect(Object.keys(result.tokenMap).length).toBe(1);
  });

  it("should handle overlapping spans using the Span Disambiguation Pipeline (Longest-Match Rule)", () => {
    const input = "Processing payment via card 4532-0151-1283-0366 under ProjectAlpha.";
    const result = tokenize(input, ["ProjectAlpha"]);

    expect(result.sanitizedText).toContain("CARD_1");
    expect(result.sanitizedText).toContain("CUSTOM_1");
    expect(result.sanitizedText).not.toContain("4532-0151-1283-0366");
    expect(result.tokenMap["CARD_1"]).toBe("4532-0151-1283-0366");
    expect(result.tokenMap["CUSTOM_1"]).toBe("ProjectAlpha");
  });

  it("should safely rehydrate 10+ tokens without partial token collision (PERSON_10 vs PERSON_1)", () => {
    const tokenMap: Record<string, string> = {
      "PERSON_1": "Alice Smith",
      "PERSON_2": "Bob Jones",
      "PERSON_10": "Zoe Miller",
    };

    const modelResponse =
      "Report generated for PERSON_10, PERSON_2, and PERSON_1.";

    const output = rehydrate(modelResponse, tokenMap);

    expect(output).toBe(
      "Report generated for Zoe Miller, Bob Jones, and Alice Smith."
    );
  });

  it("should deterministically rehydrate model response (both unbracketed and bracketed)", () => {
    const tokenMap = {
      "PERSON_1": "John Doe",
      "EMAIL_1": "john.doe@acme.corp",
      "INVOICE_1": "#INV-9021",
    };

    const modelResponse =
      "The dispute for INVOICE_1 filed by PERSON_1 (<EMAIL_1>) has been recorded.";

    const output = rehydrate(modelResponse, tokenMap);

    expect(output).toBe(
      "The dispute for #INV-9021 filed by John Doe (john.doe@acme.corp) has been recorded."
    );
  });

  describe("Complex Enterprise Prompt Evaluation Suite", () => {
    it("should maintain Coreference & Suffix preservation across multiple entity mentions", () => {
      const input =
        "Contact Alice Wong submitted an expense report for Alice Wong's business travel. Please email Alice Wong at alice.wong@techcorp.io once Alice Wong's manager approves.";

      const result = tokenize(input);

      expect(result.sanitizedText).toContain("PERSON_1");
      expect(result.sanitizedText).toContain("PERSON_1's");
      expect(result.sanitizedText).toContain("EMAIL_1");
      expect(result.tokenMap["PERSON_1"]).toBe("Alice Wong");
      expect(result.tokenMap["EMAIL_1"]).toBe("alice.wong@techcorp.io");

      const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
      expect(rehydrated).toBe(input);
    });

    it("should reject false positives and plain math/numbers", () => {
      const input =
        "Order #45320159 was created on 2026-08-15 for 4 items totaling $1,234.56. The server latency is 123.456 ms with an error rate of 0.001%.";

      const result = tokenize(input);

      expect(result.count).toBe(0);
      expect(result.sanitizedText).toBe(input);
    });

    it("should de-identify SQL queries while preserving SQL syntax and quotes", () => {
      const input =
        "SELECT * FROM users WHERE ssn = '123-45-6789' AND email = 'david.chen@enterprise.com' AND status = 'ACTIVE';";

      const result = tokenize(input, { categories: ["north_america"] });

      expect(result.sanitizedText).toBe(
        "SELECT * FROM users WHERE ssn = 'SSN_1' AND email = 'EMAIL_1' AND status = 'ACTIVE';"
      );
      expect(result.tokenMap["SSN_1"]).toBe("123-45-6789");
      expect(result.tokenMap["EMAIL_1"]).toBe("david.chen@enterprise.com");

      const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
      expect(rehydrated).toBe(input);
    });

    it("should de-identify PHI data including names and medical record tags", () => {
      const input =
        "Patient Priya Sharma, DOB: 14/05/1992, MRN: MRN-8849201, presented with severe hypertension.";

      const result = tokenize(input);

      expect(result.sanitizedText).toContain("PERSON_1");
      expect(result.sanitizedText).toContain("INVOICE_1");
      expect(result.tokenMap["PERSON_1"]).toBe("Priya Sharma");
      expect(result.tokenMap["INVOICE_1"]).toBe("MRN-8849201");

      const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
      expect(rehydrated).toBe(input);
    });

    it("should de-identify Unicode accented names and CJK characters", () => {
      const input =
        "Bonjour, veuillez envoyer les documents de Contact François Müller à francois.muller@banque.fr et contacter Contact 李小龙 au +1-555-019-2831.";

      const result = tokenize(input);

      expect(result.sanitizedText).toContain("PERSON_1");
      expect(result.sanitizedText).toContain("PERSON_2");
      expect(result.sanitizedText).toContain("EMAIL_1");
      expect(result.sanitizedText).toContain("PHONE_1");

      expect(result.tokenMap["PERSON_1"]).toBe("François Müller");
      expect(result.tokenMap["PERSON_2"]).toBe("李小龙");
      expect(result.tokenMap["EMAIL_1"]).toBe("francois.muller@banque.fr");

      const rehydrated = rehydrate(result.sanitizedText, result.tokenMap);
      expect(rehydrated).toBe(input);
    });
  });

  describe("Regional Category Packs & Scope Filtering", () => {
    it("should detect India Aadhaar and PAN only when 'asia_non_sea' is requested", () => {
      const input = "Transfer funds to PAN ABCPK1234F and Aadhaar 2345 6789 0124.";

      // With default 'global' category only -> Not detected
      const globalOnly = tokenize(input);
      expect(globalOnly.sanitizedText).toBe(input);

      // With canonical 'asia_non_sea' requested -> Detected
      const canonicalResult = tokenize(input, { categories: ["asia_non_sea"] });
      expect(canonicalResult.sanitizedText).toContain("PAN_1");
      expect(canonicalResult.sanitizedText).toContain("AADHAAR_1");
      expect(canonicalResult.categoriesApplied).toContain("asia_non_sea");
    });

    it("should detect Singapore NRIC only when 'south_east_asia' is requested", () => {
      const input = "Resident NRIC S1234567H registered.";

      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).toBe(input);

      const withSea = tokenize(input, { categories: ["south_east_asia"] });
      expect(withSea.sanitizedText).toContain("NRIC_1");
      expect(withSea.categoriesApplied).toContain("south_east_asia");
    });

    it("should detect ASEAN identifiers across Singapore, Malaysia, Indonesia, Thailand, Vietnam, and the Philippines when 'south_east_asia' is requested", () => {
      const input = [
        "Singapore NRIC: S1234567H and UEN 201401234A.",
        "Malaysia MyKad: 900101-14-1234.",
        "Indonesia NIK: 3171010101900001.",
        "Thailand ID: 1100100123454.",
        "Vietnam CCCD: 001099012345.",
        "Philippines PCN: 1234-5678-9012-3456.",
      ].join(" ");

      // Without 'south_east_asia' -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("NRIC_1");
      expect(withoutCat.sanitizedText).not.toContain("UEN_1");
      expect(withoutCat.sanitizedText).not.toContain("MYKAD_1");
      expect(withoutCat.sanitizedText).not.toContain("ID_NIK_1");
      expect(withoutCat.sanitizedText).not.toContain("TH_NID_1");
      expect(withoutCat.sanitizedText).not.toContain("VN_CCCD_1");
      expect(withoutCat.sanitizedText).not.toContain("PH_PCN_1");

      // With 'south_east_asia' -> detected
      const withCat = tokenize(input, { categories: ["south_east_asia"] });
      expect(withCat.sanitizedText).toContain("NRIC_1");
      expect(withCat.sanitizedText).toContain("UEN_1");
      expect(withCat.sanitizedText).toContain("MYKAD_1");
      expect(withCat.sanitizedText).toContain("ID_NIK_1");
      expect(withCat.sanitizedText).toContain("TH_NID_1");
      expect(withCat.sanitizedText).toContain("VN_CCCD_1");
      expect(withCat.sanitizedText).toContain("PH_PCN_1");

      expect(withCat.tokenMap["NRIC_1"]).toBe("S1234567H");
      expect(withCat.tokenMap["UEN_1"]).toBe("201401234A");
      expect(withCat.tokenMap["MYKAD_1"]).toBe("900101-14-1234");
      expect(withCat.tokenMap["ID_NIK_1"]).toBe("3171010101900001");
      expect(withCat.tokenMap["TH_NID_1"]).toBe("1100100123454");
      expect(withCat.tokenMap["VN_CCCD_1"]).toBe("001099012345");
      expect(withCat.tokenMap["PH_PCN_1"]).toBe("1234-5678-9012-3456");
    });

    it("should detect North American identifiers across US, Canada, Mexico, Dominican Republic, Costa Rica, and Guatemala when 'north_america' is requested", () => {
      const input = [
        "US Routing: 122105155 and MBI 1EG4-TE5-MK72.",
        "Canada OHIP: 1234-567-897 and Passport AB123456.",
        "Mexico CURP: HEGM951015HDFRRL00 and RFC HEGM951015AB1.",
        "Mexico NSS: 12345678903.",
        "Dominican Cedula: 402-1234567-8.",
        "Costa Rica Cedula: 1-1234-5678.",
        "Guatemala CUI: 1234 56789 0101.",
      ].join(" ");

      // Without 'north_america' -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("US_ABA_ROUTING_1");
      expect(withoutCat.sanitizedText).not.toContain("US_MBI_1");
      expect(withoutCat.sanitizedText).not.toContain("CA_HEALTH_1");
      expect(withoutCat.sanitizedText).not.toContain("MX_CURP_1");
      expect(withoutCat.sanitizedText).not.toContain("MX_RFC_1");
      expect(withoutCat.sanitizedText).not.toContain("MX_NSS_1");
      expect(withoutCat.sanitizedText).not.toContain("DO_CEDULA_1");
      expect(withoutCat.sanitizedText).not.toContain("CR_CEDULA_1");
      expect(withoutCat.sanitizedText).not.toContain("GT_CUI_1");

      // With 'north_america' -> detected
      const withCat = tokenize(input, { categories: ["north_america"] });
      expect(withCat.sanitizedText).toContain("US_ABA_ROUTING_1");
      expect(withCat.sanitizedText).toContain("US_MBI_1");
      expect(withCat.sanitizedText).toContain("CA_HEALTH_1");
      expect(withCat.sanitizedText).toContain("MX_CURP_1");
      expect(withCat.sanitizedText).toContain("MX_RFC_1");
      expect(withCat.sanitizedText).toContain("MX_NSS_1");
      expect(withCat.sanitizedText).toContain("DO_CEDULA_1");
      expect(withCat.sanitizedText).toContain("CR_CEDULA_1");
      expect(withCat.sanitizedText).toContain("GT_CUI_1");

      expect(withCat.tokenMap["US_ABA_ROUTING_1"]).toBe("122105155");
      expect(withCat.tokenMap["US_MBI_1"]).toBe("1EG4-TE5-MK72");
      expect(withCat.tokenMap["CA_HEALTH_1"]).toBe("1234-567-897");
      expect(withCat.tokenMap["MX_CURP_1"]).toBe("HEGM951015HDFRRL00");
      expect(withCat.tokenMap["MX_RFC_1"]).toBe("HEGM951015AB1");
      expect(withCat.tokenMap["MX_NSS_1"]).toBe("12345678903");
      expect(withCat.tokenMap["DO_CEDULA_1"]).toBe("402-1234567-8");
      expect(withCat.tokenMap["CR_CEDULA_1"]).toBe("1-1234-5678");
      expect(withCat.tokenMap["GT_CUI_1"]).toBe("1234 56789 0101");
    });

    it("should detect South American identifiers across Brazil, Argentina, Chile, Colombia, Peru, Ecuador, and Uruguay when 'south_america' is requested", () => {
      const input = [
        "Brazil CPF: 111.444.777-35 and CNPJ 11.222.333/0001-81.",
        "Argentina CUIT: 20-12345678-6.",
        "Chile RUT: 12345678-5.",
        "Colombia NIT: 900123456-8.",
        "Peru RUC: 20123456786.",
        "Ecuador Cedula: 1710034065.",
        "Uruguay CI: 1.234.567-2.",
      ].join(" ");

      // Without 'south_america' -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("CPF_1");
      expect(withoutCat.sanitizedText).not.toContain("CNPJ_1");
      expect(withoutCat.sanitizedText).not.toContain("AR_CUIT_1");
      expect(withoutCat.sanitizedText).not.toContain("CL_RUT_1");
      expect(withoutCat.sanitizedText).not.toContain("CO_NIT_1");
      expect(withoutCat.sanitizedText).not.toContain("PE_RUC_1");
      expect(withoutCat.sanitizedText).not.toContain("EC_CEDULA_1");
      expect(withoutCat.sanitizedText).not.toContain("UY_CI_1");

      // With 'south_america' -> detected
      const withCat = tokenize(input, { categories: ["south_america"] });
      expect(withCat.sanitizedText).toContain("CPF_1");
      expect(withCat.sanitizedText).toContain("CNPJ_1");
      expect(withCat.sanitizedText).toContain("AR_CUIT_1");
      expect(withCat.sanitizedText).toContain("CL_RUT_1");
      expect(withCat.sanitizedText).toContain("CO_NIT_1");
      expect(withCat.sanitizedText).toContain("PE_RUC_1");
      expect(withCat.sanitizedText).toContain("EC_CEDULA_1");
      expect(withCat.sanitizedText).toContain("UY_CI_1");

      expect(withCat.tokenMap["CPF_1"]).toBe("111.444.777-35");
      expect(withCat.tokenMap["CNPJ_1"]).toBe("11.222.333/0001-81");
      expect(withCat.tokenMap["AR_CUIT_1"]).toBe("20-12345678-6");
      expect(withCat.tokenMap["CL_RUT_1"]).toBe("12345678-5");
      expect(withCat.tokenMap["CO_NIT_1"]).toBe("900123456-8");
      expect(withCat.tokenMap["PE_RUC_1"]).toBe("20123456786");
      expect(withCat.tokenMap["EC_CEDULA_1"]).toBe("1710034065");
      expect(withCat.tokenMap["UY_CI_1"]).toBe("1.234.567-2");
    });

    it("should detect UK NHS only when 'europe_non_eu' is requested", () => {
      const input = "NHS Patient record: 943 476 5919.";

      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("NHS_1");

      const withNonEu = tokenize(input, { categories: ["europe_non_eu"] });
      expect(withNonEu.sanitizedText).toContain("NHS_1");
      expect(withNonEu.categoriesApplied).toContain("europe_non_eu");
    });

    it("should detect non-EU European identifiers across UK, Switzerland, Norway, Iceland, Ukraine, and Western Balkans when 'europe_non_eu' is requested", () => {
      const input = [
        "UK NINO JH123456C and CRN 12345678.",
        "Swiss AHV: 756.1234.5678.97 and UID CHE-123.456.788.",
        "Norway FNR: 01019010046.",
        "Iceland Kennitala: 010190-1189.",
        "Ukraine IPN: 1234567899 and UNZR 19900101-12345.",
        "Balkan JMBG: 0101990710008.",
        "Albania NID: A12345678B.",
      ].join(" ");

      // Without 'europe_non_eu' -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("NINO_1");
      expect(withoutCat.sanitizedText).not.toContain("UK_CRN_1");
      expect(withoutCat.sanitizedText).not.toContain("CH_AHV_1");
      expect(withoutCat.sanitizedText).not.toContain("CH_UID_1");
      expect(withoutCat.sanitizedText).not.toContain("NO_FODSEL_1");
      expect(withoutCat.sanitizedText).not.toContain("IS_KENNITALA_1");
      expect(withoutCat.sanitizedText).not.toContain("UA_IPN_1");
      expect(withoutCat.sanitizedText).not.toContain("UA_UNZR_1");
      expect(withoutCat.sanitizedText).not.toContain("BALKAN_JMBG_1");
      expect(withoutCat.sanitizedText).not.toContain("AL_NID_1");

      // With 'europe_non_eu' -> detected
      const withCat = tokenize(input, { categories: ["europe_non_eu"] });
      expect(withCat.sanitizedText).toContain("NINO_1");
      expect(withCat.sanitizedText).toContain("UK_CRN_1");
      expect(withCat.sanitizedText).toContain("CH_AHV_1");
      expect(withCat.sanitizedText).toContain("CH_UID_1");
      expect(withCat.sanitizedText).toContain("NO_FODSEL_1");
      expect(withCat.sanitizedText).toContain("IS_KENNITALA_1");
      expect(withCat.sanitizedText).toContain("UA_IPN_1");
      expect(withCat.sanitizedText).toContain("UA_UNZR_1");
      expect(withCat.sanitizedText).toContain("BALKAN_JMBG_1");
      expect(withCat.sanitizedText).toContain("AL_NID_1");

      expect(withCat.tokenMap["NINO_1"]).toBe("JH123456C");
      expect(withCat.tokenMap["UK_CRN_1"]).toBe("12345678");
      expect(withCat.tokenMap["CH_AHV_1"]).toBe("756.1234.5678.97");
      expect(withCat.tokenMap["CH_UID_1"]).toBe("CHE-123.456.788");
      expect(withCat.tokenMap["NO_FODSEL_1"]).toBe("01019010046");
      expect(withCat.tokenMap["IS_KENNITALA_1"]).toBe("010190-1189");
      expect(withCat.tokenMap["UA_IPN_1"]).toBe("1234567899");
      expect(withCat.tokenMap["UA_UNZR_1"]).toBe("19900101-12345");
      expect(withCat.tokenMap["BALKAN_JMBG_1"]).toBe("0101990710008");
      expect(withCat.tokenMap["AL_NID_1"]).toBe("A12345678B");
    });

    it("should detect South Africa ID only when 'africa' is requested", () => {
      const input = "South African citizen ID 8001015009087 verified.";

      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).toBe(input);

      const withAfrica = tokenize(input, { categories: ["africa"] });
      expect(withAfrica.sanitizedText).toContain("ZA_ID_1");
      expect(withAfrica.categoriesApplied).toContain("africa");
    });

    it("should detect pan-African identifiers across Egypt, Ghana, Uganda, Tanzania, Rwanda, Zambia, Zimbabwe, and Angola when 'africa' is requested", () => {
      const input = [
        "Egypt Citizen: 29001010101234.",
        "Ghana Card: GHA-123456789-1 and TIN P123456789A.",
        "Uganda NIN: CM90010123AB45.",
        "Tanzania NIDA: 19900101-12345-67890-12.",
        "Rwanda National ID: 1199080012345678.",
        "Zambia NRC: 123456/78/1.",
        "Zimbabwe ID: 63-1234567-A-63.",
        "Angola BI: 123456789LA123.",
      ].join(" ");

      // Without 'africa' category -> not detected as African IDs
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("EG_NID_1");
      expect(withoutCat.sanitizedText).not.toContain("GH_CARD_1");
      expect(withoutCat.sanitizedText).not.toContain("UG_NIN_1");
      expect(withoutCat.sanitizedText).not.toContain("TZ_NIDA_1");
      expect(withoutCat.sanitizedText).not.toContain("RW_NID_1");
      expect(withoutCat.sanitizedText).not.toContain("ZM_NRC_1");
      expect(withoutCat.sanitizedText).not.toContain("ZW_ID_1");
      expect(withoutCat.sanitizedText).not.toContain("AO_BI_1");

      // With 'africa' category -> successfully detected and tokenized
      const withCat = tokenize(input, { categories: ["africa"] });
      expect(withCat.sanitizedText).toContain("EG_NID_1");
      expect(withCat.sanitizedText).toContain("GH_CARD_1");
      expect(withCat.sanitizedText).toContain("GH_TIN_1");
      expect(withCat.sanitizedText).toContain("UG_NIN_1");
      expect(withCat.sanitizedText).toContain("TZ_NIDA_1");
      expect(withCat.sanitizedText).toContain("RW_NID_1");
      expect(withCat.sanitizedText).toContain("ZM_NRC_1");
      expect(withCat.sanitizedText).toContain("ZW_ID_1");
      expect(withCat.sanitizedText).toContain("AO_BI_1");

      expect(withCat.tokenMap["EG_NID_1"]).toBe("29001010101234");
      expect(withCat.tokenMap["GH_CARD_1"]).toBe("GHA-123456789-1");
      expect(withCat.tokenMap["UG_NIN_1"]).toBe("CM90010123AB45");
      expect(withCat.tokenMap["TZ_NIDA_1"]).toBe("19900101-12345-67890-12");
      expect(withCat.tokenMap["RW_NID_1"]).toBe("1199080012345678");
      expect(withCat.tokenMap["ZM_NRC_1"]).toBe("123456/78/1");
      expect(withCat.tokenMap["ZW_ID_1"]).toBe("63-1234567-A-63");
      expect(withCat.tokenMap["AO_BI_1"]).toBe("123456789LA123");
    });

    it("should detect EU-27 member state identifiers across Poland, Netherlands, Belgium, Sweden, Portugal, Ireland, Romania, and Finland when 'european_union' is requested", () => {
      const input = [
        "Poland PESEL: 02070803628.",
        "Netherlands BSN: 111222333.",
        "Belgium RRN: 85.01.01-123.87.",
        "Sweden PIN: 811218-9876.",
        "Portugal NIF: 123456789.",
        "Ireland PPSN: 1234567T.",
        "Romania CNP: 1900101011232.",
        "Finland HETU: 010101-123N.",
      ].join(" ");

      // Without 'european_union' category -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("PL_PESEL_1");
      expect(withoutCat.sanitizedText).not.toContain("NL_BSN_1");
      expect(withoutCat.sanitizedText).not.toContain("BE_RRN_1");
      expect(withoutCat.sanitizedText).not.toContain("SE_PIN_1");
      expect(withoutCat.sanitizedText).not.toContain("PT_NIF_1");
      expect(withoutCat.sanitizedText).not.toContain("IE_PPSN_1");
      expect(withoutCat.sanitizedText).not.toContain("RO_CNP_1");
      expect(withoutCat.sanitizedText).not.toContain("FI_HETU_1");

      // With 'european_union' category -> detected
      const withCat = tokenize(input, { categories: ["european_union"] });
      expect(withCat.sanitizedText).toContain("PL_PESEL_1");
      expect(withCat.sanitizedText).toContain("NL_BSN_1");
      expect(withCat.sanitizedText).toContain("BE_RRN_1");
      expect(withCat.sanitizedText).toContain("SE_PIN_1");
      expect(withCat.sanitizedText).toContain("PT_NIF_1");
      expect(withCat.sanitizedText).toContain("IE_PPSN_1");
      expect(withCat.sanitizedText).toContain("RO_CNP_1");
      expect(withCat.sanitizedText).toContain("FI_HETU_1");

      expect(withCat.tokenMap["PL_PESEL_1"]).toBe("02070803628");
      expect(withCat.tokenMap["NL_BSN_1"]).toBe("111222333");
      expect(withCat.tokenMap["BE_RRN_1"]).toBe("85.01.01-123.87");
      expect(withCat.tokenMap["SE_PIN_1"]).toBe("811218-9876");
      expect(withCat.tokenMap["PT_NIF_1"]).toBe("123456789");
      expect(withCat.tokenMap["IE_PPSN_1"]).toBe("1234567T");
      expect(withCat.tokenMap["RO_CNP_1"]).toBe("1900101011232");
      expect(withCat.tokenMap["FI_HETU_1"]).toBe("010101-123N");
    });

    it("should detect pan-Asian identifiers across Japan, South Korea, Taiwan, Hong Kong, Saudi Arabia, Israel, Turkey, and Kazakhstan when 'asia_non_sea' is requested", () => {
      const input = [
        "Japan My Number: 123456789018.",
        "Korea RRN: 900101-1234568.",
        "Taiwan ID: A123456789.",
        "Hong Kong HKID: B111111(7).",
        "Saudi National ID: 1234567897.",
        "Israel ID: 123456782.",
        "Turkey TCKN: 10000000146.",
        "Kazakhstan IIN: 900101123102.",
      ].join(" ");

      // Without 'asia_non_sea' category -> not detected
      const withoutCat = tokenize(input);
      expect(withoutCat.sanitizedText).not.toContain("JP_MYNUMBER_1");
      expect(withoutCat.sanitizedText).not.toContain("KR_RRN_1");
      expect(withoutCat.sanitizedText).not.toContain("TW_ID_1");
      expect(withoutCat.sanitizedText).not.toContain("HKID_1");
      expect(withoutCat.sanitizedText).not.toContain("SA_NID_1");
      expect(withoutCat.sanitizedText).not.toContain("IL_ID_1");
      expect(withoutCat.sanitizedText).not.toContain("TR_TCKN_1");
      expect(withoutCat.sanitizedText).not.toContain("KZ_IIN_1");

      // With 'asia_non_sea' category -> detected
      const withCat = tokenize(input, { categories: ["asia_non_sea"] });
      expect(withCat.sanitizedText).toContain("JP_MYNUMBER_1");
      expect(withCat.sanitizedText).toContain("KR_RRN_1");
      expect(withCat.sanitizedText).toContain("TW_ID_1");
      expect(withCat.sanitizedText).toContain("HKID_1");
      expect(withCat.sanitizedText).toContain("SA_NID_1");
      expect(withCat.sanitizedText).toContain("IL_ID_1");
      expect(withCat.sanitizedText).toContain("TR_TCKN_1");
      expect(withCat.sanitizedText).toContain("KZ_IIN_1");

      expect(withCat.tokenMap["JP_MYNUMBER_1"]).toBe("123456789018");
      expect(withCat.tokenMap["KR_RRN_1"]).toBe("900101-1234568");
      expect(withCat.tokenMap["TW_ID_1"]).toBe("A123456789");
      expect(withCat.tokenMap["HKID_1"]).toBe("B111111(7)");
      expect(withCat.tokenMap["SA_NID_1"]).toBe("1234567897");
      expect(withCat.tokenMap["IL_ID_1"]).toBe("123456782");
      expect(withCat.tokenMap["TR_TCKN_1"]).toBe("10000000146");
      expect(withCat.tokenMap["KZ_IIN_1"]).toBe("900101123102");
    });

    it("should reject individual country codes that are not Canonical Pack IDs", () => {
      expect(() => {
        tokenize("Test text", { categories: ["in"] });
      }).toThrow(/The API only accepts Canonical Pack IDs/);

      expect(() => {
        tokenize("Test text", { categories: ["us"] });
      }).toThrow(/The API only accepts Canonical Pack IDs/);
    });

    it("should throw error when exceeding maximum of 2 Canonical Pack IDs", () => {
      const overLimitCategories = [
        "north_america",
        "south_east_asia",
        "european_union",
      ];

      expect(() => {
        tokenize("Test text", { categories: overLimitCategories });
      }).toThrow(/Maximum of 2 Canonical Pack IDs allowed/);
    });
  });
});
