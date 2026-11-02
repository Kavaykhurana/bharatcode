import type { Category, Intake } from "./types";

/**
 * Deterministic offline classifier used when the model is unreachable or
 * returns unusable output. Keeps Haq useful with zero network dependency.
 */
const RULES: { category: Category; patterns: RegExp[] }[] = [
  {
    category: "cyber_fraud",
    patterns: [/fraud|scam|unauthori[sz]ed|hack|otp|phish|cheat|stolen|without my (consent|permission)|i didn'?t make|ठग|धोखा|फ्रॉड/i]
  },
  {
    category: "airline",
    patterns: [/flight|airline|pnr|boarding|indigo|air india|akasa|spicejet|vistara|baggage|airport|उड़ान|फ्लाइट/i]
  },
  {
    category: "insurance",
    patterns: [/insur|policy|claim|cashless|tpa|premium|lic\b|bima|बीमा|क्लेम/i]
  },
  {
    category: "real_estate",
    patterns: [/builder|flat|apartment|possession|rera|developer|allotment|plot|बिल्डर|फ्लैट/i]
  },
  {
    category: "telecom",
    patterns: [/jio|airtel|\bvi\b|vodafone|bsnl|broadband|wifi|wi-fi|sim\b|recharge|dth|tata play|network|मोबाइल|रिचार्ज/i]
  },
  {
    category: "banking_upi",
    patterns: [/upi|bank|neft|imps|rtgs|atm|debit|credit card|paytm|phonepe|gpay|google pay|utr|refund.*account|बैंक|पैसे कट/i]
  },
  {
    category: "ecommerce",
    patterns: [/amazon|flipkart|meesho|myntra|ajio|nykaa|swiggy|zomato|blinkit|zepto|order|delivery|seller|return|replacement|ऑर्डर|डिलीवरी/i]
  }
];

const COMPANIES = [
  "Amazon", "Flipkart", "Meesho", "Myntra", "Ajio", "Nykaa", "Swiggy", "Zomato", "Blinkit", "Zepto",
  "Jio", "Airtel", "Vodafone Idea", "BSNL", "Tata Play",
  "IndiGo", "Air India", "Akasa Air", "SpiceJet",
  "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Paytm", "PhonePe", "Google Pay",
  "LIC", "Star Health", "HDFC Ergo", "ICICI Lombard", "Bajaj Allianz", "Niva Bupa"
];

export function classifyOffline(story: string, today: string): Intake {
  const scores = RULES.map((r) => ({
    category: r.category,
    score: r.patterns.reduce((n, p) => n + (story.match(new RegExp(p, "gi"))?.length ?? 0), 0)
  }));
  // Fraud language overrides a generic bank match: it changes the urgency entirely.
  const fraud = scores.find((s) => s.category === "cyber_fraud")!;
  const best = fraud.score > 0 ? fraud : scores.reduce((a, b) => (b.score > a.score ? b : a));
  const category: Category = best.score > 0 ? best.category : "general_consumer";

  const company = COMPANIES.find((c) => new RegExp(`\\b${c.replace(/ /g, "\\s+")}\\b`, "i").test(story)) ?? null;
  const amount = extractAmount(story);
  const incidentDate = extractDate(story, today);
  const refs = extractReferences(story);

  const missing: string[] = [];
  if (!company) missing.push("Name of the company / bank / seller");
  if (amount === null) missing.push("Amount involved (₹)");
  if (!incidentDate) missing.push("Date of the incident");
  if (refs.length === 0) missing.push("Order ID / UTR / PNR / policy or complaint number");

  return {
    category,
    summary: story.replace(/\s+/g, " ").trim().slice(0, 280),
    opposite_party: company,
    amount_inr: amount,
    incident_date: incidentDate,
    already_complained: /complain|ticket|customer care|support|raised|शिकायत/i.test(story),
    reference_ids: refs,
    missing_info: missing,
    confidence: best.score > 0 ? Math.min(0.75, 0.4 + best.score * 0.1) : 0.3
  };
}

/** Order IDs, 12-digit UTRs, Amazon-style order numbers and PNRs. */
export function extractReferences(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b\d{3}-\d{7}-\d{7}\b/g)) found.add(m[0]);
  for (const m of text.matchAll(/\b\d{12}\b/g)) found.add(m[0]);
  for (const m of text.matchAll(/\b[A-Z]{2,}[-_]?\d{5,}\b/g)) found.add(m[0]);
  for (const m of text.matchAll(/\bPNR\b[:\s#-]*([A-Z0-9]{6})\b/gi)) found.add(m[1].toUpperCase());
  return Array.from(found).slice(0, 5);
}

export function extractAmount(text: string): number | null {
  const m = text.match(/(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?|([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?\s*(?:rupees|rs\b|₹|रुपये)/i);
  if (!m) return null;
  const num = parseFloat((m[1] ?? m[3]).replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  const unit = (m[2] ?? m[4] ?? "").toLowerCase();
  const mult = unit === "k" ? 1e3 : unit === "lakh" || unit === "lac" ? 1e5 : unit === "crore" || unit === "cr" ? 1e7 : 1;
  return Math.round(num * mult);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function extractDate(text: string, today: string): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  const dmy = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|\d{2})\b/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return safeDate(year, Number(dmy[2]), Number(dmy[1]));
  }

  const named = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*(20\d{2})?/i);
  if (named) {
    const month = MONTHS.indexOf(named[2].toLowerCase()) + 1;
    let year = named[3] ? Number(named[3]) : Number(today.slice(0, 4));
    const candidate = safeDate(year, month, Number(named[1]));
    if (!named[3] && candidate && candidate > today) year -= 1;
    return safeDate(year, month, Number(named[1]));
  }

  const rel = text.match(/\b(yesterday|today|(\d{1,2})\s+days?\s+ago|kal)\b/i);
  if (rel) {
    const base = new Date(`${today}T00:00:00Z`).getTime();
    const back = /today/i.test(rel[1]) ? 0 : rel[2] ? Number(rel[2]) : 1;
    return new Date(base - back * 86_400_000).toISOString().slice(0, 10);
  }
  return null;
}

function safeDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString().slice(0, 10);
}
