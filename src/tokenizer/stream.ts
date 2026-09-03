import { rehydrate } from "./engine";

/**
 * StreamTokenBuffer handles token boundary rehydration across chunked SSE responses.
 * Prevents split token corruption (e.g. chunk 1 ending in "PER" and chunk 2 starting with "SON_1")
 */
export class StreamTokenBuffer {
  private tokenMap: Record<string, string>;
  private pendingBuffer: string = "";

  constructor(tokenMap: Record<string, string>) {
    this.tokenMap = tokenMap;
  }

  /**
   * Processes an incoming raw text snippet from a stream chunk,
   * buffers incomplete token syntax (e.g. "PER"), and rehydrates complete tokens.
   */
  public processChunk(text: string): string {
    if (!text) return "";

    const combined = this.pendingBuffer + text;
    this.pendingBuffer = "";

    // Check if text ends with a potential trailing token prefix like PERSON_ or NRIC_ or EMAIL_
    const match = combined.match(/(?:<)?[A-Z]+(?:_\d*)?$/);
    if (match && match.index !== undefined && match.index > 0) {
      const safeText = combined.substring(0, match.index);
      this.pendingBuffer = combined.substring(match.index);
      return rehydrate(safeText, this.tokenMap);
    }

    return rehydrate(combined, this.tokenMap);
  }

  /**
   * Flushes any remaining pending buffer at the end of the stream.
   */
  public flush(): string {
    if (!this.pendingBuffer) return "";
    const remaining = this.pendingBuffer;
    this.pendingBuffer = "";
    return rehydrate(remaining, this.tokenMap);
  }
}
