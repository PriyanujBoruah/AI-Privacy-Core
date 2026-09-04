# 🛡️ AI Privacy Core

> **Open-source, zero-trust privacy gateway for LLM pipelines. Tokenizes sensitive PII, sovereign national IDs, and financial records with mathematical checksum precision and sub-5ms edge latency.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![Tests: 95 Passing](https://img.shields.io/badge/Tests-95%20Passing-brightgreen.svg)
![Runtime: Cloudflare V8](https://img.shields.io/badge/Runtime-Cloudflare%20V8%20Edge-orange.svg)
![Coverage: 109 Jurisdictions](https://img.shields.io/badge/Coverage-109%20Jurisdictions-indigo.svg)
![Latency: Sub-5ms](https://img.shields.io/badge/Latency-%3C%205ms%20Edge%20SLA-emerald.svg)
![Zero Data Retention](https://img.shields.io/badge/Compliance-Zero%20Data%20Retention%20(ZDR)-success.svg)

🌐 **Documentation & Live Playground:** [priyanujboruah.github.io/AI-Privacy-Core](https://priyanujboruah.github.io/AI-Privacy-Core/)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Architecture & Core Differentiators](#-architecture--core-differentiators)
- [Enterprise Security & Zero Data Retention (ZDR)](#-enterprise-security--zero-data-retention-zdr)
- [API Reference](#-api-reference)
  - [POST /v1/tokenize](#1-post-v1tokenize)
  - [POST /v1/detokenize](#2-post-v1detokenize)
  - [GET /health](#3-get-health)
- [SLA Guardrails & System Limits](#-sla-guardrails--system-limits)
- [Quickstart & Local Development](#-quickstart--local-development)
- [Deployment](#-deployment)
- [Canonical Regional Packs Catalog](#-canonical-regional-packs-catalog)
- [Country-Wise Sovereign ID Coverage & Validation Engines](#-country-wise-sovereign-id-coverage--validation-engines)
- [Open-Source Sustainable Development (UN SDGs)](#-open-source-sustainable-development-un-sdgs)
- [License](#-license)
- [Contributing & Security Disclosures](#-contributing--security-disclosures)

---

## 🌟 Overview

**AI Privacy Core** is an enterprise-grade, edge-native de-identification and reversible tokenization gateway designed specifically for Generative AI applications, RAG pipelines, and agentic LLM workflows.

When users interact with frontier models (OpenAI GPT-4, Google Gemini, Anthropic Claude, open-source Llama), prompts frequently leak high-risk data: credit card numbers, national identification numbers, bank accounts, emails, and medical records. **AI Privacy Core** intercepts user prompts at the network edge, neutralizes sensitive data with deterministic surrogate tokens, and seamlessly rehydrates model responses before delivering them back to end users.

### Standardized System Metrics

| Metric | Specification |
|---|---|
| **Edge Execution SLA** | `< 5 ms` global latency overhead |
| **Geographic Coverage** | **109 Sovereign Jurisdictions** across 9 Canonical Packs (75+ with dedicated national ID checksums, 200+ for global financial and telecom standards) |
| **Algorithmic Checksum Engines** | `67` standalone mathematical verification formulas (Verhoeff, Luhn, ISO 7064, Mod-11, Mod-23, Mod-26, Elfproef) |
| **Pattern Rules** | `185` sovereign, financial, and context rules |
| **Runtime Requirements** | Serverless V8 Edge Isolates (Cloudflare Workers), Node.js 18+, Bun |
| **Storage Architecture** | Ephemeral in-memory RAM (zero disk persistence) or optional Cloudflare D1 SQL |
| **Roundtrip Rehydration** | 100% exact, deterministic restoration with coreference consistency |

---

## 🏗️ Architecture & Core Differentiators

```
[ Client Application / User Prompt ]
                │
                ▼ (Raw text containing PII / Sovereign IDs)
┌───────────────────────────────────────────────────────────────────────────┐
│                       AI PRIVACY CORE (Edge Gateway)                      │
│                                                                           │
│  1. 4-Tier Disambiguation (Exact, Checksum, Context, Enterprise Keywords)│
│  2. Mathematical Checksum Verification (67 Algorithmic Engines)           │
│  3. Reversible Token Substitution (e.g. CARD_1, PERSON_1, ZA_ID_1)        │
│  4. Ephemeral Vault / Zero-Disk RAM Session Storage (TTL Auto-Eviction)   │
└───────────────────────────────────────────────────────────────────────────┘
                │
                ▼ (Sanitized Prompt with Synthetic Tokens)
┌───────────────────────────────────────────────────────────────────────────┐
│        UPSTREAM THIRD-PARTY LLM / INFERENCE PIPELINE (External)           │
│                                                                           │
│  OpenAI GPT-4 / Google Gemini / Anthropic Claude / vLLM / Ollama          │
│  (Processes query without ever seeing plaintext PII or Sovereign IDs)     │
└───────────────────────────────────────────────────────────────────────────┘
                │
                ▼ (Model Response containing Synthetic Tokens)
┌───────────────────────────────────────────────────────────────────────────┐
│                       AI PRIVACY CORE (Rehydration)                       │
│                                                                           │
│  1. Session Lookup (Token -> Original Entity)                             │
│  2. Exact String Rehydration & Coreference Resolution                     │
│  3. Cryptographic Zero Data Retention (purgeAfterRead: true)              │
└───────────────────────────────────────────────────────────────────────────┘
                │
                ▼ (Restored, Plaintext Response)
[ Client Application / User ]
```

> **Boundary & Stateless Execution Note:**
> - **Where the open-source code starts & ends**: AI Privacy Core is an independent, self-contained edge gateway layer encompassing tokenization, checksum validation, ephemeral vault management, and detokenization. It sits strictly between the client and upstream LLMs. Upstream AI providers (OpenAI, Anthropic, Google, open-source inference servers) are external services that receive only de-identified text.
> - **How it runs statelessly**: AI Privacy Core executes in a stateless, zero-trust paradigm. It requires no persistent disk storage. When deployed without a database binding, all token-to-entity mappings exist solely in volatile RAM, isolated per edge worker invocation. Setting `purgeAfterRead: true` cryptographically destroys the mapping the microsecond it is accessed. No user prompts, tokens, or decrypted entities are ever logged to disk, shared upstream, or retained.

### 1. 4-Tier Detection Hierarchy & Disambiguation
- **Tier 1: High-Confidence Formats**: Cryptographic keys, emails, international phone numbers (E.164), cryptocurrency addresses (Bitcoin, Ethereum, Solana).
- **Tier 2: Algorithmic Checksum Validation**: Eliminates false positives by evaluating strict sovereign formulas: Verhoeff (India Aadhaar), Luhn Mod-10 (Credit Cards, Canada SIN, South Africa ID), ISO 7064 Mod-97 (IBAN, France NIR), Mod-11 (Singapore NRIC, UK NHS, Australia TFN), Mod-23 (Spain DNI), and Mod-26 (Italy Codice Fiscale).
- **Tier 3: Contextual Proximity Anchors**: Contextual matchers with sliding window proximity heuristics to capture unstructured names, invoices, and healthcare MRN numbers.
- **Tier 4: Dynamic Enterprise Keywords**: Header-driven custom entity lists (`x-custom-entities`, `x-custom-keywords`) masking internal project codenames and intellectual property.

### 2. Dual Tokenization Modes
- **Structural Mode (`"structural"`, Default)**: Replaces sensitive entities with semantic tokens (`CARD_1`, `PERSON_1`, `EMAIL_1`). Optimal for chat assistants and summarization tasks.
- **Format-Preserving Masking (`"fpe"`)**: Replaces entities with syntactically valid synthetic mocks (e.g., valid Luhn card mock, synthetic valid-format email) for SQL generators, code generation, and tabular format preservation.

### 3. Grammatical Suffix & Coreference Preservation
- Automatically detects and preserves possessive apostrophes and contractions (`Alice Wong's` -> `PERSON_1's`).
- Guarantees consistent token assignment for repeated mentions across long multi-turn prompts.

---

## 🔒 Enterprise Security & Zero Data Retention (ZDR)

Enterprise security teams and CISOs frequently ask two critical architecture questions:

### 1. Is Cloudflare D1 required? Does session data persist on disk?
**No.** Self-hosted deployments operate in a **100% ephemeral in-memory state** by default.
- When `DB` is unbound, session mappings reside strictly in volatile RAM with automatic TTL eviction and **zero disk persistence**.
- For multi-datacenter distributed edge architectures, Cloudflare D1 (or Redis/PostgreSQL) can be optionally bound.
- No plaintext prompts or entity values are ever written to server logs or persisted beyond their configured TTL.

### 2. Zero Data Retention (ZDR) Enforced (`purgeAfterRead`)
The detokenize endpoint supports the `purgeAfterRead: true` parameter:
- **Instant Cryptographic Obliteration**: The session token mapping is permanently erased from memory the exact microsecond it is read.
- **Subsequent Replays Rejected**: Any subsequent attempt to detokenize using that `sessionId` returns HTTP `404 session_expired_error`.
- **Compliance Alignment**: Satisfies enterprise CISO zero-retention mandates, **GDPR Article 17 (Right to Erasure)**, and **SOC 2 Type II** trust criteria.

---

## 📡 API Reference

The live edge gateway is unauthenticated and open for direct consumption:
```
Base URL: https://ai-privacy-core.boruahpriyanuj2004.workers.dev
```

### 1. `POST /v1/tokenize`
Scans input prompt text, runs algorithmic checksum validators, replaces detected entities with deterministic surrogate tokens, and registers an ephemeral session.

#### Headers
| Header | Type | Description |
|---|---|---|
| `Content-Type` | string | `application/json` |
| `x-detection-categories` | string | *(Optional)* Comma-separated Canonical Pack IDs (e.g. `africa,global`) |
| `x-custom-entities` | string | *(Optional)* Comma-separated custom enterprise keywords to mask |

#### Request Body
```json
{
  "text": "Transfer USD 5,000 for Contact Alice Wong (email: alice@fintech.io) with Visa 4532-0151-1283-0366 to South Africa ID 8001015009087.",
  "categories": ["africa"],
  "mode": "structural",
  "customKeywords": ["ProjectTitan"],
  "ttlSeconds": 300
}
```

#### Parameters
- `text` *(string, required)*: Input prompt text (Max 1MB).
- `categories` *(string[], optional)*: Up to 2 Canonical Regional Pack IDs. Defaults to `["global"]`.
- `mode` *(string, optional)*: `"structural"` (e.g., `<CARD_1>`, `<PERSON_1>`) or `"fpe"` (format-preserving synthetic mocks). Default: `"structural"`.
- `customKeywords` *(string[], optional)*: List of custom enterprise terms/codenames to tokenize.
- `ttlSeconds` *(number, optional)*: Vault session lifetime in seconds. Default: `300` (5 minutes), Max: `86400` (24 hours).

#### Response (`200 OK`)
```json
{
  "mode": "structural",
  "sessionId": "sess_tok_hom91ilalo",
  "sanitizedText": "Transfer USD 5,000 for Contact PERSON_1 (email: EMAIL_1) with Visa CARD_1 to South Africa ID ZA_ID_1.",
  "entitiesCount": 4,
  "entitiesDetected": [
    { "type": "RULE_CONTEXT_NAME", "token": "PERSON_1" },
    { "type": "RULE_EMAIL", "token": "EMAIL_1" },
    { "type": "RULE_CREDIT_CARD", "token": "CARD_1" },
    { "type": "RULE_ZA_ID", "token": "ZA_ID_1" }
  ],
  "categoriesApplied": [
    "global",
    "africa"
  ],
  "expiresAt": "2026-09-04T21:16:55.212Z"
}
```

---

### 2. `POST /v1/detokenize`
Rehydrates tokenized text produced by an LLM back into original sensitive values using the session vault.

#### Request Body
```json
{
  "sessionId": "sess_tok_hom91ilalo",
  "tokenizedText": "Transfer USD 5,000 for Contact PERSON_1 (email: EMAIL_1) with Visa CARD_1 to South Africa ID ZA_ID_1.",
  "purgeAfterRead": true
}
```

#### Parameters
- `sessionId` *(string, required)*: Session ID returned from the original `/v1/tokenize` call.
- `tokenizedText` *(string, required)*: Text containing tokens to restore.
- `purgeAfterRead` *(boolean, optional)*: **Zero Data Retention (ZDR) Flag**. When `true`, permanently deletes the session mapping immediately upon read. Default: `false`.

#### Response (`200 OK`)
```json
{
  "rehydratedText": "Transfer USD 5,000 for Contact Alice Wong (email: alice@fintech.io) with Visa 4532-0151-1283-0366 to South Africa ID 8001015009087.",
  "tokensResolved": 4,
  "sessionStatus": "purged"
}
```

---

### 3. `GET /health`
Returns runtime health and version information.

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "version": "2.0.0"
}
```

---

## 🛡️ SLA Guardrails & System Limits

To guarantee predictable `< 5ms` execution on serverless V8 edge isolates, the engine enforces strict architectural bounds:

| Guardrail | Limit | Status Code on Breach |
|---|---|---|
| **Canonical Pack Limit** | Maximum 2 Canonical Packs per request | `400 category_limit_exceeded` |
| **Payload Size Ceiling** | 1 Megabyte (1,048,576 bytes) | `413 payload_too_large` |
| **Country Code Format** | Must use Canonical Pack IDs (no ISO country aliases) | `400 invalid_request_error` |
| **Default Session TTL** | 300 seconds (5 minutes) | `404 session_expired_error` |

---

## ⚡ Quickstart & Local Development

### Integration Examples

#### cURL
```bash
curl -X POST "https://ai-privacy-core.boruahpriyanuj2004.workers.dev/v1/tokenize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact Alice Wong at alice@fintech.io with card 4532-0151-1283-0366.",
    "categories": ["global"]
  }'
```

#### Node.js (Fetch)
```javascript
const response = await fetch("https://ai-privacy-core.boruahpriyanuj2004.workers.dev/v1/tokenize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Contact Alice Wong at alice@fintech.io with card 4532-0151-1283-0366.",
    categories: ["global"]
  })
});

const { sanitizedText, sessionId } = await response.json();
console.log("Sanitized Prompt for LLM:", sanitizedText);

// Send sanitizedText to OpenAI / Claude / Gemini...
// On completion, detokenize:
const detokResponse = await fetch("https://ai-privacy-core.boruahpriyanuj2004.workers.dev/v1/detokenize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId,
    tokenizedText: sanitizedText,
    purgeAfterRead: true
  })
});

const { rehydratedText } = await detokResponse.json();
console.log("Restored Prompt:", rehydratedText);
```

#### Python (Requests)
```python
import requests

url = "https://ai-privacy-core.boruahpriyanuj2004.workers.dev/v1/tokenize"
payload = {
    "text": "Contact Alice Wong at alice@fintech.io with card 4532-0151-1283-0366.",
    "categories": ["global"]
}

response = requests.post(url, json=payload).json()
print("Safe Prompt:", response["sanitizedText"])
print("Session ID :", response["sessionId"])
```

---

### Local Setup & Testing

```bash
# Clone repository
git clone https://github.com/PriyanujBoruah/AI-Privacy-Core.git
cd AI-Privacy-Core/data-deidentification-engine

# Install dependencies
npm install

# Run the complete test suite (95 unit & checksum tests)
npm test

# Run local development server
npm run dev
```

---

## 🚀 Deployment

Deploy to Cloudflare Workers with a single command:

```bash
# Login to Cloudflare
npx wrangler login

# Deploy Edge Worker
npx wrangler deploy
```

---

## 🌐 Canonical Regional Packs Catalog

To maintain the strict sub-5ms edge SLA guarantee, each API request accepts a **maximum of 2 Canonical Pack IDs**. Universal baseline rules (`global`) are always included automatically.

| Canonical Pack ID | Region Scope | Key Sovereign Identifiers & Checksum Engines |
|---|---|---|
| **`global`** *(Always Active)* | Universal Baseline | Payment Cards (Luhn Mod-10), IBAN (ISO 7064 Mod-97-10), SWIFT/BIC, IPv4/IPv6, Crypto (BTC, ETH, SOL), API Keys, Emails, Phone Numbers (E.164), Contextual Names. |
| **`south_east_asia`** | 9 ASEAN Nations | **Singapore**: NRIC/FIN (Weighted Mod-11), UEN. **Malaysia**: MyKad (12-digit DOB/state parity), TIN. **Indonesia**: NIK (16-digit province/regency), NPWP. **Thailand**: National ID (Mod-11). **Vietnam**: CCCD (12-digit), MST. **Philippines**: PhilSys PCN, SSS, TIN. **Myanmar**: NRC. **Cambodia**: Khmer ID. |
| **`asia_non_sea`** | 12 Pan-Asian Nations | **India**: Aadhaar (Verhoeff D5), PAN, Voter ID, Passport, GSTIN (Mod-36), ABHA. **Japan**: My Number (Mod-11), Corporate Number. **South Korea**: RRN (Mod-11). **Taiwan**: National ID (Mod-10). **China**: Resident ID (ISO 7064 Mod 11-2). **Saudi Arabia**: National ID/Iqama (Luhn). **UAE**: Emirates ID (Luhn). **Israel**: Teudat Zehut (Luhn). **Turkey**: TCKN (Dual Mod-10). **Hong Kong**: HKID (Mod-11). |
| **`north_america`** | 4 Nations | **United States**: SSN (Area exclusions), ABA Routing (Fed Mod-10), Medicare MBI, NPI (Luhn), DEA Prescriber. **Canada**: SIN (Luhn Mod-10), OHIP Health (Luhn), BN. **Mexico**: CURP (Mod-10), RFC, NSS (Luhn Mod-10). **Dominican Republic**: Cédula (Luhn). |
| **`south_america`** | 12 Nations | **Brazil**: CPF (Two-stage Mod-11), CNPJ (Two-stage Mod-11). **Argentina**: CUIT/CUIL (Mod-11), DNI. **Chile**: RUN/RUT (Mod-11). **Colombia**: NIT (DIAN Mod-11), Cédula. **Peru**: RUC (Mod-11), DNI. **Ecuador**: Cédula (Mod-10). **Uruguay**: Cédula (Mod-10). |
| **`european_union`** | All 27 EU Nations | **Spain**: DNI/NIE (Mod-23). **Italy**: Codice Fiscale (Mod-26). **Poland**: PESEL (Mod-10), NIP (Mod-11). **Netherlands**: BSN (Elfproef). **Belgium**: RRN (Mod-97). **Germany**: Steuer-ID (Mod-11). **France**: NIR (Mod-97), SIREN (Luhn). **Sweden**: Personnummer (Luhn). **Austria**: SVNr (Mod-11). **Portugal**: NIF (Mod-11). |
| **`europe_non_eu`** | 6 Nations | **United Kingdom**: NHS Number (Mod-11), NINO, UTR. **Switzerland**: AHV/AVS (EAN-13), UID (Mod-11). **Norway**: Fødselsnummer (Dual Mod-11). **Iceland**: Kennitala (Mod-11). **Ukraine**: IPN (Mod-11). **Western Balkans**: JMBG/EMBG (Mod-11). |
| **`africa`** | 7 Nations | **South Africa**: ID (Luhn Mod-10), Tax Ref. **Egypt**: National ID (14-digit date/gov code). **Rwanda**: National ID (16-digit citizen indicator). **Kenya**: KRA PIN, National ID. **Ghana**: Ghana Card (`GHA-`), TIN. **Nigeria**: NIN, BVN. **Uganda**: NIN. **Tanzania**: NIDA. |
| **`oceania`** | 2 Nations | **Australia**: Tax File Number TFN (Mod-11), Medicare Card (Mod-10), Business Number ABN (Mod-89). **New Zealand**: IRD (Mod-11). |
| **`corporate`** | Enterprise & Health | Healthcare Medical Record Numbers (MRN), Invoices, Order IDs, Enterprise Project Codenames. |

---

## 🌍 Country-Wise Sovereign ID Coverage & Validation Engines

Coverage spans **109 Sovereign Jurisdictions across 9 Canonical Packs** (75+ with dedicated national ID checksums, plus universal coverage across 200+ countries for global financial and telecom formats):

| Jurisdiction | Pack ID | Sovereign Identifiers Protected | Validation Algorithm / Engine |
|---|---|---|---|
| **🌐 Global Universal** (200+ Countries) | `global` | Credit/Debit Cards, IBAN, SWIFT/BIC, IPv4/IPv6, Crypto (BTC, ETH, SOL), API Secrets | ISO 7064 Mod-97-10, Luhn Mod-10, Base58/Bech32, E.164, Regex AST |
| 🇸🇬 **Singapore** | `south_east_asia` | NRIC / FIN, UEN (Unique Entity Number) | Weighted Mod-11 with century prefix offsets (S, T, F, G, M) |
| 🇲🇾 **Malaysia** | `south_east_asia` | MyKad (National Registration Identity) | 12-digit DOB, state code & gender parity validation |
| 🇮🇩 **Indonesia** | `south_east_asia` | NIK (KTP Citizen ID), NPWP (Tax ID) | 16-digit provincial/DOB structure, 15-digit Tax Office algorithm |
| 🇹🇭 **Thailand** | `south_east_asia` | Thai National ID (บัตรประชาชน) | 13-digit weighted Mod-11 checksum formula |
| 🇻🇳 **Vietnam** | `south_east_asia` | CCCD (Citizen Identity Chip Card), MST (Tax) | 12-digit provincial/century/gender code & 10/13-digit tax verify |
| 🇵🇭 **Philippines** | `south_east_asia` | PhilSys PCN, SSS (Social Security Number) | 16-digit PhilID Luhn verification & 10-digit SSS checksum |
| 🇮🇳 **India** | `asia_non_sea` | Aadhaar, PAN, Voter ID, GSTIN | Verhoeff D5 Checksum (Aadhaar), Mod-36 (GSTIN), PAN Structure |
| 🇯🇵 **Japan** | `asia_non_sea` | My Number (マイナンバー 個人番号), Corporate No. | Weighted Mod-11 verification formula |
| 🇰🇷 **South Korea** | `asia_non_sea` | Resident Registration Number (RRN 주민등록번호) | 13-digit weighted Mod-11 checksum formula |
| 🇹🇼 **Taiwan** | `asia_non_sea` | National Identification Card (身分證字號) | Geographic letter-to-integer mapping & Mod-10 verification |
| 🇨🇳 **China** | `asia_non_sea` | Resident Identity Card (居民身份证) | 18-digit ISO 7064 Mod 11-2 check-code formula |
| 🇸🇦 **Saudi Arabia** | `asia_non_sea` | National ID (الهوية الوطنية), Iqama (إقامة) | 10-digit Luhn Mod-10 validation (1=Citizen, 2=Resident) |
| 🇦🇪 **United Arab Emirates** | `asia_non_sea` | Emirates ID Card (هوية مقيم) | 15-digit Luhn Mod-10 check on trailing sequence digit |
| 🇮🇱 **Israel** | `asia_non_sea` | Teudat Zehut (תעודת זהות) | 9-digit weighted Luhn Mod-10 checksum |
| 🇹🇷 **Turkey** | `asia_non_sea` | T.C. Kimlik No (TCKN) | 11-digit dual-stage Mod-10 checksum formula |
| 🇺🇸 **United States** | `north_america` | SSN, ABA Routing, Medicare MBI, NPI, DEA | Area exclusions, Federal Reserve Mod-10, Luhn, DEA Checksum |
| 🇨🇦 **Canada** | `north_america` | Social Insurance Number (SIN), Health OHIP | 9-digit Luhn Mod-10 (SIN), 10-digit Luhn (OHIP) |
| 🇲🇽 **Mexico** | `north_america` | CURP, RFC (Tax ID), NSS (Social Security) | 18-character Mod-10 (CURP), 11-digit Luhn Mod-10 (NSS) |
| 🇩🇴 **Dominican Republic** | `north_america` | Cédula de Identidad y Electoral | 11-digit Luhn Mod-10 checksum validation |
| 🇧🇷 **Brazil** | `south_america` | CPF (Cadastro de Pessoas Físicas), CNPJ | Dual-stage weighted Mod-11 algorithm (CPF & CNPJ) |
| 🇦🇷 **Argentina** | `south_america` | CUIT / CUIL, Documento Nacional de Identidad | 11-digit weighted Mod-11 verification formula |
| 🇨🇱 **Chile** | `south_america` | RUN / RUT (Rol Único Nacional) | Modulo 11 check digit verification (with 'K' remainder) |
| 🇨🇴 **Colombia** | `south_america` | NIT (Número de Identificación Tributaria) | DIAN 10-digit weighted prime Mod-11 verification |
| 🇪🇸 **Spain** | `european_union` | DNI (Documento Nacional de Identidad), NIE | 8-digit Modulo 23 letter-mapping table verification |
| 🇮🇹 **Italy** | `european_union` | Codice Fiscale (Tax Code) | 16-character alphanumeric odd/even parity Mod-26 check |
| 🇵🇱 **Poland** | `european_union` | PESEL (National ID), NIP (Tax Identification) | 11-digit weighted Mod-10 (PESEL) & Mod-11 (NIP) |
| 🇳🇱 **Netherlands** | `european_union` | Burgerservicenummer (BSN) | 9-digit 11-proof (Elfproef) weighted checksum algorithm |
| 🇧🇪 **Belgium** | `european_union` | Rijksregisternummer (RRN / Numéro National) | 11-digit ISO 7064 Modulo 97 verification algorithm |
| 🇩🇪 **Germany** | `european_union` | Steuer-ID (Steuerliche Identifikationsnummer) | 11-digit weighted Modulo 11 check digit algorithm |
| 🇫🇷 **France** | `european_union` | Numéro de Sécurité Sociale (NIR), SIREN | 15-digit Modulo 97 complement formula (NIR) & Luhn (SIREN) |
| 🇸🇪 **Sweden** | `european_union` | Personnummer (Personal Identity Number) | 10-digit Luhn Mod-10 checksum on birth & sequence fields |
| 🇬🇧 **United Kingdom** | `europe_non_eu` | NHS Number, National Insurance (NINO) | 10-digit weighted Mod-11 formula (NHS) & HMRC Prefix RegEx |
| 🇨🇭 **Switzerland** | `europe_non_eu` | AHV / AVS (Social Security), UID (Enterprise) | 13-digit EAN-13 weighted checksum (AHV) & Mod-11 (UID) |
| 🇳🇴 **Norway** | `europe_non_eu` | Fødselsnummer (National ID Number) | 11-digit dual-stage weighted Modulo 11 checksum verification |
| 🇺🇦 **Ukraine** | `europe_non_eu` | IPN (Individual Tax Number), EDRPOU | 10-digit weighted Modulo 11 formula |
| 🇿🇦 **South Africa** | `africa` | South African National ID Book / Smart Card | 13-digit Luhn Mod-10 verification on DOB & sequence digits |
| 🇪🇬 **Egypt** | `africa` | National ID (الرقم القومي) | 14-digit century, birthdate, and governorate code validation |
| 🇷🇼 **Rwanda** | `africa` | National ID (Indangamuntu) | 16-digit citizen indicator, birth year, and gender parity check |
| 🇰🇪 **Kenya** | `africa` | KRA PIN (Revenue Authority), National ID | 11-character alphanumeric structure [AP]\d{9}[A-Z] |
| 🇦🇺 **Australia** | `oceania` | Tax File Number (TFN), Medicare, ABN | Weighted Mod-11 (TFN), Mod-10 (Medicare), Mod-89 (ABN) |

---

## 🌱 Open-Source Sustainable Development (UN SDGs)

AI Privacy Core aligns directly with the official United Nations Sustainable Development Goals (SDGs) as open-source Digital Public Infrastructure:

### SDG Breakdown

#### 🏥 SDG 3: Good Health and Well-Being
- **Target 3.8 (Universal Healthcare Coverage)**: Scans for and tokenizes Protected Health Information (PHI) - Medical Record Numbers (MRN), National Prescriber Identifiers (NPI/DEA), clinical diagnostic codes, and healthcare beneficiary numbers (US Medicare MBI, Australian Medicare) - before clinical notes hit third-party LLMs.
- **Target 3.d (Health Risk Management)**: Enables researchers to feed raw clinical symptom sets and epidemiological case narratives through AI models, stripping personal patient indicators while preserving biomedical relationships for multi-jurisdiction disease modeling.

#### 📈 SDG 8: Decent Work and Economic Growth
- **Target 8.2 (Economic Productivity & Technological Upgrading)**: Provides a high-throughput, edge-native de-identification layer operating at sub-5ms latency, allowing developers to integrate generative AI into legacy backends without expensive infrastructure redesigns.
- **Target 8.10 (Universal Access to Financial Services)**: Algorithmic Mod-10 (Luhn) card validation, Mod-97 (ISO 7064) IBAN validation, and domestic banking routing checks (US ABA, Indian IFSC, SEPA) neutralize financial identifiers, enabling community banks and fintech startups to adopt AI while satisfying PCI-DSS standards.

#### 🏭 SDG 9: Industry, Innovation, and Infrastructure
- **Target 9.c (Access to Information & Communications Technology)**: Operates statelessly inside serverless edge isolates without requiring multi-gigabyte models, dedicated GPUs, or heavy container runtimes, democratizing enterprise-grade privacy protection in low-compute environments.
- **Target 9.5 (Encourage Domestic Innovation)**: Open-sources 67 mathematical checksum algorithms and pattern extractors under the permissive Apache-2.0 license, supplying foundational Digital Public Infrastructure (DPI) that local engineering ecosystems can independently inspect and run.

#### ⚖️ SDG 10: Reduced Inequalities
- **Target 10.2 (Promote Inclusion for All)**: Provides 185 sovereign identity and tax pattern checks covering 109 countries across 9 Canonical Packs, delivering out-of-the-box parity for nations across ASEAN, Africa, Latin America, and South Asia. Counteracts the systemic bias of legacy DLP tools that prioritize Western formats while neglecting Global South citizen identifiers.
- **Target 10.3 (Equal Opportunity & Reduced Inequalities)**: Distributes sovereign data privacy infrastructure at zero cost under an open standard, eliminating the multi-thousand-dollar licensing barriers imposed by legacy enterprise cybersecurity monopolies.

#### 🕊️ SDG 16: Peace, Justice, and Strong Institutions
- **Target 16.9 (Legal Identity for All & Registry Defense)**: Intercepts civil registration codes, national voter indices, and foundational citizen identification numbers across 75+ sovereign jurisdictions. Prevents national digital legal identities from leaking into commercial LLM training corpora or vector embeddings.
- **Target 16.10 (Public Access to Information & Fundamental Freedoms)**: Enforces cryptographic zero-retention through automated session destruction (`purgeAfterRead`) and client-side encryption options, defending the fundamental human right to digital privacy (UN Universal Declaration of Human Rights, Article 12).

### Summary Matrix

| UN SDG | Target Focus | Core Engine Mechanism | Practical Impact |
|---|---|---|---|
| **SDG 3** | `3.8, 3.d` | Intercepts PHI, MRN, NPI, and clinical identifiers before model ingress. | Enables HIPAA-compliant clinical AI adoption and cross-border research. |
| **SDG 8** | `8.2, 8.10` | Checksum validation for PCI-DSS cards, IBANs, and banking codes. | Lowers regulatory compliance barriers for early-stage fintechs and banks. |
| **SDG 9** | `9.c, 9.5` | Stateless sub-5ms edge isolate runtime; Apache-2.0 open-source release. | Delivers open Digital Public Infrastructure (DPI) without GPU/cloud lock-in. |
| **SDG 10** | `10.2, 10.3` | 185 rules across 109 countries covering ASEAN, Africa, and Latin America. | Eliminates Global South exclusion inherent in Western-centric legacy DLP tools. |
| **SDG 16** | `16.9, 16.10` | Reversible masking of sovereign IDs with cryptographic zero-retention (`purgeAfterRead`). | Protects national identity registries and defends privacy under UN Article 12. |

---

## 📜 License

Licensed under the **[Apache-2.0 License](LICENSE)**. Free, open, and transparent Digital Public Infrastructure for all developers.

---

## 🤝 Contributing & Security Disclosures

We welcome contributions, additional sovereign checksum validators, and regional pack expansions!

- **Contributing**: Please review [CONTRIBUTING.md](CONTRIBUTING.md) for code style, test requirements, and PR guidelines.
- **Reporting Vulnerabilities**: To report security issues or sensitive algorithmic bypasses, please open a private GitHub Security Advisory or contact the core maintainers directly. Do not file public issues for active vulnerabilities.
