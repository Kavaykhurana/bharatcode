import { chatStream, LlmError, resolveLlmConfig } from "@/lib/bharatcode";
import { ThinkFilter } from "@/lib/json";
import { todayISO } from "@/lib/planner";
import { draftMessages } from "@/lib/prompts";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { templateDraft } from "@/lib/templates";
import { DraftRequestSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sent before a template draft; the client discards anything streamed before it. */
const FALLBACK_MARKER = "\u0000HAQ_FALLBACK\u0000";

export async function POST(req: Request) {
  const limit = rateLimit(`draft:${clientKey(req.headers)}`);
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "Too many requests — try again in a minute." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(limit.retryAfter) }
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: body === null ? "Request body must be valid JSON." : (parsed.error.issues[0]?.message ?? "Invalid request") }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const args = { ...parsed.data, today: parsed.data.today ?? todayISO() };
  const cfg = resolveLlmConfig(req.headers.get("x-bharatcode-key"));
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      let produced = "";
      try {
        if (!cfg) throw new LlmError("offline");
        const filter = new ThinkFilter();
        for await (const delta of chatStream(cfg, draftMessages(args), { signal: req.signal })) {
          const visible = filter.push(delta);
          if (visible) {
            produced += visible;
            write(visible);
          }
        }
        const tail = filter.flush();
        if (tail) {
          produced += tail;
          write(tail);
        }
        if (produced.trim().length < 80) throw new LlmError("Model draft was empty");
      } catch {
        if (req.signal.aborted) {
          controller.close();
          return;
        }
        // Model unavailable or failed mid-way: replace with the deterministic template.
        const fallback = templateDraft(args);
        write(`${FALLBACK_MARKER}${fallback}`);
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "X-Haq-Mode": cfg ? "ai" : "offline"
    }
  });
}
