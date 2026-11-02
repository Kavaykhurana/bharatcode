import { commissionFor, getCategory } from "./knowledge";
import type { CasePlan, Deadline, Intake, PlannedStep } from "./types";

const DAY_MS = 86_400_000;

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toISODate(new Date(parseISODate(iso).getTime() + days * DAY_MS));
}

/** Adds working days (Mon–Fri). Public holidays vary by state and are not modelled. */
export function addWorkingDays(iso: string, days: number): string {
  let date = parseISODate(iso);
  let added = 0;
  while (added < days) {
    date = new Date(date.getTime() + DAY_MS);
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return toISODate(date);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / DAY_MS);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Lays the category's escalation ladder onto the calendar, starting today. */
export function planSteps(intake: Intake, today: string): PlannedStep[] {
  const def = getCategory(intake.category);
  let cursor = today;
  return def.ladder.map((step, index) => {
    const startOn = cursor;
    const isLast = index === def.ladder.length - 1;
    const escalateOn = isLast || step.waitDays === 0 ? null : addDays(startOn, step.waitDays);
    if (escalateOn) cursor = escalateOn;
    return { ...step, order: index + 1, startOn, escalateOn };
  });
}

export function computeDeadlines(intake: Intake, today: string): Deadline[] {
  const deadlines: Deadline[] = [];
  const incident = intake.incident_date && intake.incident_date <= today ? intake.incident_date : null;

  if (intake.category === "cyber_fraud") {
    if (incident) {
      const zeroLiability = addWorkingDays(incident, 3);
      const limited = addWorkingDays(incident, 7);
      deadlines.push({
        label: "Zero-liability reporting window",
        date: zeroLiability,
        urgent: today <= zeroLiability,
        detail:
          today <= zeroLiability
            ? "Report to your bank before this date to keep zero liability under the RBI 2017 circular."
            : today <= limited
              ? `Zero-liability window has passed; reporting before ${limited} still caps your liability.`
              : "Both windows have passed — the bank decides liability under its board-approved policy. Report anyway, today."
      });
    } else {
      deadlines.push({
        label: "Report within 3 working days",
        date: null,
        urgent: true,
        detail: "Zero liability applies only if you report a third-party fraud within 3 working days of the transaction."
      });
    }
  }

  if (intake.category === "banking_upi" && incident) {
    const reversalDue = addDays(incident, 1);
    const overdue = Math.max(0, daysBetween(reversalDue, today));
    if (overdue > 0) {
      deadlines.push({
        label: "Failed-transaction compensation accrued",
        date: reversalDue,
        urgent: false,
        detail: `Reversal was due by ${reversalDue}. At ₹100/day you can claim about ₹${(overdue * 100).toLocaleString("en-IN")} so far (if the transaction failed and was not reversed).`
      });
    }
  }

  if (incident) {
    const limitation = addDays(incident, 365 * 2);
    deadlines.push({
      label: "Consumer Commission limitation",
      date: limitation,
      urgent: daysBetween(today, limitation) <= 60,
      detail: "File before this date (2 years from the cause of action). Delay can be condoned only with sufficient cause."
    });
  } else {
    deadlines.push({
      label: "Consumer Commission limitation",
      date: null,
      urgent: false,
      detail: "2 years from the date of the incident — add the incident date to compute it exactly."
    });
  }

  if (intake.category === "banking_upi" || intake.category === "cyber_fraud") {
    deadlines.push({
      label: "RBI Ombudsman window",
      date: null,
      urgent: false,
      detail: "File within 1 year of the bank's final reply (or 1 year + 30 days of your complaint if they never replied)."
    });
  }
  if (intake.category === "insurance") {
    deadlines.push({
      label: "Insurance Ombudsman window",
      date: null,
      urgent: false,
      detail: "File within 1 year of the insurer's rejection or final reply."
    });
  }
  return deadlines;
}

export function buildPlan(intake: Intake, today: string, mode: CasePlan["mode"]): CasePlan {
  const def = getCategory(intake.category);
  const usesCommission = def.ladder.some((s) => s.id === "consumer_commission");
  return {
    intake,
    category: { id: def.id, label: def.label, labelHi: def.labelHi, emoji: def.emoji },
    laws: def.laws,
    steps: planSteps(intake, today),
    deadlines: computeDeadlines(intake, today),
    evidence: def.evidence,
    tips: def.tips,
    commission: usesCommission ? commissionFor(intake.amount_inr) : null,
    mode,
    generatedOn: today
  };
}
