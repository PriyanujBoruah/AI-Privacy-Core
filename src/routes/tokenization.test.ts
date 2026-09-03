import { describe, it, expect, vi, beforeEach } from "vitest";
import tokenizationApp from "./tokenization";
import { Hono } from "hono";

describe("Data De-identification & Reversible Tokenization Engine Routes", () => {
  let app: Hono;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono();
    app.route("/v1", tokenizationApp);
  });

  it("should process POST /v1/tokenize and POST /v1/detokenize workflow", async () => {
    const tokenizeRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Contact Jane Doe (email: jane.d@enterprise.org, SSN: 123-45-6789) under ProjectApollo.",
        categories: ["north_america"],
        customKeywords: ["ProjectApollo"],
        ttlSeconds: 600,
      }),
    });

    expect(tokenizeRes.status).toBe(200);
    const tokData: any = await tokenizeRes.json();

    expect(tokData.sessionId).toMatch(/^sess_tok_/);
    expect(tokData.sanitizedText).toContain("EMAIL_1");
    expect(tokData.sanitizedText).toContain("SSN_1");

    // Detokenize test
    const detokenizeRes = await app.request("/v1/detokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: tokData.sessionId,
        tokenizedText: "User EMAIL_1 verified.",
        purgeAfterRead: false,
      }),
    });

    expect(detokenizeRes.status).toBe(200);
    const detokData: any = await detokenizeRes.json();

    expect(detokData.rehydratedText).toBe("User jane.d@enterprise.org verified.");
    expect(detokData.tokensResolved).toBe(1);
    expect(detokData.sessionStatus).toBe("active");
  });

  it("should return 400 when text is missing in POST /v1/tokenize", async () => {
    const res = await app.request("/v1/tokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.message).toContain("Field 'text' is required");
  });

  it("should return 400 when parameters missing in POST /v1/detokenize", async () => {
    const res = await app.request("/v1/detokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: "sess_123" }),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.message).toContain("Fields 'sessionId' and 'tokenizedText' are required");
  });

  it("should return 400 when exceeding 2 Canonical Pack IDs in POST /v1/tokenize", async () => {
    const res = await app.request("/v1/tokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Sample text",
        categories: [
          "north_america",
          "south_east_asia",
          "european_union",
        ],
      }),
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.type).toBe("category_limit_exceeded");
    expect(data.error.message).toContain("Maximum of 2 Canonical Pack IDs allowed");
  });
});
