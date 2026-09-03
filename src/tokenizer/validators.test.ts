import { describe, it, expect } from "vitest";
import {
  passesLuhnChecksum,
  validateSingaporeNRIC,
  validateIBAN,
  validateUSSSN,
  validateAadhaar,
  validatePan,
  validateGstin,
  validateUKNHS,
  validateAustraliaTFN,
  validateAustraliaABN,
  validateAustraliaMedicare,
  validateBrazilCPF,
  validateBrazilCNPJ,
  validateSpainDNI,
  validateItalyCodiceFiscale,
  validateChinaResidentID,
  validateUSDEA,
  validateCanadaSIN,
  validateSouthAfricaID,
  validateUAEEmiratesID,
  validateEgyptNationalID,
  validateRwandaNationalID,
  validatePolandPESEL,
  validatePolandNIP,
  validateNetherlandsBSN,
  validateBelgiumRRN,
  validateSwedenPIN,
  validatePortugalNIF,
  validateIrelandPPSN,
  validateRomaniaCNP,
  validateHungaryTIN,
  validateDenmarkCPR,
  validateFinlandHETU,
  validateBulgariaEGN,
  validateCroatiaOIB,
  validateCzechBirthNumber,
  validateJapanMyNumber,
  validateSouthKoreaRRN,
  validateSouthKoreaBRN,
  validateTaiwanID,
  validateHongKongHKID,
  validateSaudiNationalID,
  validateIsraelID,
  validateTurkeyTCKN,
  validateKazakhstanIIN,
  validateThailandNationalID,
  validateIndonesiaNIK,
  validateVietnamCCCD,
  validateUSABARouting,
  validateMexicoCURP,
  validateMexicoRFC,
  validateMexicoNSS,
  validateDominicanCedula,
  validateOntarioOHIP,
  validateSwissAHV,
  validateSwissUID,
  validateNorwayFodselsnummer,
  validateIcelandKennitala,
  validateUkraineIPN,
  validateBalkanJMBG,
  validateArgentinaCUIT,
  validateChileRUT,
  validateColombiaNIT,
  validatePeruRUC,
  validateEcuadorCedula,
  validateUruguayCI,
} from "./validators";
import { tokenize } from "./engine";

describe("Enterprise Validators & 4-Tier Ruleset", () => {
  describe("Luhn Checksum Validator (Tier 2)", () => {
    it("should validate valid credit card numbers", () => {
      expect(passesLuhnChecksum("4532015112830366")).toBe(true);
      expect(passesLuhnChecksum("4532-0151-1283-0366")).toBe(true);
    });

    it("should reject invalid random 16-digit numbers", () => {
      expect(passesLuhnChecksum("1234567890123456")).toBe(false);
      expect(passesLuhnChecksum("9999999999999999")).toBe(false);
    });
  });

  describe("Singapore NRIC/FIN Validator (Tier 2)", () => {
    it("should validate valid Singapore NRIC numbers", () => {
      expect(validateSingaporeNRIC("S1234567H")).toBe(true);
      expect(validateSingaporeNRIC("S0000001C")).toBe(true);
    });

    it("should reject invalid NRIC strings", () => {
      expect(validateSingaporeNRIC("S1234567Z")).toBe(false);
      expect(validateSingaporeNRIC("INVALID_NRIC")).toBe(false);
    });
  });

  describe("ISO 7064 MOD-97 IBAN Validator (Tier 2)", () => {
    it("should validate valid IBAN numbers", () => {
      expect(validateIBAN("GB82 WEST 1234 5698 7654 32")).toBe(true);
      expect(validateIBAN("DE89 3704 0044 0532 0130 00")).toBe(true);
    });

    it("should reject invalid IBAN numbers", () => {
      expect(validateIBAN("GB00 WEST 1234 5698 7654 32")).toBe(false);
    });
  });

  describe("US SSN Validator (Tier 2)", () => {
    it("should validate valid SSNs and reject invalid exclusions", () => {
      expect(validateUSSSN("123-45-6789")).toBe(true);
      expect(validateUSSSN("000-45-6789")).toBe(false);
      expect(validateUSSSN("666-45-6789")).toBe(false);
      expect(validateUSSSN("912-45-6789")).toBe(false);
    });
  });

  describe("Indian Identifiers: Aadhaar Verhoeff, PAN, GSTIN", () => {
    it("should validate Aadhaar numbers via Verhoeff algorithm", () => {
      // Valid Aadhaar numbers matching Verhoeff check digit (check digit 4)
      expect(validateAadhaar("2345 6789 0124")).toBe(true);
      // Corrupted check digit
      expect(validateAadhaar("2345 6789 0129")).toBe(false);
      // Starting with 0 or 1 is invalid
      expect(validateAadhaar("0345 6789 0120")).toBe(false);
      expect(validateAadhaar("1345 6789 0120")).toBe(false);
    });

    it("should validate PAN structure and entity codes", () => {
      expect(validatePan("ABCDE1234F")).toBe(false); // E is not valid entity code
      expect(validatePan("ABCPK1234F")).toBe(true);  // P = Individual
      expect(validatePan("ABCCK1234F")).toBe(true);  // C = Company
      expect(validatePan("12345ABCDE")).toBe(false);
    });

    it("should validate GSTIN format and state codes", () => {
      expect(validateGstin("27AAPFU0939F1ZV")).toBe(true); // 27 = Maharashtra
      expect(validateGstin("99AAPFU0939F1ZV")).toBe(true); // 99 = Centre jurisdiction
      expect(validateGstin("00AAPFU0939F1ZV")).toBe(false); // 00 is invalid state
    });
  });

  describe("UK NHS & Canadian SIN", () => {
    it("should validate UK NHS number via Modulus 11", () => {
      expect(validateUKNHS("943 476 5919")).toBe(true);
      expect(validateUKNHS("943 476 5910")).toBe(false);
    });

    it("should validate Canadian SIN via Luhn Mod-10", () => {
      expect(validateCanadaSIN("046 454 286")).toBe(true);
      expect(validateCanadaSIN("046 454 287")).toBe(false);
    });
  });

  describe("Australian Identifiers: TFN, ABN, Medicare", () => {
    it("should validate Australia TFN via Mod-11", () => {
      expect(validateAustraliaTFN("64921648")).toBe(true); // 8-digit
      expect(validateAustraliaTFN("123456782")).toBe(true); // 9-digit
      expect(validateAustraliaTFN("123456789")).toBe(false);
    });

    it("should validate Australia ABN via Mod-89", () => {
      expect(validateAustraliaABN("51 824 753 556")).toBe(true);
      expect(validateAustraliaABN("51 824 753 550")).toBe(false);
    });

    it("should validate Australia Medicare number via Mod-10", () => {
      expect(validateAustraliaMedicare("2123 45670 1")).toBe(true);
      expect(validateAustraliaMedicare("2123 45679 1")).toBe(false);
    });
  });

  describe("Latin America & Southern Europe: Brazil CPF/CNPJ, Spain DNI, Italy CF", () => {
    it("should validate Brazil CPF two-stage check digits", () => {
      expect(validateBrazilCPF("111.444.777-35")).toBe(true);
      expect(validateBrazilCPF("111.111.111-11")).toBe(false); // Rejects repeated digits
      expect(validateBrazilCPF("111.444.777-00")).toBe(false);
    });

    it("should validate Brazil CNPJ check digits", () => {
      expect(validateBrazilCNPJ("11.222.333/0001-81")).toBe(true);
      expect(validateBrazilCNPJ("11.222.333/0001-99")).toBe(false);
    });

    it("should validate Spain DNI via Mod-23", () => {
      expect(validateSpainDNI("12345678Z")).toBe(true);
      expect(validateSpainDNI("12345678A")).toBe(false);
    });

    it("should validate Italy Codice Fiscale via Mod-26 parity check", () => {
      expect(validateItalyCodiceFiscale("RSSMRA85M01H501Q")).toBe(true);
      expect(validateItalyCodiceFiscale("RSSMRA85M01H501A")).toBe(false);
    });
  });

  describe("China Resident ID, US DEA, South Africa ID, UAE Emirates ID", () => {
    it("should validate China Resident ID via ISO 7064 Mod 11-2", () => {
      expect(validateChinaResidentID("11010519491231002X")).toBe(true);
      expect(validateChinaResidentID("110105194912310021")).toBe(false);
    });

    it("should validate US DEA prescriber formula", () => {
      expect(validateUSDEA("AB1234563")).toBe(true);
      expect(validateUSDEA("AB1234569")).toBe(false);
    });

    it("should validate South Africa ID via Luhn", () => {
      expect(validateSouthAfricaID("8001015009087")).toBe(true);
      expect(validateSouthAfricaID("8001015009080")).toBe(false);
    });

    it("should validate UAE Emirates ID via Luhn", () => {
      expect(validateUAEEmiratesID("784-1980-1234567-8")).toBe(true);
      expect(validateUAEEmiratesID("784-1980-1234567-0")).toBe(false);
    });

    it("should validate Egypt National ID century, birth date, and governorate codes", () => {
      expect(validateEgyptNationalID("29001010101234")).toBe(true);
      expect(validateEgyptNationalID("30505152109876")).toBe(true);
      expect(validateEgyptNationalID("29013010101234")).toBe(false); // Invalid month 13
      expect(validateEgyptNationalID("29001019901234")).toBe(false); // Invalid governorate 99
      expect(validateEgyptNationalID("290010101")).toBe(false); // Too short
    });

    it("should validate Rwanda National ID citizen indicator, year, and gender", () => {
      expect(validateRwandaNationalID("1199080012345678")).toBe(true);
      expect(validateRwandaNationalID("1200270098765432")).toBe(true);
      expect(validateRwandaNationalID("2199080012345678")).toBe(false); // Non-citizen 2
      expect(validateRwandaNationalID("1199050012345678")).toBe(false); // Invalid gender 5
    });

    it("should validate Poland PESEL via weighted Mod-10", () => {
      expect(validatePolandPESEL("02070803628")).toBe(true);
      expect(validatePolandPESEL("02070803629")).toBe(false);
    });

    it("should validate Poland NIP via weighted Mod-11", () => {
      expect(validatePolandNIP("1234563218")).toBe(true);
      expect(validatePolandNIP("1234563219")).toBe(false);
    });

    it("should validate Netherlands BSN via 11-proof (Elfproef)", () => {
      expect(validateNetherlandsBSN("111222333")).toBe(true);
      expect(validateNetherlandsBSN("111222334")).toBe(false);
    });

    it("should validate Belgium RRN via Mod-97", () => {
      expect(validateBelgiumRRN("85.01.01-123.87")).toBe(true);
      expect(validateBelgiumRRN("85.01.01-123.88")).toBe(false);
    });

    it("should validate Sweden Personnummer via Luhn", () => {
      expect(validateSwedenPIN("811218-9876")).toBe(true);
      expect(validateSwedenPIN("811218-9875")).toBe(false);
    });

    it("should validate Portugal NIF via weighted Mod-11", () => {
      expect(validatePortugalNIF("123456789")).toBe(true);
      expect(validatePortugalNIF("123456780")).toBe(false);
    });

    it("should validate Ireland PPSN via Mod-23", () => {
      expect(validateIrelandPPSN("1234567T")).toBe(true);
      expect(validateIrelandPPSN("1234567A")).toBe(false);
    });

    it("should validate Romania CNP via weighted Mod-11", () => {
      expect(validateRomaniaCNP("1900101011232")).toBe(true);
      expect(validateRomaniaCNP("1900101011231")).toBe(false);
    });

    it("should validate Hungary TIN via weighted Mod-11", () => {
      expect(validateHungaryTIN("8123456786")).toBe(true);
      expect(validateHungaryTIN("8123456780")).toBe(false);
    });

    it("should validate Finland HETU via Mod-31 lookup", () => {
      expect(validateFinlandHETU("010101-123N")).toBe(true);
      expect(validateFinlandHETU("010101-123A")).toBe(false);
    });

    it("should validate Czech / Slovak Birth Number (Rodné Číslo) via Mod-11", () => {
      expect(validateCzechBirthNumber("850101/1222")).toBe(true);
      expect(validateCzechBirthNumber("850101/1223")).toBe(false);
    });

    it("should validate Japan My Number via Mod-11", () => {
      expect(validateJapanMyNumber("123456789018")).toBe(true);
      expect(validateJapanMyNumber("123456789019")).toBe(false);
    });

    it("should validate South Korea RRN via weighted Mod-11", () => {
      expect(validateSouthKoreaRRN("900101-1234568")).toBe(true);
      expect(validateSouthKoreaRRN("900101-1234569")).toBe(false);
    });

    it("should validate Taiwan ID via weighted Mod-10", () => {
      expect(validateTaiwanID("A123456789")).toBe(true);
      expect(validateTaiwanID("A123456780")).toBe(false);
    });

    it("should validate Hong Kong HKID via weighted Mod-11", () => {
      expect(validateHongKongHKID("B111111(7)")).toBe(true);
      expect(validateHongKongHKID("B111111(8)")).toBe(false);
    });

    it("should validate Saudi Arabia National ID via Luhn Mod-10", () => {
      expect(validateSaudiNationalID("1234567897")).toBe(true);
      expect(validateSaudiNationalID("3234567897")).toBe(false); // Invalid starting digit 3
    });

    it("should validate Israel ID via Luhn Mod-10", () => {
      expect(validateIsraelID("123456782")).toBe(true);
      expect(validateIsraelID("123456783")).toBe(false);
    });

    it("should validate Turkey TC Kimlik No (TCKN) dual algorithm", () => {
      expect(validateTurkeyTCKN("10000000146")).toBe(true);
      expect(validateTurkeyTCKN("10000000147")).toBe(false);
    });

    it("should validate Kazakhstan IIN via Mod-11", () => {
      expect(validateKazakhstanIIN("900101123102")).toBe(true);
      expect(validateKazakhstanIIN("900101123103")).toBe(false);
    });

    it("should validate Thailand National ID via weighted Mod-11", () => {
      expect(validateThailandNationalID("1100100123454")).toBe(true);
      expect(validateThailandNationalID("1100100123455")).toBe(false);
    });

    it("should validate Indonesia NIK structure (province, birthdate with female offset)", () => {
      expect(validateIndonesiaNIK("3171010101900001")).toBe(true);
      expect(validateIndonesiaNIK("3171014101900001")).toBe(true); // Female day 41 (day 1 + 40)
      expect(validateIndonesiaNIK("0571010101900001")).toBe(false); // Invalid province 05
      expect(validateIndonesiaNIK("3171013501900001")).toBe(false); // Invalid male day 35
    });

    it("should validate Vietnam CCCD structure (province, century/gender)", () => {
      expect(validateVietnamCCCD("001099012345")).toBe(true);
      expect(validateVietnamCCCD("001299012345")).toBe(true);
      expect(validateVietnamCCCD("099099012345")).toBe(false); // Invalid province 099
      expect(validateVietnamCCCD("001599012345")).toBe(false); // Invalid gender/century 5
    });

    it("should validate US ABA Routing transit number via weighted Mod-10", () => {
      expect(validateUSABARouting("122105155")).toBe(true);
      expect(validateUSABARouting("122105156")).toBe(false);
    });

    it("should validate Mexico CURP structure and check digit", () => {
      expect(validateMexicoCURP("HEGM951015HDFRRL00")).toBe(true);
      expect(validateMexicoCURP("HEGM951015HDFRRL01")).toBe(false); // Invalid check digit
      expect(validateMexicoCURP("HEGM951315HDFRRL00")).toBe(false); // Invalid format
    });

    it("should validate Mexico RFC date format", () => {
      expect(validateMexicoRFC("HEGM951015AB1")).toBe(true);
      expect(validateMexicoRFC("ABC951015AB1")).toBe(true); // 12-char corporate RFC
      expect(validateMexicoRFC("HEGM951315AB1")).toBe(false); // Invalid month 13
    });

    it("should validate Mexico NSS via Luhn Mod-10", () => {
      expect(validateMexicoNSS("12345678903")).toBe(true);
      expect(validateMexicoNSS("12345678904")).toBe(false);
    });

    it("should validate Dominican Republic Cedula via Luhn Mod-10", () => {
      expect(validateDominicanCedula("402-1234567-8")).toBe(true);
      expect(validateDominicanCedula("402-1234567-9")).toBe(false);
    });

    it("should validate Ontario OHIP Health Card via Luhn Mod-10", () => {
      expect(validateOntarioOHIP("1234-567-897")).toBe(true);
      expect(validateOntarioOHIP("1234-567-898")).toBe(false);
    });

    it("should validate Swiss AHV/AVS via EAN-13 / Mod-10", () => {
      expect(validateSwissAHV("756.1234.5678.97")).toBe(true);
      expect(validateSwissAHV("7561234567897")).toBe(true);
      expect(validateSwissAHV("756.1234.5678.98")).toBe(false);
      expect(validateSwissAHV("757.1234.5678.97")).toBe(false); // Invalid prefix
    });

    it("should validate Swiss UID / IDE via Mod-11", () => {
      expect(validateSwissUID("CHE-123.456.788")).toBe(true);
      expect(validateSwissUID("CHE123456788")).toBe(true);
      expect(validateSwissUID("CHE-123.456.789")).toBe(false);
    });

    it("should validate Norwegian Fødselsnummer via dual Mod-11", () => {
      expect(validateNorwayFodselsnummer("01019010046")).toBe(true);
      expect(validateNorwayFodselsnummer("01019010047")).toBe(false);
    });

    it("should validate Icelandic Kennitala via Mod-11 + century digit", () => {
      expect(validateIcelandKennitala("0101901189")).toBe(true);
      expect(validateIcelandKennitala("0101901179")).toBe(false);
    });

    it("should validate Ukraine IPN via weighted Mod-11", () => {
      expect(validateUkraineIPN("1234567899")).toBe(true);
      expect(validateUkraineIPN("1234567898")).toBe(false);
    });

    it("should validate Balkan JMBG via Mod-11", () => {
      expect(validateBalkanJMBG("0101990710008")).toBe(true);
      expect(validateBalkanJMBG("0101990710009")).toBe(false);
    });

    it("should validate Argentina CUIT/CUIL via Mod-11", () => {
      expect(validateArgentinaCUIT("20-12345678-6")).toBe(true);
      expect(validateArgentinaCUIT("20123456786")).toBe(true);
      expect(validateArgentinaCUIT("20-12345678-7")).toBe(false);
      expect(validateArgentinaCUIT("19-12345678-6")).toBe(false); // Invalid prefix 19
    });

    it("should validate Chile RUN/RUT via Mod-11 including K check digit", () => {
      expect(validateChileRUT("12345678-5")).toBe(true);
      expect(validateChileRUT("12.345.678-5")).toBe(true);
      expect(validateChileRUT("12345678-6")).toBe(false);
    });

    it("should validate Colombia NIT via DIAN Mod-11", () => {
      expect(validateColombiaNIT("900123456-8")).toBe(true);
      expect(validateColombiaNIT("900123456-9")).toBe(false);
    });

    it("should validate Peru RUC via SUNAT Mod-11", () => {
      expect(validatePeruRUC("20123456786")).toBe(true);
      expect(validatePeruRUC("20123456787")).toBe(false);
      expect(validatePeruRUC("30123456786")).toBe(false); // Invalid prefix 30
    });

    it("should validate Ecuador Cédula via province code and Mod-10", () => {
      expect(validateEcuadorCedula("1710034065")).toBe(true);
      expect(validateEcuadorCedula("1710034066")).toBe(false); // Invalid check digit
      expect(validateEcuadorCedula("2510034065")).toBe(false); // Invalid province 25
    });

    it("should validate Uruguay Cédula de Identidad via Mod-10", () => {
      expect(validateUruguayCI("1.234.567-2")).toBe(true);
      expect(validateUruguayCI("12345672")).toBe(true);
      expect(validateUruguayCI("12345673")).toBe(false);
    });
  });

  describe("Tier 4 Custom Enterprise Keywords", () => {
    it("should tokenize dynamic user-supplied keywords passed via headers", () => {
      const text = "Access secret project ProjectApollo on host InternalHost01.";
      const customKeywords = ["ProjectApollo", "InternalHost01"];

      const result = tokenize(text, { customKeywords });

      expect(result.sanitizedText).toContain("CUSTOM_1");
      expect(result.sanitizedText).toContain("CUSTOM_2");
      expect(result.tokenMap["CUSTOM_1"]).toBe("ProjectApollo");
      expect(result.tokenMap["CUSTOM_2"]).toBe("InternalHost01");
      expect(result.sanitizedText).not.toContain("ProjectApollo");
      expect(result.sanitizedText).not.toContain("InternalHost01");
    });
  });
});
