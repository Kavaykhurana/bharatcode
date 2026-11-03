import type { Category, Intake } from "./types";

/**
 * Deterministic offline classifier used when the model is unreachable or
 * returns unusable output. Keeps Haq useful with zero network dependency.
 */
const RULES: { category: Category; patterns: RegExp[] }[] = [
  {
    category: "cyber_fraud",
    patterns: [/fraud|scam|unauthori[sz]ed|\bhack|\botp\b|phish|without my (consent|permission)|i didn'?t make|ठग|धोखा|फ्रॉड/i]
  },
  {
    category: "airline",
    patterns: [/flight|airline|pnr|boarding|indigo|air india|akasa|spicejet|vistara|baggage|airport|उड़ान|फ्लाइट/i]
  },
  {
    category: "insurance",
    patterns: [/insur|\bpolicy (?:number|no)|insurance policy|\bclaim|cashless|\btpa\b|premium|\blic\b|bima|बीमा|क्लेम/i]
  },
  {
    category: "real_estate",
    patterns: [/builder|\bflat\b|apartment|possession|\brera\b|developer|allotment|\bplot\b|बिल्डर|फ्लैट/i]
  },
  {
    category: "telecom",
    patterns: [/jio|airtel|\bvi\b|vodafone|bsnl|broadband|wifi|wi-fi|sim\b|recharge|dth|tata play|network|मोबाइल|रिचार्ज/i]
  },
  {
    category: "banking_upi",
    patterns: [/upi|bank|neft|imps|rtgs|\batm\b|debit|credit card|paytm|phonepe|gpay|google pay|\butr\b|refund.*account|बैंक|पैसे कट/i]
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
  // Fraud language overrides a generic bank match (it changes the urgency entirely), but a stray
  // fraud word must not beat a clearly different category such as an e-commerce or telecom dispute.
  const fraud = scores.find((s) => s.category === "cyber_fraud")!;
  const banking = scores.find((s) => s.category === "banking_upi")!;
  const topOther = Math.max(...scores.filter((s) => s !== fraud).map((s) => s.score));
  const fraudWins = fraud.score > 0 && (banking.score > 0 || fraud.score > topOther);
  const best = fraudWins ? fraud : scores.reduce((a, b) => (b.score > a.score ? b : a));
  const category: Category = best.score > 0 ? best.category : "general_consumer";

  // The company named earliest in the story is the opposite party, not the first one in our list.
  const company =
    COMPANIES.map((c) => ({ c, at: story.search(new RegExp(`\\b${c.replace(/ /g, "\\s+")}\\b`, "i")) }))
      .filter((m) => m.at >= 0)
      .sort((a, b) => a.at - b.at)[0]?.c ?? null;
  const amount = extractAmount(story);
  const found = extractDate(story, today);
  const incidentDate = found && found <= today ? found : null; // an incident cannot be in the future
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
    already_complained:
      /\b(?:already|previously|earlier)\b.{0,40}\b(?:complain|rais|report)|\b(?:complained|raised|reported)\b|\bticket\s*(?:no|number|id|#)|शिकायत (?:की|दर्ज)/i.test(story),
    reference_ids: refs,
    missing_info: missing,
    confidence: best.score > 0 ? Math.min(0.75, 0.4 + best.score * 0.1) : 0.3
  };
}

/** Order IDs, 12-digit UTRs, Amazon-style order numbers and PNRs. */
export function extractReferences(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b\d{3}-\d{7}-\d{7}\b/g)) found.add(m[0]);
  // A bare 12-digit number may be an Aadhaar number; only accept it next to a transaction keyword.
  for (const m of text.matchAll(/\b(?:utr|rrn|ref(?:erence)?|txn|transaction)\b\D{0,25}(\d{12})\b/gi)) found.add(m[1]);
  for (const m of text.matchAll(/\b[A-Z]{2,}[-_]?\d{5,}\b/g)) found.add(m[0]);
  for (const m of text.matchAll(/\bPNR\b[:\s#-]*([A-Z0-9]{6})\b/gi)) if (/\d/.test(m[1])) found.add(m[1].toUpperCase());
  return Array.from(found).slice(0, 5);
}

export function extractAmount(text: string): number | null {
  const unitRe = "(lakhs?|lacs?|crores?|cr|k|लाख|करोड़|हज़ार|हजार)(?![a-z])";
  const m = text.match(
    new RegExp(
      `(?<![a-z])(?:₹|rs\\.?|inr|rupees?)\\s*(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s*${unitRe})?|(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s*${unitRe})?\\s*(?:rupees|(?<![a-z])rs\\b|₹|रुपये)`,
      "i"
    )
  );
  if (!m) return null;
  const num = parseFloat((m[1] ?? m[3]).replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  const unit = (m[2] ?? m[4] ?? "").toLowerCase();
  const mult = unit === "k" || /^ह/.test(unit) ? 1e3 : /^la|^ला/.test(unit) ? 1e5 : /^cr|^क/.test(unit) ? 1e7 : 1;
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

  const named = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b\.?,?\s*(20\d{2})?/i);
  if (named) {
    const month = MONTHS.indexOf(named[2].toLowerCase().slice(0, 3)) + 1;
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
