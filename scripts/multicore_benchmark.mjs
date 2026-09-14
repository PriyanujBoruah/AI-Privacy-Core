import { Worker } from "worker_threads";
import os from "os";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { parquetMetadataAsync } from "hyparquet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const WORKER_SCRIPT = path.join(__dirname, "multicore_worker.mjs");
const DEFAULT_PARQUET = path.join(ROOT_DIR, "Prompt Test Sets", "unified_prompts.parquet");
const DIST_ENGINE = path.join(ROOT_DIR, "dist", "engine.mjs");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    parquetPath: DEFAULT_PARQUET,
    workers: Math.max(1, Math.min(os.cpus().length, 8)),
    limit: null,
    chunkSize: 50000,
    categories: ["all"],
    mode: "structural",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === "--workers" && args[i + 1]) {
      options.workers = parseInt(args[++i], 10);
    } else if (arg === "--chunk-size" && args[i + 1]) {
      options.chunkSize = parseInt(args[++i], 10);
    } else if (arg === "--file" && args[i + 1]) {
      options.parquetPath = path.resolve(args[++i]);
    } else if (arg === "--mode" && args[i + 1]) {
      options.mode = args[++i];
    }
  }

  return options;
}

function ensureEngineBundle() {
  const srcDir = path.join(ROOT_DIR, "src", "tokenizer");
  let rebuild = !fs.existsSync(DIST_ENGINE);

  if (!rebuild) {
    const distMtime = fs.statSync(DIST_ENGINE).mtimeMs;
    const checkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) checkDir(full);
        else if (ent.name.endsWith(".ts") && fs.statSync(full).mtimeMs > distMtime) {
          rebuild = true;
          return;
        }
      }
    };
    checkDir(srcDir);
  }

  if (rebuild) {
    process.stdout.write("Compiling engine.ts via esbuild...\n");
    execSync(
      `npx esbuild src/tokenizer/engine.ts --bundle --format=esm --platform=node --outfile=dist/engine.mjs`,
      { cwd: ROOT_DIR, stdio: "inherit" }
    );
  }
}

async function getParquetRowCount(filePath) {
  const fd = fs.openSync(filePath, "r");
  const size = fs.statSync(filePath).size;
  const asyncBuffer = {
    byteLength: size,
    slice: (start, end) =>
      new Promise((resolve, reject) => {
        const len = end - start;
        const buf = Buffer.alloc(len);
        try {
          fs.readSync(fd, buf, 0, len, start);
          resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + len));
        } catch (e) {
          reject(e);
        }
      }),
  };

  const meta = await parquetMetadataAsync(asyncBuffer);
  fs.closeSync(fd);
  return Number(meta.num_rows);
}

function computePercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

async function main() {
  const options = parseArgs();
  ensureEngineBundle();

  if (!fs.existsSync(options.parquetPath)) {
    console.error(`Error: Parquet file not found at ${options.parquetPath}`);
    process.exit(1);
  }

  process.stdout.write(`Analyzing Parquet metadata: ${options.parquetPath} ...\n`);
  const totalInFile = await getParquetRowCount(options.parquetPath);
  const targetTotal = options.limit ? Math.min(options.limit, totalInFile) : totalInFile;

  console.log(`======================================================================`);
  console.log(`       AI PRIVACY CORE - MULTI-CORE HIGH-SPEED BATCH RUNNER           `);
  console.log(`======================================================================`);
  console.log(`• Total Prompts to Process : ${targetTotal.toLocaleString()}`);
  console.log(`• CPU Cores / Workers      : ${options.workers}`);
  console.log(`• Chunk Size               : ${options.chunkSize.toLocaleString()} prompts/chunk`);
  console.log(`• Mode                     : ${options.mode}`);
  console.log(`• Categories               : ${JSON.stringify(options.categories)}`);
  console.log(`----------------------------------------------------------------------\n`);

  // Build chunk list
  const chunks = [];
  let chunkIdx = 0;
  for (let start = 0; start < targetTotal; start += options.chunkSize) {
    const end = Math.min(start + options.chunkSize, targetTotal);
    chunks.push({
      chunkIndex: chunkIdx++,
      rowStart: start,
      rowEnd: end,
      filePath: options.parquetPath,
      categories: options.categories,
      mode: options.mode,
    });
  }

  const startTime = performance.now();
  let totalProcessed = 0;
  let totalEntities = 0;
  let totalTokens = 0;
  const globalEntityCounts = {};
  const allMismatches = [];
  const latencySamples = [];

  let nextChunkIdx = 0;
  let nextMilestonePct = 5.0;

  await new Promise((resolve, reject) => {
    let activeWorkers = 0;
    const workers = [];

    const assignNextChunk = (worker) => {
      if (nextChunkIdx < chunks.length) {
        const chunk = chunks[nextChunkIdx++];
        worker.postMessage({ type: "PROCESS_CHUNK", ...chunk });
      } else {
        worker.terminate();
        activeWorkers--;
        if (activeWorkers === 0) {
          resolve();
        }
      }
    };

    for (let w = 0; w < options.workers; w++) {
      const worker = new Worker(WORKER_SCRIPT);
      activeWorkers++;
      workers.push(worker);

      worker.on("message", (msg) => {
        if (msg.type === "READY") {
          assignNextChunk(worker);
          return;
        }

        if (msg.type === "CHUNK_DONE") {
          totalProcessed += msg.totalProcessed;
          totalEntities += msg.totalEntities;
          totalTokens += msg.totalTokens;

          for (const [type, count] of Object.entries(msg.entityCountsByType)) {
            globalEntityCounts[type] = (globalEntityCounts[type] || 0) + count;
          }

          if (msg.mismatches && msg.mismatches.length > 0) {
            allMismatches.push(...msg.mismatches);
          }

          if (msg.latencies) {
            latencySamples.push(...msg.latencies);
          }

          const elapsedSec = (performance.now() - startTime) / 1000;
          const currentThroughput = totalProcessed / Math.max(0.001, elapsedSec);
          const currentPct = (totalProcessed / targetTotal) * 100;

          // Milestone check at every 5%
          while (currentPct >= nextMilestonePct && nextMilestonePct <= 100.0) {
            const milestoneLog = `  [${nextMilestonePct.toFixed(1).padStart(5)}%] ${totalProcessed.toLocaleString().padStart(10)}/${targetTotal.toLocaleString()} prompts (${currentThroughput.toFixed(0).padStart(6)} prompts/sec) | Mismatches: ${allMismatches.length}`;
            console.log(milestoneLog);
            try {
              fs.writeFileSync(
                path.join(ROOT_DIR, "multicore_progress.json"),
                JSON.stringify({
                  pct: nextMilestonePct,
                  processed: totalProcessed,
                  total: targetTotal,
                  throughput: Math.round(currentThroughput),
                  mismatches: allMismatches.length,
                  elapsedSec: Math.round(elapsedSec),
                  log: milestoneLog
                }, null, 2),
                "utf-8"
              );
            } catch (_) {}
            nextMilestonePct += 5.0;
          }

          assignNextChunk(worker);
        } else if (msg.type === "CHUNK_ERROR") {
          console.error(`Chunk error in chunk ${msg.chunkIndex}:`, msg.error);
          assignNextChunk(worker);
        }
      });

      worker.on("error", (err) => {
        console.error(`Worker thread error:`, err);
        activeWorkers--;
        if (activeWorkers === 0) reject(err);
      });

      worker.postMessage({ type: "INIT", filePath: options.parquetPath });
    }
  });

  const totalElapsedSec = (performance.now() - startTime) / 1000;
  const overallThroughput = totalProcessed / Math.max(0.001, totalElapsedSec);
  const exactMatches = totalProcessed - allMismatches.length;
  const fidelityRate = (exactMatches / Math.max(1, totalProcessed)) * 100;

  // Latency metrics
  const avgLatency = latencySamples.length > 0 ? latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length : 0;
  const p50 = computePercentile(latencySamples, 50);
  const p90 = computePercentile(latencySamples, 90);
  const p95 = computePercentile(latencySamples, 95);
  const p99 = computePercentile(latencySamples, 99);

  console.log(`\n======================================================================`);
  console.log(`           MULTI-CORE DATASET BENCHMARK COMPLETE REPORT               `);
  console.log(`======================================================================`);
  console.log(`Execution Overview:`);
  console.log(`  • Total Prompts Tested       : ${totalProcessed.toLocaleString()}`);
  console.log(`  • Exact Roundtrip Matches    : ${exactMatches.toLocaleString()} (${fidelityRate.toFixed(4)}%)`);
  console.log(`  • Roundtrip Mismatches       : ${allMismatches.length.toLocaleString()}`);
  console.log(`  • Total Time Elapsed         : ${totalElapsedSec.toFixed(2)} s (${(totalElapsedSec / 60).toFixed(2)} min)`);
  console.log(`  • Overall Multi-Core Speed   : ${overallThroughput.toFixed(1)} prompts/sec`);
  console.log(`  • Total Tokens Analyzed      : ${totalTokens.toLocaleString()}`);

  console.log(`\nPII & Sovereign ID Detection Metrics:`);
  console.log(`  • Total Entity Instances     : ${totalEntities.toLocaleString()}`);
  const topEntities = Object.entries(globalEntityCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
  for (const [type, count] of topEntities) {
    console.log(`      - ${type.padEnd(26)} : ${count.toLocaleString()}`);
  }

  console.log(`\nEngine Processing Latency (In-Memory Microseconds/Milliseconds):`);
  console.log(`  • Average Latency            : ${avgLatency.toFixed(3)} ms`);
  console.log(`  • Median (p50)               : ${p50.toFixed(3)} ms`);
  console.log(`  • 90th Percentile (p90)      : ${p90.toFixed(3)} ms`);
  console.log(`  • 95th Percentile (p95)      : ${p95.toFixed(3)} ms`);
  console.log(`  • 99th Percentile (p99)      : ${p99.toFixed(3)} ms`);
  console.log(`======================================================================`);

  // Export report summary
  const summaryPath = path.join(ROOT_DIR, "multicore_benchmark_summary.json");
  const summaryData = {
    execution_overview: {
      total_prompts_tested: totalProcessed,
      exact_roundtrip_matches: exactMatches,
      fidelity_rate_pct: parseFloat(fidelityRate.toFixed(4)),
      mismatches_count: allMismatches.length,
      total_time_seconds: parseFloat(totalElapsedSec.toFixed(2)),
      total_time_minutes: parseFloat((totalElapsedSec / 60).toFixed(2)),
      overall_throughput_prompts_per_sec: parseFloat(overallThroughput.toFixed(1)),
      total_tokens_tested: totalTokens,
      workers_count: options.workers,
    },
    entity_metrics: {
      total_entities_detected: totalEntities,
      entity_breakdown: globalEntityCounts,
    },
    latency_ms: {
      avg: parseFloat(avgLatency.toFixed(3)),
      p50: parseFloat(p50.toFixed(3)),
      p90: parseFloat(p90.toFixed(3)),
      p95: parseFloat(p95.toFixed(3)),
      p99: parseFloat(p99.toFixed(3)),
    },
    mismatches: allMismatches.slice(0, 20),
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2), "utf-8");
  console.log(`\nSummary report saved to: ${summaryPath}\n`);
}

main().catch((err) => {
  console.error("Fatal error in multicore benchmark:", err);
  process.exit(1);
});
