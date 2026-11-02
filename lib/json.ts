/** Removes chain-of-thought blocks that reasoning models (e.g. Qwen) may emit. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();
}

/**
 * Pulls the first balanced JSON object out of a model response, tolerating
 * markdown fences, reasoning preambles and trailing commentary.
 */
export function extractJsonObject(raw: string): unknown {
  const text = stripThinking(raw).replace(/```(?:json)?/gi, "");
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1).replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(candidate);
      }
    }
  }
  throw new Error("Unbalanced JSON object in model output");
}

/**
 * Incrementally filters <think>…</think> spans out of a token stream so the
 * user only ever sees the final answer.
 */
export class ThinkFilter {
  private buffer = "";
  private thinking = false;

  push(chunk: string): string {
    this.buffer += chunk;
    let out = "";
    for (;;) {
      if (this.thinking) {
        const end = this.buffer.indexOf("</think>");
        if (end === -1) {
          this.buffer = this.buffer.slice(-8);
          return out;
        }
        this.buffer = this.buffer.slice(end + 8);
        this.thinking = false;
        continue;
      }
      const start = this.buffer.indexOf("<think>");
      if (start === -1) {
        // Hold back a partial "<think" prefix that may complete in the next chunk.
        const lt = this.buffer.lastIndexOf("<");
        if (lt !== -1 && "<think>".startsWith(this.buffer.slice(lt))) {
          out += this.buffer.slice(0, lt);
          this.buffer = this.buffer.slice(lt);
        } else {
          out += this.buffer;
          this.buffer = "";
        }
        return out;
      }
      out += this.buffer.slice(0, start);
      this.buffer = this.buffer.slice(start + 7);
      this.thinking = true;
    }
  }

  flush(): string {
    const rest = this.thinking ? "" : this.buffer;
    this.buffer = "";
    return rest;
  }
}
