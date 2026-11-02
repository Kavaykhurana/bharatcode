import { describe, expect, it } from "vitest";
import { classifyOffline, extractAmount, extractDate, extractReferences } from "@/lib/heuristics";
import { extractJsonObject, stripThinking, ThinkFilter } from "@/lib/json";
import { commissionFor, KNOWLEDGE } from "@/lib/knowledge";
import { addWorkingDays, buildPlan, planSteps } from "@/lib/planner";
import { planToIcs } from "@/lib/ics";
import { templateDraft } from "@/lib/templates";
import { CATEGORIES, IntakeSchema, type Intake } from "@/lib/types";

const TODAY = "2026-11-02";

function intake(overrides: Partial<Intake> = {}): Intake {
  return IntakeSchema.parse({
    category: "banking_upi",
    summary: "The complainant's UPI transfer was debited but not credited.",
    opposite_party: "HDFC Bank",
    amount_inr: 4500,
    incident_date: "2026-10-28",
    already_complained: true,
    reference_ids: ["629814573021"],
    missing_info: [],
    confidence: 0.9,
    ...overrides
  });
}

describe("knowledge base", () => {
  it("defines every category with a ladder, laws and a valid regulator step", () => {
    for (const id of CATEGORIES) {
      const def = KNOWLEDGE[id];
      expect(def.ladder.length).toBeGreaterThanOrEqual(3);
      expect(def.laws.length).toBeGreaterThan(0);
      expect(def.ladder.some((s) => s.id === def.regulatorStepId)).toBe(true);
      for (const step of def.ladder) for (const link of step.links) expect(link.url).toMatch(/^https:\/\//);
    }
  });

  it("routes claims to the correct consumer commission tier", () => {
    expect(commissionFor(300_000).level).toMatch(/District/);
    expect(commissionFor(300_000).feeNote).toMatch(/No filing fee/);
    expect(commissionFor(5_000_000).level).toMatch(/District/);
    expect(commissionFor(5_000_001).level).toMatch(/State/);
    expect(commissionFor(25_000_000).level).toMatch(/National/);
  });
});

describe("planner", () => {
  it("chains escalation dates from today using each step's wait period", () => {
    const steps = planSteps(intake(), TODAY);
    expect(steps[0].startOn).toBe(TODAY);
    expect(steps[0].escalateOn).toBe("2026-12-02"); // bank: 30 days
    expect(steps[1].startOn).toBe("2026-12-02");
    expect(steps.at(-1)!.escalateOn).toBeNull();
  });

  it("counts working days, skipping weekends", () => {
    expect(addWorkingDays("2026-10-30", 3)).toBe("2026-11-04"); // Fri → Wed
  });

  it("flags the zero-liability window for a fresh fraud", () => {
    const plan = buildPlan(intake({ category: "cyber_fraud", incident_date: "2026-11-01" }), TODAY, "ai");
    const window = plan.deadlines.find((d) => d.label.includes("Zero-liability"))!;
    expect(window.urgent).toBe(true);
    expect(window.date).toBe("2026-11-04");
    expect(plan.steps[0].id).toBe("report_1930");
  });

  it("computes accrued ₹100/day compensation for a failed UPI transfer", () => {
    const plan = buildPlan(intake(), TODAY, "ai");
    const comp = plan.deadlines.find((d) => d.label.includes("compensation"))!;
    expect(comp.detail).toContain("₹400"); // due 29 Oct, 4 days overdue on 2 Nov
  });

  it("computes the 2-year limitation from the incident date", () => {
    const plan = buildPlan(intake({ category: "ecommerce", incident_date: "2025-01-10" }), TODAY, "ai");
    expect(plan.deadlines.find((d) => d.label.includes("limitation"))!.date).toBe("2027-01-10");
    expect(plan.commission?.level).toMatch(/District/);
  });
});

describe("offline classifier", () => {
  it.each([
    ["My UPI payment of ₹4,500 via PhonePe was debited, UTR 629814573021, but not received", "banking_upi"],
    ["Someone called as SBI, I shared OTP and ₹62,000 was debited — fraud", "cyber_fraud"],
    ["Flipkart sent a broken phone, order OD43215678901234, refusing return", "ecommerce"],
    ["IndiGo flight cancelled, PNR K7XQ2M, no refund yet", "airline"],
    ["Star Health rejected my claim of 1.8 lakh", "insurance"],
    ["बिल्डर ने फ्लैट का पज़ेशन नहीं दिया", "real_estate"],
    ["Airtel broadband has been down for 10 days and they keep charging", "telecom"],
    ["The gym took my annual fee and shut down", "general_consumer"]
  ])("classifies %s", (story, category) => {
    expect(classifyOffline(story, TODAY).category).toBe(category);
  });

  it("extracts amounts in Indian formats", () => {
    expect(extractAmount("paid ₹18,999 for it")).toBe(18999);
    expect(extractAmount("claim of Rs 1.8 lakh")).toBe(180000);
    expect(extractAmount("45 lakh rupees")).toBe(4500000);
    expect(extractAmount("no money mentioned")).toBeNull();
  });

  it("extracts dates and never returns a future date for month-day mentions", () => {
    expect(extractDate("on 28 Oct 2026", TODAY)).toBe("2026-10-28");
    expect(extractDate("on 15/10/2026", TODAY)).toBe("2026-10-15");
    expect(extractDate("it happened yesterday", TODAY)).toBe("2026-11-01");
    expect(extractDate("on 20 Dec", TODAY)).toBe("2025-12-20");
  });

  it("extracts order IDs, UTRs and PNRs", () => {
    const refs = extractReferences("UTR 629814573021, order OD43215678901234, PNR: k7xq2m, Amazon 404-1234567-1234567");
    expect(refs).toEqual(expect.arrayContaining(["629814573021", "OD43215678901234", "K7XQ2M", "404-1234567-1234567"]));
  });
});

describe("model output handling", () => {
  it("extracts JSON from fenced, reasoning-prefixed output", () => {
    const raw = '<think>let me think {not json}</think>\n```json\n{"a": 1, "b": "x}y", "c": [1,2,],}\n```\nDone.';
    expect(extractJsonObject(raw)).toEqual({ a: 1, b: "x}y", c: [1, 2] });
  });

  it("strips think blocks", () => {
    expect(stripThinking("<think>hidden</think>visible")).toBe("visible");
  });

  it("filters think blocks across stream chunk boundaries", () => {
    const f = new ThinkFilter();
    const out = ["Hello <thi", "nk>secret", " stuff</th", "ink> world", "!"].map((c) => f.push(c)).join("") + f.flush();
    expect(out).toBe("Hello  world!");
  });
});

describe("outputs", () => {
  it("produces a valid iCalendar file with escalation reminders", () => {
    const ics = planToIcs(buildPlan(intake(), TODAY, "ai"), new Date("2026-11-02T10:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261202");
    expect(ics.match(/BEGIN:VEVENT/g)!.length).toBeGreaterThanOrEqual(2);
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });

  it("template drafts contain the facts and never invent missing ones", () => {
    const text = templateDraft({ intake: intake({ opposite_party: null }), docType: "legal_notice", language: "en", complainant: {}, today: TODAY });
    expect(text).toContain("₹4,500");
    expect(text).toContain("629814573021");
    expect(text).toContain("[Company name]");
    expect(text).toContain("15 days");
    const hi = templateDraft({ intake: intake(), docType: "company_complaint", language: "hi", complainant: { name: "Kavay" }, today: TODAY });
    expect(hi).toContain("विषय");
  });
});
