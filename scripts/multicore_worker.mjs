import { parentPort } from "worker_threads";
import { openSync, readSync, statSync, closeSync } from "fs";
import { parquetRead } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { tokenize, rehydrate } from "../dist/engine.mjs";

let fd = null;
let asyncBuffer = null;
let currentFilePath = null;

function initBuffer(filePath) {
  if (currentFilePath === filePath && fd !== null) return;
  if (fd !== null) {
    try { closeSync(fd); } catch (_) {}
  }
  currentFilePath = filePath;
  fd = openSync(filePath, "r");
  const size = statSync(filePath).size;
  asyncBuffer = {
    byteLength: size,
    slice: (start, end) =>
      new Promise((resolve, reject) => {
        const len = end - start;
        const buf = Buffer.alloc(len);
        try {
          readSync(fd, buf, 0, len, start);
          resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + len));
        } catch (err) {
          reject(err);
        }
      }),
  };
}

parentPort.on("message", async (msg) => {
  if (msg.type === "INIT") {
    initBuffer(msg.filePath);
    parentPort.postMessage({ type: "READY" });
    return;
  }

  if (msg.type === "PROCESS_CHUNK") {
    const { chunkIndex, rowStart, rowEnd, filePath, categories, mode } = msg;
    initBuffer(filePath);

    const t0 = performance.now();
    let totalProcessed = 0;
    let totalEntities = 0;
    const entityCountsByType = {};
    const mismatches = [];
    const latencies = [];
    let totalTokens = 0;

    try {
      await parquetRead({
        file: asyncBuffer,
        columns: ["Prompt"],
        compressors,
        rowStart,
        rowEnd,
        onComplete: (rows) => {
          for (let i = 0; i < rows.length; i++) {
            const text = rows[i][0];
            if (!text || typeof text !== "string" || text.trim().length === 0) {
              totalProcessed++;
              continue;
            }

            const tPromptStart = performance.now();
            const tokResult = tokenize(text, { categories: categories || ["all"], mode: mode || "structural" });
            const rehydrated = rehydrate(tokResult.sanitizedText, tokResult.tokenMap);
            const promptLatency = performance.now() - tPromptStart;

            totalProcessed++;
            totalTokens += Math.max(1, Math.round(text.length / 4));

            if (tokResult.count > 0) {
              totalEntities += tokResult.count;
              for (const ent of tokResult.entitiesDetected) {
                entityCountsByType[ent.type] = (entityCountsByType[ent.type] || 0) + 1;
              }
            }

            // Sample latencies to minimize IPC memory transfer (sample 1 out of 100)
            if (i % 100 === 0) {
              latencies.push(promptLatency);
            }

            if (rehydrated !== text) {
              mismatches.push({
                absoluteRowIndex: rowStart + i,
                original: text.length > 300 ? text.substring(0, 300) + "..." : text,
                sanitized: tokResult.sanitizedText.length > 300 ? tokResult.sanitizedText.substring(0, 300) + "..." : tokResult.sanitizedText,
                rehydrated: rehydrated.length > 300 ? rehydrated.substring(0, 300) + "..." : rehydrated,
                tokenCount: tokResult.count,
              });
            }
          }
        },
      });

      const elapsedMs = performance.now() - t0;
      parentPort.postMessage({
        type: "CHUNK_DONE",
        chunkIndex,
        totalProcessed,
        totalEntities,
        entityCountsByType,
        mismatches,
        latencies,
        totalTokens,
        elapsedMs,
      });
    } catch (err) {
      parentPort.postMessage({
        type: "CHUNK_ERROR",
        chunkIndex,
        error: err.message || String(err),
      });
    }
  }
});
