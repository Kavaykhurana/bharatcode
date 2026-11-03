import type { CasePlan } from "./types";

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  // RFC 5545: lines longer than 75 octets are folded with CRLF + space. Count UTF-8 bytes
  // and never split a character, so ₹ and Devanagari survive intact.
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > 75) {
      out.push(current);
      current = " ";
      bytes = 1;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n");
}

/** Builds an all-day calendar reminder for every escalation date and dated deadline. */
export function planToIcs(plan: CasePlan, stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const party = plan.intake.opposite_party ?? "complaint";
  const events: { date: string; title: string; body: string }[] = [];

  for (const step of plan.steps) {
    if (!step.escalateOn) continue;
    const next = plan.steps.find((s) => s.order === step.order + 1);
    events.push({
      date: step.escalateOn,
      title: `Haq: escalate ${party} → ${next?.title ?? "next step"}`,
      body: `No satisfactory reply at "${step.title}"? Move to: ${next?.title ?? "the next forum"}. ${next?.links[0]?.url ?? ""}`
    });
  }
  for (const d of plan.deadlines) {
    if (!d.date || d.date < plan.generatedOn) continue;
    events.push({ date: d.date, title: `Haq deadline: ${d.label}`, body: d.detail });
  }

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Haq//Consumer Grievance Agent//EN", "CALSCALE:GREGORIAN"];
  events.forEach((e, i) => {
    const day = e.date.replace(/-/g, "");
    const next = new Date(`${e.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:haq-${day}-${i}@haq.app`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      fold(`SUMMARY:${escapeIcs(e.title)}`),
      fold(`DESCRIPTION:${escapeIcs(e.body)}`),
      "BEGIN:VALARM",
      "TRIGGER;RELATED=START:PT9H",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escapeIcs(e.title)}`),
      "END:VALARM",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
