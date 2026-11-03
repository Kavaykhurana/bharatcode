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

/** Adds whole calendar years; 29 Feb rolls back to 28 Feb so a limitation date is never later than the law allows. */
export function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y + years, m - 1, d));
  if (target.getUTCMonth() !== m - 1) target.setUTCDate(0);
  return toISODate(target);
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
            ? "Report to your bank before this date. Under the RBI 2017 circular the 3 working days run from when the bank's alert reached you, so treat this date as an estimate. Zero liability applies only if you did not share your OTP, PIN or password."
            : today <= limited
              ? `Zero-liability window has passed (estimated); reporting before ${limited} still caps your liability. If you shared an OTP or PIN, the bank may treat the loss as yours until you report.`
              : "Both windows have passed — the bank decides liability under its board-approved policy. Report anyway, today."
      });
    } else {
      deadlines.push({
        label: "Report within 3 working days",
        date: null,
        urgent: true,
        detail: "Zero liability applies only to a third-party fraud that you did not enable (no shared OTP, PIN or password) and report within 3 working days of the bank's alert."
      });
    }
  }

  // RBI TAT: T+1 for failed UPI/IMPS, T+5 for failed ATM withdrawals. Only claim it when the story describes a failure.
  const failedTxn = /fail|not (?:received|credited|reversed)|stuck|pending|revers|refund/i.test(intake.summary);
  if (intake.category === "banking_upi" && incident && failedTxn) {
    const reversalDue = addDays(incident, /\batm\b/i.test(intake.summary) ? 5 : 1);
    const overdue = Math.max(0, daysBetween(reversalDue, today));
    if (overdue > 0) {
      deadlines.push({
        label: "Failed-transaction compensation accrued",
        date: reversalDue,
        urgent: false,
        detail: `Reversal was due by ${reversalDue}. At ₹100/day you can claim up to about ₹${(overdue * 100).toLocaleString("en-IN")} until it is reversed (only if the transaction failed and was not reversed).`
      });
    }
  }

  if (incident) {
    const limitation = addYears(incident, 2);
    const lapsed = limitation < today;
    const laterStart =
      intake.category === "insurance"
        ? " For an insurance claim the period usually runs from the insurer's rejection, which may be later than the incident."
        : intake.category === "real_estate"
          ? " Non-delivery of possession is often treated as a continuing wrong, so the period may not have started to run."
          : "";
    deadlines.push({
      label: "Consumer Commission limitation",
      date: limitation,
      urgent: !lapsed && daysBetween(today, limitation) <= 60,
      detail: lapsed
        ? `Two years from the incident date have passed. A complaint can still be filed with an application to condone the delay for sufficient cause (Consumer Protection Act 2019, s.69).${laterStart || " Check whether the cause of action arose later, for example on a final rejection."}`
        : `File before this date (2 years from the cause of action). Delay can be condoned only with sufficient cause.${laterStart}`
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
