import { z } from "zod";

export const CATEGORIES = [
  "banking_upi",
  "cyber_fraud",
  "ecommerce",
  "telecom",
  "insurance",
  "airline",
  "real_estate",
  "general_consumer"
] as const;

export type Category = (typeof CATEGORIES)[number];

/** YYYY-MM-DD that is a real calendar day (rejects month-precision strings such as "2026-10-00"). */
const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d));
    return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  }, "Not a real calendar date");

export const LanguageSchema = z.enum(["en", "hi"]);
export type Language = z.infer<typeof LanguageSchema>;

/** Structured facts the classifier extracts from a free-text complaint. */
export const IntakeSchema = z.object({
  category: z.enum(CATEGORIES),
  summary: z.string().min(1).max(600),
  opposite_party: z.string().max(160).nullable(),
  amount_inr: z.number().nonnegative().max(1e12).nullable(),
  incident_date: IsoDate.nullable(),
  already_complained: z.boolean(),
  reference_ids: z.array(z.string().max(80)).max(10),
  missing_info: z.array(z.string().max(200)).max(8),
  confidence: z.number().min(0).max(1)
});
export type Intake = z.infer<typeof IntakeSchema>;

export const AnalyzeRequestSchema = z.object({
  story: z.string().trim().min(20, "Describe the problem in at least 20 characters.").max(4000),
  language: LanguageSchema.default("en"),
  /** Client's local date (YYYY-MM-DD) so deadlines match the user's calendar. */
  today: IsoDate.optional()
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const DOC_TYPES = ["company_complaint", "legal_notice", "regulator_complaint"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DraftRequestSchema = z.object({
  intake: IntakeSchema,
  story: z.string().trim().min(20).max(4000),
  docType: z.enum(DOC_TYPES),
  language: LanguageSchema.default("en"),
  complainant: z
    .object({
      name: z.string().trim().max(100).optional(),
      city: z.string().trim().max(100).optional()
    })
    .default({}),
  today: IsoDate.optional()
});
export type DraftRequest = z.infer<typeof DraftRequestSchema>;

export interface LawRef {
  name: string;
  point: string;
}

export interface LadderStepDef {
  id: string;
  title: string;
  forum: string;
  how: string;
  links: { label: string; url: string }[];
  phones?: string[];
  /** Days to wait for a response at this step before escalating to the next. */
  waitDays: number;
  note?: string;
}

export interface CategoryDef {
  id: Category;
  label: string;
  labelHi: string;
  emoji: string;
  laws: LawRef[];
  ladder: LadderStepDef[];
  evidence: string[];
  tips: string[];
  /** Which ladder step a regulator complaint draft should address. */
  regulatorStepId: string;
}

export interface PlannedStep extends LadderStepDef {
  order: number;
  startOn: string;
  escalateOn: string | null;
}

export interface Deadline {
  label: string;
  date: string | null;
  urgent: boolean;
  detail: string;
}

export interface CasePlan {
  intake: Intake;
  category: Pick<CategoryDef, "id" | "label" | "labelHi" | "emoji">;
  laws: LawRef[];
  steps: PlannedStep[];
  deadlines: Deadline[];
  evidence: string[];
  tips: string[];
  commission: { level: string; feeNote: string } | null;
  mode: "ai" | "offline";
  generatedOn: string;
}

export type AnalyzeEvent =
  | { type: "step"; id: "classify" | "route" | "plan"; status: "running" | "done"; detail?: string }
  | { type: "result"; plan: CasePlan }
  | { type: "error"; message: string };
