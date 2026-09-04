# Contributing to AI Privacy Core

Thank you for your interest in contributing to **AI Privacy Core**! This project is an open-source, zero-trust Digital Public Infrastructure (DPI) designed to safeguard sovereign personal data in LLM pipelines.

---

## 🚀 Quick Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/PriyanujBoruah/AI-Privacy-Core.git
   cd AI-Privacy-Core/data-deidentification-engine
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Guidelines

We enforce a strict **100% test pass requirement** across all sovereign checksum algorithms and route handlers.

Run the test suite via Vitest:
```bash
npm test
```

### Adding New Sovereign Validators or Rules
When adding a new country ID validator or regional pattern rule:
1. Implement the mathematical algorithm under `src/tokenizer/validators/<region>.ts` with zero external runtime dependencies.
2. Register the rule under `src/tokenizer/patterns/<region>.ts` with its appropriate Canonical Pack ID.
3. **Mandatory Test Cases**: Add comprehensive test cases in `src/tokenizer/validators.test.ts` including:
   - Known valid sovereign IDs (positive tests).
   - Tampered check digits or invalid lengths (negative tests).
   - Edge cases (century boundary shifts, leap years, character set boundaries).
4. **ReDoS Safety**: Ensure new regex patterns contain no nested quantifiers or unanchored wildcards that can trigger catastrophic backtracking.

---

## 📐 Architecture & Performance Principles

- **Sub-5ms Latency SLA**: The engine executes in V8 edge isolates (Cloudflare Workers). Avoid heavy computational loops, backtracking regular expressions (ReDoS), or external network calls inside the tokenization path.
- **Zero-Dependency Core**: All checksum formulas (Luhn, Verhoeff, Mod-11, Mod-97, Mod-23, Mod-26, Elfproef) must remain pure TypeScript with zero npm package dependencies.
- **ASCII-Only Formatting**: To avoid encoding issues across international systems, ensure all code, documentation, headers, and list markers use plain standard hyphens (`-`) rather than non-ASCII dashes (no en-dashes or em-dashes).

---

## 🔄 Pull Request (PR) Process

1. **Create a branch**:
   ```bash
   git checkout -b feat/add-country-id-validator
   # or
   git checkout -b fix/resolve-checksum-edgecase
   ```
2. **Commit your changes**:
   Use descriptive, conventional commit messages:
   - `feat(validators): add Peru DNI checksum validation`
   - `fix(tokenizer): resolve boundary issue in French NIR regex`
   - `docs: update regional pack coverage table`
3. **Verify tests locally**:
   Ensure `npm test` runs with 0 errors before pushing.
4. **Submit your PR**:
   - Provide a clear summary of what was added or fixed.
   - Reference official government or ISO specification documentation for any new sovereign ID formula.

---

## 🔒 Security Disclosures

Please **do not** file public GitHub issues for active security vulnerabilities or algorithmic bypasses. Review our security reporting guidelines or email `boruahpriyanuj2004@gmail.com` directly.
