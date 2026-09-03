# 🛡️ Data De-identification & Reversible Tokenization Engine

> **A high-performance, open-source utility for real-time PII de-identification, format-preserving masking, and reversible tokenization across Generative AI and LLM inference pipelines.**

---

## 🌟 Overview

The **Data De-identification & Reversible Tokenization Engine** provides a zero-trust, low-latency privacy barrier for AI applications. It intercepts sensitive user prompts, replaces Personally Identifiable Information (PII), Financial Identifiers (Cards, IBANs), Government IDs (SSN, Singapore NRIC), and Healthcare PHI with secure, reversible synthetic tokens, and seamlessly rehydrates model responses.

### Key Capabilities

1. **4-Tier Detection Hierarchy & Span Disambiguation**:
   - **Tier 1**: Exact High-Confidence Patterns (API Keys, Emails, Phones).
   - **Tier 2**: Algorithmic Checksum Validation (Luhn Mod-10 Credit Cards, Singapore NRIC Mod-11, ISO 7064 Mod-97 IBAN check digits, US SSN Area Exclusions).
   - **Tier 3**: Contextual Proximity Anchor Matchers (Names, Invoices, Healthcare MRN numbers).
   - **Tier 4**: Dynamic Custom Enterprise Keyword Lists.

2. **Dual Operational Modes**:
   - **Mode A (Structural Tokens)**: Standard placeholders (`PERSON_1`, `EMAIL_1`, `CARD_1`).
   - **Mode B (Format-Preserving Masking - FPE)**: Generates realistic, syntax-valid synthetic mock values (`Jordan Smith`, `user_a1@mockdomain.internal`, Luhn-valid card numbers) for coding assistants and SQL generators.

3. **Grammatical Suffix & Coreference Preservation**:
   - Preserves possessive apostrophes (`Alice Wong's` $\rightarrow$ `PERSON_1's` / `Jordan Smith's`).
   - Maintains consistent entity token assignment across repeated prompt mentions.

4. **Canonical Category Packs & Mathematical Checksum Verification**:
   - Zero-dependency check-digit verification: Verhoeff (Aadhaar), Luhn (Cards, SIN, ZA, UAE), ISO 7064 Mod-97 (IBAN, NIR), Mod-11 (NHS, TFN, NRIC), Mod-23 (DNI), Mod-26 (Codice Fiscale), Mod-89 (ABN).
   - Fast $O(1)$ rulepack resolution using Canonical Pack IDs (`south_east_asia`, `asia_non_sea`, `north_america`, `south_america`, `european_union`, `europe_non_eu`, `africa`, `oceania`).
   - Max 2 Canonical Packs enforced per request to guarantee sub-5ms execution SLA.

---

## 🗺️ Canonical Category Packs (Max 2 per API Request)

> ⚡ **Performance SLA Guarantee**: To maintain ultra-fast sub-5ms latency on Cloudflare Workers and Edge isolates, each API request accepts a **maximum of 2 Canonical Pack IDs**. Universal baseline rules (`global`) are always included automatically. Requests specifying individual country codes or exceeding 2 packs are rejected with HTTP 400.

| Canonical Pack ID | Description & Region | Key Detectors & Checksum Validation |
|---|---|---|
| **`global`** *(Default)* | Universal Baseline | Payment Cards (Luhn), IBAN (Mod-97), SWIFT/BIC, Crypto (BTC/ETH/SOL), IP/MAC, API Keys, Email, Phone, Contextual Names, Invoices |
| **`south_east_asia`** | South East Asia (ASEAN Catalog) | **Singapore**: NRIC/FIN (Mod-11), UEN. **Malaysia**: MyKad (12-digit date/state), TIN, SSM. **Indonesia**: NIK (16-digit province/regency), NPWP. **Thailand**: National ID (Mod-11), TIN. **Vietnam**: CCCD (12-digit province/century), MST. **Philippines**: PhilSys PCN, SSS, TIN, PhilHealth. **Myanmar**: NRC. **Cambodia**: Khmer ID. **Brunei**: Smart IC. |
| **`asia_non_sea`** | Asia (Non-SEA) & Middle East | **India**: Aadhaar (Verhoeff), PAN, Voter ID, Passport, GSTIN (Mod-36), DL, ABHA. **Japan**: My Number (Mod-11), Corporate Number. **South Korea**: RRN (Mod-11), BRN. **Taiwan**: ID (Mod-10), UBN. **China**: Resident ID (Mod 11-2), USCC. **Hong Kong**: HKID (Mod-11). **Pakistan**: CNIC, NTN. **Bangladesh**: NID. **Sri Lanka**: NIC. **Nepal**: Citizenship. **Saudi Arabia**: National ID/Iqama (Luhn), VAT (ZATCA). **UAE**: Emirates ID (Luhn). **Israel**: ID (Luhn). **Turkey**: TCKN (Dual Mod-10), VKN. **Qatar**: QID. **Kuwait**: Civil ID. **Bahrain**: CPR. **Oman**: Civil No. **Kazakhstan**: IIN (Mod-11). |
| **`north_america`** | North America (US, CA, MX & Caribbean) | **US**: SSN, ITIN, EIN, Passport, NPI (Luhn), DEA (Checksum), ABA Routing (Mod-10), MBI (Medicare). **Canada**: SIN (Luhn Mod-10), BN, OHIP Health (Luhn), Passport. **Mexico**: CURP (Mod-10), RFC (Tax ID), NSS (Luhn Mod-10), INE. **Dominican Republic**: Cédula (Luhn). **Costa Rica**: Cédula. **Guatemala**: CUI, NIT. **Panama**: Cédula. **Jamaica**: TRN. |
| **`south_america`** | South America (12 Nations) | **Brazil**: CPF (Two-stage Mod-11), CNPJ (Two-stage Mod-11), RG. **Argentina**: CUIT/CUIL (Mod-11), DNI. **Chile**: RUN/RUT (Mod-11). **Colombia**: NIT (DIAN Mod-11), Cédula. **Peru**: RUC (Mod-11), DNI. **Venezuela**: RIF (Mod-11), Cédula. **Ecuador**: Cédula (Mod-10), RUC. **Uruguay**: Cédula (Mod-10), RUT. **Paraguay**: RUC (Mod-11), Cédula. **Bolivia**: Cédula, NIT. **Guyana**: TIN. **Suriname**: ID. |
| **`european_union`** | European Union (All 27 EU Member States) | **Germany**: Steuer-ID (Mod-11), Steuernummer. **France**: NIR (Mod-97), SIREN (Luhn). **Italy**: Codice Fiscale (Mod-26), Partita IVA. **Spain**: DNI/NIE (Mod-23), CIF. **Poland**: PESEL (Mod-10), NIP (Mod-11). **Netherlands**: BSN (Elfproef). **Belgium**: RRN (Mod-97), CBE. **Sweden**: Personnummer (Luhn). **Austria**: SVNr (Mod-11). **Portugal**: NIF (Mod-11). **Ireland**: PPSN (Mod-23). **Greece**: AFM, AMKA. **Czechia/Slovakia**: Rodné Číslo (Mod-11). **Romania**: CNP (Mod-11). **Hungary**: TIN (Mod-11). **Denmark**: CPR (Mod-11). **Finland**: HETU (Mod-31). **Bulgaria**: EGN (Mod-11). **Croatia**: OIB (ISO 7064). **Lithuania**: AK. **Slovenia**: Davčna, EMŠO. **Latvia**: PK. **Estonia**: IK. **Cyprus**: TIC. **Luxembourg**: Matricule. **Malta**: ID. |
| **`europe_non_eu`** | Europe Non-EU | **UK**: NINO, NHS Number (Mod-11), UTR, CRN, Driving Licence. **Switzerland**: AHV/AVS (EAN-13), UID/IDE (Mod-11). **Norway**: Fødselsnummer (Dual Mod-11), Org.nr. **Iceland**: Kennitala (Mod-11). **Ukraine**: IPN (Mod-11), EDRPOU, UNZR. **Western Balkans** (RS, BA, MK, ME): JMBG/EMBG (Mod-11), PIB (Mod 11, 10). **Albania**: NID, NIPT. **Moldova**: IDNP (Mod-10). **Caucasus** (GE, AM, AZ): Personal No, PSN, FİN. **Liechtenstein**: PEID. |
| **`africa`** | Africa (Pan-African Catalog) | **Egypt**: National ID (14-digit date/gov code), Tax Number. **Nigeria**: NIN, BVN. **South Africa**: ID (Luhn Mod-10), Tax Ref. **Kenya**: KRA PIN, ID. **Ghana**: Ghana Card (`GHA-`), TIN. **Ethiopia**: Fayda ID. **Morocco**: CNIE. **Uganda**: NIN (`CM/CF`). **Tanzania**: NIDA (20-digit). **Rwanda**: National ID (16-digit). **Algeria**: NIN. **Tunisia**: CIN. **Ivory Coast**: NNI. **Senegal**: CNI. **Zimbabwe**: ID. **Zambia**: NRC. **Angola**: BI. |
| **`oceania`** | Oceania | **Australia**: TFN (Mod-11), Medicare (Mod-10), ABN (Mod-89). **New Zealand**: IRD (Mod-11). |
| **`corporate`** | Enterprise & PHI | Healthcare MRN, Invoices, Order IDs, Enterprise Codenames. |

---

## 🇺🇳 UN Sustainable Development Goals (SDG) Alignment

- **SDG 9: Industry, Innovation, and Infrastructure (Target 9.c)**: Establishes open, reliable, and privacy-preserving AI infrastructure for safe global adoption.
- **SDG 16: Peace, Justice, and Strong Institutions (Target 16.10)**: Protects fundamental privacy rights, human dignity, and sensitive healthcare/financial records against unauthorized exposure in AI training and API logs.

---

## 🚀 Quickstart & Installation

```bash
# Clone repository
git clone https://github.com/your-org/data-deidentification-engine.git
cd data-deidentification-engine

# Install dependencies
npm install

# Run Vitest test suite (95 passing tests)
npm test

# Start local server
npm run dev
```

---

## 📡 API Reference

> **Note**: HTTP API endpoints are open and unauthenticated by default for standalone DPG deployments. No `Authorization` headers are required.

### 1. `POST /v1/tokenize`
De-identifies input text and returns a temporary `sessionId` and tokenized payload.

#### Request Body
```json
{
  "text": "Transfer INR 50,000 to PAN ABCPK1234F for Aadhaar 2345 6789 0124 with card 4532-0151-1283-0366.",
  "categories": ["asia_non_sea"],
  "mode": "fpe",
  "customKeywords": ["ProjectNexus"],
  "ttlSeconds": 600
}
```
*(Or pass via header: `x-detection-categories: asia_non_sea`)*

#### Response
```json
{
  "mode": "fpe",
  "sessionId": "sess_tok_efcwiirpiu",
  "sanitizedText": "Transfer INR 50,000 to PAN ABCPK1234F for Aadhaar 2345 6789 0124 with card 4532-0151-9988-1007.",
  "entitiesCount": 3,
  "entitiesDetected": [
    { "type": "GOV_ID_PAN", "token": "PAN_1" },
    { "type": "GOV_ID_AADHAAR", "token": "AADHAAR_1" },
    { "type": "FIN_CARD", "token": "4532-0151-9988-1007" }
  ],
  "categoriesApplied": [
    "global",
    "asia_non_sea"
  ],
  "expiresAt": "2026-09-03T14:35:00.000Z"
}
```

---

### 2. `POST /v1/detokenize`
Restores synthetic tokens back to original values.

#### Request Body
```json
{
  "sessionId": "sess_tok_efcwiirpiu",
  "tokenizedText": "Payment confirmed for Jordan Smith (email: user_a1@mockdomain.internal).",
  "purgeAfterRead": true
}
```

#### Response
```json
{
  "rehydratedText": "Payment confirmed for Alice Wong (email: alice.w@fintech.sg).",
  "tokensResolved": 2,
  "sessionStatus": "purged"
}
```

---

## 🧪 Testing

Run the full evaluation test suite:

```bash
# Run 47 unit & benchmark tests
npm test

# Run API test runner script over HTTP
node test-utility-apis.js http://localhost:8787 gw_live_6da9b753171ed855c381658847a08bb67e04f12ff65a2442
```

---

## 📜 License

Licensed under the **[MIT License](LICENSE)**. Open Source and Free for All.
