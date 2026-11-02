import { resolveLlmConfig } from "@/lib/bharatcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe for Render. Reports whether a server-side model key is configured, never the key itself. */
export function GET() {
  return Response.json(
    { status: "ok", mode: resolveLlmConfig() ? "ai" : "offline", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
