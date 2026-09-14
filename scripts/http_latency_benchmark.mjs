import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { Pool } from "undici";
import { getRequestListener } from "@hono/node-server";
import { parquetRead, parquetMetadataAsync } from "hyparquet";
import { compressors } from "hyparquet-compressors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_PARQUET = path.join(ROOT_DIR, "Prompt Test Sets", "unified_prompts.parquet");
const DEFAULT_CACHE_FILE = path.join(ROOT_DIR, "Prompt Test Sets", "sampled_50k_prompts.json");
const CERTS_DIR = path.join(ROOT_DIR, "certs");
const KEY_PATH = path.join(CERTS_DIR, "key.pem");
const CERT_PATH = path.join(CERTS_DIR, "cert.pem");
const DIST_SERVER = path.join(ROOT_DIR, "dist", "server.mjs");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    samples: 50000,
    concurrency: 30,
    parquetPath: DEFAULT_PARQUET,
    cacheFile: DEFAULT_CACHE_FILE,
    url: null, // If null, spin up internal HTTPS server
    port: 8443,
    out: path.join(ROOT_DIR, "http_latency_benchmark_summary.json"),
    mode: "structural",
    categories: ["all"],
    noCache: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--samples" && args[i + 1]) {
      options.samples = parseInt(args[++i], 10);
    } else if (arg === "--concurrency" && args[i + 1]) {
      options.concurrency = parseInt(args[++i], 10);
    } else if (arg === "--parquet" && args[i + 1]) {
      options.parquetPath = path.resolve(args[++i]);
    } else if (arg === "--url" && args[i + 1]) {
      options.url = args[++i];
    } else if (arg === "--port" && args[i + 1]) {
      options.port = parseInt(args[++i], 10);
    } else if (arg === "--out" && args[i + 1]) {
      options.out = path.resolve(args[++i]);
    } else if (arg === "--no-cache") {
      options.noCache = true;
    }
  }

  return options;
}

function ensureCerts() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return;
  }
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }
  console.log("Generating self-signed TLS certificates with OpenSSL...");
  const opensslPath = "C:\\Program Files\\Git\\usr\\bin\\openssl.exe";
  const cmd = fs.existsSync(opensslPath) ? `"${opensslPath}"` : "openssl";
  execSync(
    `${cmd} req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365`,
    { stdio: "pipe" }
  );
}

function ensureServerBundle() {
  if (!fs.existsSync(DIST_SERVER)) {
    console.log("Building dist/server.mjs bundle...");
    execSync("npx esbuild src/index.ts --bundle --format=esm --platform=node --outfile=dist/server.mjs", {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
  }
}

async function loadOrSamplePrompts(parquetPath, cacheFile, targetCount, noCache) {
  if (!noCache && fs.existsSync(cacheFile)) {
    console.log(`Loading cached sample prompts from: ${cacheFile}`);
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      if (Array.isArray(data) && data.length >= targetCount) {
        console.log(`Successfully loaded ${data.length} prompts from cache.`);
        return data.slice(0, targetCount);
      }
    } catch (e) {
      console.warn(`Cache read error: ${e.message}. Resampling from parquet...`);
    }
  }

  console.log(`Sampling ${targetCount} random prompts uniformly across: ${parquetPath}`);
  const t0 = performance.now();

  const fd = fs.openSync(parquetPath, "r");
  const fileSize = fs.statSync(parquetPath).size;
  const asyncBuffer = {
    byteLength: fileSize,
    slice: (start, end) =>
      new Promise((resolve, reject) => {
        const len = end - start;
        const buf = Buffer.alloc(len);
        try {
          fs.readSync(fd, buf, 0, len, start);
          resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + len));
        } catch (err) {
          reject(err);
        }
      }),
  };

  const meta = await parquetMetadataAsync(asyncBuffer);
  const totalRows = Number(meta.num_rows);
  console.log(`Total rows in dataset: ${totalRows.toLocaleString()} across ${meta.row_groups.length} row groups.`);

  // Generate unique random indices
  const pickedIndices = new Set();
  while (pickedIndices.size < targetCount) {
    pickedIndices.add(Math.floor(Math.random() * totalRows));
  }

  // Group indices by row group
  const byRowGroup = new Map();
  for (const idx of pickedIndices) {
    const rg = Math.floor(idx / 100000);
    const local = idx % 100000;
    if (!byRowGroup.has(rg)) byRowGroup.set(rg, []);
    byRowGroup.get(rg).push(local);
  }

  const sampled = [];
  for (let rg = 0; rg < meta.row_groups.length; rg++) {
    const indices = byRowGroup.get(rg);
    if (!indices || indices.length === 0) continue;

    const rowStart = rg * 100000;
    const rowEnd = Math.min(rowStart + 100000, totalRows);

    await parquetRead({
      file: asyncBuffer,
      columns: ["Prompt"],
      compressors,
      rowStart,
      rowEnd,
      onComplete: (rows) => {
        for (const localIdx of indices) {
          const p = rows[localIdx]?.[0];
          if (p && typeof p === "string" && p.trim().length > 0) {
            sampled.push(p);
          }
        }
      },
    });
  }

  fs.closeSync(fd);
  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.log(`Sampled ${sampled.length.toLocaleString()} prompts in ${elapsed}s.`);

  // Cache to disk
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(sampled), "utf-8");
    console.log(`Saved sampled prompts to cache: ${cacheFile}`);
  } catch (err) {
    console.warn(`Failed to write cache: ${err.message}`);
  }

  return sampled.slice(0, targetCount);
}

function calculatePercentiles(arr) {
  if (!arr || arr.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, p999: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const getP = (p) => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  };
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    p50: getP(50),
    p90: getP(90),
    p95: getP(95),
    p99: getP(99),
    p999: getP(99.9),
  };
}

async function startInternalServer(port) {
  ensureCerts();
  ensureServerBundle();

  const key = fs.readFileSync(KEY_PATH);
  const cert = fs.readFileSync(CERT_PATH);

  const { default: app } = await import(`file://${DIST_SERVER}`);
  const handler = getRequestListener(app.fetch);

  const server = https.createServer({ key, cert }, handler);

  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve();
    });
  });

  return server;
}

async function runBenchmark() {
  const options = parseArgs();

  console.log("=".repeat(75));
  console.log("   DATA DE-IDENTIFICATION & REVERSIBLE TOKENIZATION ENGINE");
  console.log("          REAL-WORLD HTTPS LATENCY & FIDELITY BENCHMARK");
  console.log("=".repeat(75));
  console.log(`Target Samples:       ${options.samples.toLocaleString()} prompts`);
  console.log(`Concurrency Streams:  ${options.concurrency} parallel connections`);
  console.log(`Parquet Source:       ${options.parquetPath}`);
  console.log(`Mode:                 ${options.mode}`);
  console.log(`Categories:           ${options.categories.join(", ")}`);

  let internalServer = null;
  let targetUrl = options.url;

  if (!targetUrl) {
    console.log(`\nSpinning up high-speed internal HTTPS server on 127.0.0.1:${options.port}...`);
    internalServer = await startInternalServer(options.port);
    targetUrl = `https://127.0.0.1:${options.port}`;
    console.log(`Internal TLS 1.3 server listening on: ${targetUrl}`);
  } else {
    console.log(`\nConnecting to external target URL: ${targetUrl}`);
  }

  // Load / sample prompts
  const prompts = await loadOrSamplePrompts(
    options.parquetPath,
    options.cacheFile,
    options.samples,
    options.noCache
  );

  const totalPrompts = prompts.length;
  console.log(`\nReady to benchmark ${totalPrompts.toLocaleString()} prompts against ${targetUrl}...`);

  const pool = new Pool(targetUrl, {
    connections: options.concurrency,
    pipelining: 1,
    connect: { rejectUnauthorized: false },
  });

  // Warmup run: 20 prompts
  console.log("Performing server warmup (20 prompts)...");
  for (let w = 0; w < 20; w++) {
    const sample = prompts[w % totalPrompts];
    const tokRes = await pool.request({
      path: "/v1/tokenize",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sample, categories: options.categories, mode: options.mode }),
    });
    const tokData = await tokRes.body.json();
    const detokRes = await pool.request({
      path: "/v1/detokenize",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: tokData.sessionId, tokenizedText: tokData.sanitizedText }),
    });
    await detokRes.body.json();
  }
  console.log("Warmup complete. Commencing official benchmark run...\n");

  // Metrics storage
  const tokenizeLatencies = new Float64Array(totalPrompts);
  const detokenizeLatencies = new Float64Array(totalPrompts);
  const totalLatencies = new Float64Array(totalPrompts);

  let exactMatches = 0;
  let mismatches = [];
  let errors = [];
  let totalEntitiesCount = 0;
  let totalTokensEst = 0;

  let processedCount = 0;
  const milestoneStep = Math.max(100, Math.floor(totalPrompts / 20)); // Every 5%
  let nextMilestone = milestoneStep;

  const tStart = performance.now();
  let lastMilestoneTime = tStart;
  let lastMilestoneCount = 0;

  // Work distribution
  let promptIndex = 0;

  async function worker(workerId) {
    while (true) {
      const idx = promptIndex++;
      if (idx >= totalPrompts) break;

      const prompt = prompts[idx];
      const estTokens = Math.ceil(prompt.length / 4);
      totalTokensEst += estTokens;

      try {
        // 1. POST /v1/tokenize
        const t0Tok = performance.now();
        const tokRes = await pool.request({
          path: "/v1/tokenize",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt, categories: options.categories, mode: options.mode }),
        });
        const tokData = await tokRes.body.json();
        const t1Tok = performance.now();
        const tokLatency = t1Tok - t0Tok;

        if (tokRes.statusCode !== 200 || !tokData.sessionId) {
          errors.push({ idx, stage: "tokenize", status: tokRes.statusCode, error: tokData.error });
          continue;
        }

        totalEntitiesCount += tokData.entitiesCount || 0;

        // 2. POST /v1/detokenize
        const t0Detok = performance.now();
        const detokRes = await pool.request({
          path: "/v1/detokenize",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: tokData.sessionId, tokenizedText: tokData.sanitizedText }),
        });
        const detokData = await detokRes.body.json();
        const t1Detok = performance.now();
        const detokLatency = t1Detok - t0Detok;

        if (detokRes.statusCode !== 200 || detokData.rehydratedText === undefined) {
          errors.push({ idx, stage: "detokenize", status: detokRes.statusCode, error: detokData.error });
          continue;
        }

        const roundtripLatency = tokLatency + detokLatency;

        tokenizeLatencies[idx] = tokLatency;
        detokenizeLatencies[idx] = detokLatency;
        totalLatencies[idx] = roundtripLatency;

        // 3. Verification
        if (detokData.rehydratedText === prompt) {
          exactMatches++;
        } else {
          mismatches.push({
            idx,
            original: prompt.slice(0, 120),
            rehydrated: detokData.rehydratedText?.slice(0, 120),
          });
        }
      } catch (err) {
        errors.push({ idx, error: err.message });
      } finally {
        processedCount++;
        if (processedCount >= nextMilestone || processedCount === totalPrompts) {
          const now = performance.now();
          const batchCount = processedCount - lastMilestoneCount;
          const batchTimeSec = (now - lastMilestoneTime) / 1000;
          const batchRps = (batchCount / batchTimeSec).toFixed(1);
          const batchHttpRps = ((batchCount * 2) / batchTimeSec).toFixed(1);
          const percent = ((processedCount / totalPrompts) * 100).toFixed(0);

          // Calculate slice percentiles
          const recentTok = tokenizeLatencies.subarray(lastMilestoneCount, processedCount);
          const recentDetok = detokenizeLatencies.subarray(lastMilestoneCount, processedCount);
          const recentTot = totalLatencies.subarray(lastMilestoneCount, processedCount);

          const pTot = calculatePercentiles(Array.from(recentTot));
          const pTok = calculatePercentiles(Array.from(recentTok));
          const pDetok = calculatePercentiles(Array.from(recentDetok));

          console.log(
            `[${percent.padStart(3)}%] ${processedCount.toLocaleString().padStart(6)} / ${totalPrompts.toLocaleString()} | ` +
            `Throughput: ${batchRps.padStart(6)} prompts/s (${batchHttpRps.padStart(7)} req/s) | ` +
            `Tot p50: ${pTot.p50.toFixed(2)}ms (p95: ${pTot.p95.toFixed(2)}ms, p99: ${pTot.p99.toFixed(2)}ms) | ` +
            `Fidelity: ${((exactMatches / processedCount) * 100).toFixed(2)}%`
          );

          lastMilestoneCount = processedCount;
          lastMilestoneTime = now;
          nextMilestone += milestoneStep;
        }
      }
    }
  }

  console.log("-".repeat(75));
  console.log("Starting concurrency workers...");
  const workers = Array.from({ length: options.concurrency }, (_, i) => worker(i));
  await Promise.all(workers);
  const tEnd = performance.now();
  console.log("-".repeat(75));

  const totalTimeSec = (tEnd - tStart) / 1000;
  const promptRps = totalPrompts / totalTimeSec;
  const httpRps = (totalPrompts * 2) / totalTimeSec;
  const tokenRps = totalTokensEst / totalTimeSec;

  const validTok = Array.from(tokenizeLatencies).filter((v) => v > 0);
  const validDetok = Array.from(detokenizeLatencies).filter((v) => v > 0);
  const validTot = Array.from(totalLatencies).filter((v) => v > 0);

  const tokStats = calculatePercentiles(validTok);
  const detokStats = calculatePercentiles(validDetok);
  const totStats = calculatePercentiles(validTot);

  const fidelityRate = (exactMatches / totalPrompts) * 100;

  console.log("\n" + "=".repeat(75));
  console.log("                    FINAL BENCHMARK RESULTS");
  console.log("=".repeat(75));
  console.log(`Total Prompts Tested:     ${totalPrompts.toLocaleString()}`);
  console.log(`Total HTTPS Requests:     ${(totalPrompts * 2).toLocaleString()} requests`);
  console.log(`Total Elapsed Time:       ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`Overall Prompt Speed:     ${promptRps.toFixed(2)} prompts / sec`);
  console.log(`Overall Network RPS:      ${httpRps.toFixed(2)} HTTP requests / sec`);
  console.log(`Estimated Token Speed:    ${tokenRps.toFixed(0)} tokens / sec`);
  console.log(`Total Entities Sanitized: ${totalEntitiesCount.toLocaleString()}`);
  console.log(`Exact Roundtrip Matches:  ${exactMatches.toLocaleString()} / ${totalPrompts.toLocaleString()} (${fidelityRate.toFixed(4)}%)`);
  console.log(`Roundtrip Mismatches:     ${mismatches.length}`);
  console.log(`HTTP / Socket Errors:     ${errors.length}`);

  console.log("\n" + "-".repeat(75));
  console.log("               REAL-WORLD LATENCY PERCENTILE DISTRIBUTION");
  console.log("-".repeat(75));
  console.log("Metric             Min        Avg       p50 (Med)    p90        p95        p99       p99.9       Max");
  console.log("-".repeat(75));

  const formatRow = (name, s) => {
    return (
      `${name.padEnd(16)} ` +
      `${s.min.toFixed(2).padStart(7)}ms ` +
      `${s.mean.toFixed(2).padStart(7)}ms ` +
      `${s.p50.toFixed(2).padStart(8)}ms ` +
      `${s.p90.toFixed(2).padStart(7)}ms ` +
      `${s.p95.toFixed(2).padStart(7)}ms ` +
      `${s.p99.toFixed(2).padStart(7)}ms ` +
      `${s.p999.toFixed(2).padStart(7)}ms ` +
      `${s.max.toFixed(2).padStart(8)}ms`
    );
  };

  console.log(formatRow("Tokenize POST", tokStats));
  console.log(formatRow("Detokenize POST", detokStats));
  console.log(formatRow("Total Roundtrip", totStats));
  console.log("-".repeat(75));

  const summary = {
    timestamp: new Date().toISOString(),
    targetUrl,
    totalPrompts,
    totalRequests: totalPrompts * 2,
    concurrency: options.concurrency,
    durationSeconds: totalTimeSec,
    throughput: {
      promptsPerSecond: promptRps,
      requestsPerSecond: httpRps,
      tokensPerSecond: tokenRps,
    },
    fidelity: {
      exactMatches,
      totalPrompts,
      accuracyRate: fidelityRate,
      mismatchCount: mismatches.length,
      errorCount: errors.length,
    },
    latencyDistribution: {
      tokenizeMs: tokStats,
      detokenizeMs: detokStats,
      totalRoundtripMs: totStats,
    },
    mismatches: mismatches.slice(0, 10),
    errors: errors.slice(0, 10),
  };

  fs.writeFileSync(options.out, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nBenchmark summary successfully saved to: ${options.out}`);
  console.log("=".repeat(75));

  await pool.close();
  if (internalServer) {
    await new Promise((resolve) => internalServer.close(resolve));
    console.log("Internal HTTPS server shut down cleanly.");
  }

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed with uncaught exception:", err);
  process.exit(1);
});
