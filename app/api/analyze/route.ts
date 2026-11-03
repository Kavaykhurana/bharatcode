import { classify } from "@/lib/agent";
import { resolveLlmConfig } from "@/lib/bharatcode";
import { buildPlan, todayISO } from "@/lib/planner";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { AnalyzeRequestSchema, type AnalyzeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

export async function POST(req: Request) {
  const limit = rateLimit(`analyze:${clientKey(req.headers)}`);
  if (!limit.ok) return json(429, { error: "Too many requests — try again in a minute." }, { "Retry-After": String(limit.retryAfter) });

  const body = await req.json().catch(() => null);
  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) return json(400, { error: body === null ? "Request body must be valid JSON." : (parsed.error.issues[0]?.message ?? "Invalid request") });

  const { story } = parsed.data;
  const today = parsed.data.today ?? todayISO();
  const cfg = resolveLlmConfig(req.headers.get("x-bharatcode-key"));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnalyzeEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        send({ type: "step", id: "classify", status: "running", detail: cfg ? "Reading your complaint with the BharatCode model" : "Reading your complaint (offline mode)" });
        const { intake, mode, note } = await classify(story, today, cfg, req.signal);
        send({ type: "step", id: "classify", status: "done", detail: note ?? `Identified: ${intake.category.replace(/_/g, " ")}` });

        send({ type: "step", id: "route", status: "running", detail: "Matching the right forum and law" });
        const plan = buildPlan(intake, today, mode);
        send({ type: "step", id: "route", status: "done", detail: `${plan.steps.length}-step escalation ladder · ${plan.laws.length} provisions` });

        send({ type: "step", id: "plan", status: "running", detail: "Computing deadlines" });
        send({ type: "step", id: "plan", status: "done", detail: `${plan.deadlines.filter((d) => d.date).length} dated deadlines` });

        send({ type: "result", plan });
      } catch (err) {
        if (!req.signal.aborted) send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
      } finally {
        try {
          controller.close();
        } catch {
          // the client disconnected and cancelled the stream
        }
      }
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" }
  });
}
