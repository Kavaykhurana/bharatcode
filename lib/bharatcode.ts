/**
 * Minimal client for the BharatCode model API (OpenAI-compatible Chat Completions).
 * No SDK dependency: plain fetch, explicit timeouts, one retry on transient errors.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "LlmError";
  }
}

const DEFAULT_BASE_URL = "https://bharatcode.ai/api/model/v1";
const DEFAULT_MODEL = "qwen-3.8-27b";
const KEY_PATTERN = /^[\x21-\x7e]{8,256}$/;

/**
 * Resolves configuration. A key supplied by the user (BYOK header) wins over the
 * server key so deployments can run without a shared secret. Returns null when
 * no usable key exists — callers fall back to offline mode.
 */
export function resolveLlmConfig(userKey?: string | null): LlmConfig | null {
  const candidate = userKey?.trim() || process.env.BHARATCODE_API_KEY?.trim() || "";
  if (!KEY_PATTERN.test(candidate)) return null;
  return {
    apiKey: candidate,
    baseUrl: (process.env.BHARATCODE_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.BHARATCODE_MODEL?.trim() || DEFAULT_MODEL
  };
}

async function post(cfg: LlmConfig, body: Record<string, unknown>, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new LlmError("Model request timed out")), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    return await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, ...body }),
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function postWithRetry(cfg: LlmConfig, body: Record<string, unknown>, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await post(cfg, body, timeoutMs, signal);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        lastError = new LlmError(`Model API returned ${res.status}`, res.status);
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (res.status === 401 || res.status === 403) throw new LlmError("The BharatCode API key was rejected.", res.status);
      throw new LlmError(`Model API returned ${res.status}`, res.status);
    } catch (err) {
      if (err instanceof LlmError && err.status && err.status < 500 && err.status !== 429) throw err;
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new LlmError("Model request failed");
}

export async function chat(
  cfg: LlmConfig,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const res = await postWithRetry(
    cfg,
    { messages, temperature: opts.temperature ?? 0.2, max_tokens: opts.maxTokens ?? 1200, stream: false },
    opts.timeoutMs ?? 45_000,
    opts.signal
  );
  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") throw new LlmError("Model returned an empty response");
  return content;
}

/** Streams content deltas from an OpenAI-style SSE response. */
export async function* chatStream(
  cfg: LlmConfig,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  const res = await postWithRetry(
    cfg,
    { messages, temperature: opts.temperature ?? 0.4, max_tokens: opts.maxTokens ?? 1800, stream: true },
    opts.timeoutMs ?? 90_000,
    opts.signal
  );
  if (!res.body) throw new LlmError("Model returned no stream body");

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    // Some gateways ignore stream:true — degrade gracefully to a single chunk.
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (content) yield content;
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore keep-alives and malformed frames.
      }
    }
  }
}
