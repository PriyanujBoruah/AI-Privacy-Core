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

  it("should support activating all Canonical Pack IDs simultaneously via categories: ['all']", async () => {
    const res = await app.request("/v1/tokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Sample text",
        categories: ["all"],
      }),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.categoriesApplied.length).toBeGreaterThanOrEqual(10);
  });

  it("should sanitize and rehydrate social handles (@handle) and contextual usernames", async () => {
    const promptText = "Please contact @sprintcare or message Username: jdoe_42 regarding issue @115712.";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: promptText,
        mode: "structural",
      }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).toContain("USERNAME_1");
    expect(tokData.sanitizedText).toContain("USERNAME_2");
    expect(tokData.sanitizedText).toContain("USERNAME_3");
    expect(tokData.sanitizedText).not.toContain("@sprintcare");
    expect(tokData.sanitizedText).not.toContain("jdoe_42");
    expect(tokData.sanitizedText).not.toContain("@115712");

    // Rehydrate
    const detokRes = await app.request("/v1/detokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: tokData.sessionId,
        tokenizedText: tokData.sanitizedText,
      }),
    });

    expect(detokRes.status).toBe(200);
    const detokData: any = await detokRes.json();
    expect(detokData.rehydratedText).toBe(promptText);
    expect(detokData.tokensResolved).toBe(3);
  });

  it("should not falsely match code decorators or CSS at-rules as usernames", async () => {
    const codeSnippet = "Use @media (min-width: 600px) and @override with @param for @tailwind utilities.";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: codeSnippet }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).toBe(codeSnippet);
    expect(tokData.entitiesCount).toBe(0);
  });

  it("should support FPE synthetic mock mode for usernames", async () => {
    const promptText = "Tweet sent to @sprintcare by user: alice99";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: promptText,
        mode: "fpe",
      }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).not.toContain("@sprintcare");
    expect(tokData.sanitizedText).not.toContain("alice99");
    expect(tokData.sanitizedText).toMatch(/@user_\w+/);
  });

  it("should not match phone numbers inside alphanumeric tracking numbers and preserve exact roundtrip", async () => {
    const trackingText = "@UPSHelp package tracks as delivered, but did not receive. Need for school project! 1ZR5427A0294522617";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trackingText,
        categories: ["all"],
      }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).not.toContain("PHONE");
    expect(tokData.sanitizedText).toContain("TRACKING_1");

    const detokRes = await app.request("/v1/detokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: tokData.sessionId,
        tokenizedText: tokData.sanitizedText,
        purgeAfterRead: true,
      }),
    });

    expect(detokRes.status).toBe(200);
    const detokData: any = await detokRes.json();
    expect(detokData.rehydratedText).toBe(trackingText);
  });

  it("should sanitize and rehydrate universal UUIDs, contextual IDs, MAC addresses, and tokens", async () => {
    const text = "Device 00:1A:2B:3C:4D:5E with UUID c0245082-f472-4663-8f0a-3a2416b9b32e, Account ID: ACCT-9481902 and Bearer secret_token_xyz_12345678901234567890";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        categories: ["all"],
      }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).toContain("MAC_1");
    expect(tokData.sanitizedText).toContain("UUID_1");
    expect(tokData.sanitizedText).toContain("ID_1");
    expect(tokData.sanitizedText).toContain("TOKEN_1");

    const detokRes = await app.request("/v1/detokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: tokData.sessionId,
        tokenizedText: tokData.sanitizedText,
        purgeAfterRead: true,
      }),
    });

    expect(detokRes.status).toBe(200);
    const detokData: any = await detokRes.json();
    expect(detokData.rehydratedText).toBe(text);
  });

  it("should prioritize sovereign country ID checkers over bottom-priority universal checkers", async () => {
    // US SSN with 'ID:' prefix: Sovereign SSN checker (priority 10) must win over universal ID checker (priority 1)
    const text = "National ID: 123-45-6789";
    const tokRes = await app.request("/v1/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        categories: ["all"],
      }),
    });

    expect(tokRes.status).toBe(200);
    const tokData: any = await tokRes.json();
    expect(tokData.sanitizedText).toContain("SSN_1");

    const detokRes = await app.request("/v1/detokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: tokData.sessionId,
        tokenizedText: tokData.sanitizedText,
        purgeAfterRead: true,
      }),
    });

    expect(detokRes.status).toBe(200);
    const detokData: any = await detokRes.json();
    expect(detokData.rehydratedText).toBe(text);
  });
});
