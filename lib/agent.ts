import { chat, LlmError, type LlmConfig } from "./bharatcode";
import { classifyOffline } from "./heuristics";
import { extractJsonObject } from "./json";
import { classifyMessages } from "./prompts";
import { IntakeSchema, type Intake } from "./types";

/**
 * Classify with the model, validate with zod, and repair or fall back.
 * The model's output is never trusted blindly: anything that fails the
 * schema is merged field-by-field with the deterministic extractor.
 */
export async function classify(
  story: string,
  today: string,
  cfg: LlmConfig | null,
  signal?: AbortSignal
): Promise<{ intake: Intake; mode: "ai" | "offline"; note?: string }> {
  const offline = sanitise(classifyOffline(story, today), today);
  if (!cfg) return { intake: offline, mode: "offline", note: "No API key configured — using the offline classifier." };

  try {
    const raw = await chat(cfg, classifyMessages(story, today), { temperature: 0, maxTokens: 700, signal });
    const parsed = extractJsonObject(raw) as Record<string, unknown>;
    const strict = IntakeSchema.safeParse(normalise(parsed));
    if (strict.success) return { intake: sanitise(strict.data, today), mode: "ai" };

    // Partial salvage: keep valid model fields, fill the rest from the offline pass.
    const merged = { ...offline } as Record<string, unknown>;
    for (const [key, shape] of Object.entries(IntakeSchema.shape)) {
      const value = normalise(parsed)[key];
      if (value !== undefined && shape.safeParse(value).success) merged[key] = value;
    }
    return { intake: sanitise(IntakeSchema.parse(merged), today), mode: "ai", note: "Some model fields were repaired." };
  } catch (err) {
    if (signal?.aborted) throw err;
    const reason =
      err instanceof LlmError
        ? err.message
        : err instanceof SyntaxError || (err instanceof Error && /JSON/.test(err.message))
          ? "The model response could not be parsed."
          : "The BharatCode API could not be reached.";
    return { intake: offline, mode: "offline", note: `${reason} Falling back to the offline classifier.` };
  }
}

function normalise(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj };
  if (typeof out.amount_inr === "string") {
    const n = Number(out.amount_inr.replace(/[₹,\s]/g, ""));
    out.amount_inr = Number.isFinite(n) ? n : null;
  }
  if (typeof out.confidence === "string") out.confidence = Number(out.confidence);
  if (typeof out.category === "string") out.category = out.category.trim().toLowerCase();
  for (const key of ["opposite_party", "incident_date"]) {
    if (out[key] === "" || out[key] === "null" || out[key] === "unknown") out[key] = null;
  }
  if (!Array.isArray(out.reference_ids)) out.reference_ids = [];
  if (!Array.isArray(out.missing_info)) out.missing_info = [];
  out.reference_ids = (out.reference_ids as unknown[]).filter((x) => typeof x === "string").slice(0, 10);
  out.missing_info = (out.missing_info as unknown[]).filter((x) => typeof x === "string").slice(0, 8);
  if (typeof out.summary === "string") out.summary = out.summary.slice(0, 600);
  return out;
}

function sanitise(intake: Intake, today: string): Intake {
  // A model must never put the incident in the future.
  if (intake.incident_date && intake.incident_date > today) return { ...intake, incident_date: null };
  return intake;
}
