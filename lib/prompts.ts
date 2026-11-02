import { getCategory, KNOWLEDGE } from "./knowledge";
import type { ChatMessage } from "./bharatcode";
import type { DocType, Intake, Language } from "./types";

const CATEGORY_GUIDE = Object.values(KNOWLEDGE)
  .map((c) => `- ${c.id}: ${c.label}`)
  .join("\n");

export function classifyMessages(story: string, today: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are the intake agent of Haq, an assistant that helps Indian consumers resolve grievances.
Read the user's complaint (English, Hindi or Hinglish) and extract facts. Do NOT give advice.

Categories:
${CATEGORY_GUIDE}

Rules:
- "cyber_fraud" ONLY when money was taken without the user's authorisation or through a scam. A failed/stuck UPI transfer the user made themselves is "banking_upi".
- Use "general_consumer" when nothing else fits (electronics service centres, gyms, coaching, hospitals, electricity, etc.).
- amount_inr: the main disputed amount as a number in rupees (convert "2.5 lakh" to 250000). null if not stated.
- incident_date: YYYY-MM-DD. Today is ${today}; resolve relative dates ("last Tuesday", "kal") against it. null if unknown. Never a future date.
- opposite_party: the company/bank/seller name, or null.
- reference_ids: order IDs, UTR/RRN, PNR, policy, claim or ticket numbers exactly as written.
- missing_info: short questions for facts a complaint letter would need but the user did not give (max 5). Write them in the user's language.
- summary: 1–2 neutral sentences in English, third person ("The complainant…").
- confidence: 0–1, how sure you are about the category.

Respond with ONLY a JSON object, no prose, matching:
{"category": string, "summary": string, "opposite_party": string|null, "amount_inr": number|null, "incident_date": string|null, "already_complained": boolean, "reference_ids": string[], "missing_info": string[], "confidence": number}`
    },
    { role: "user", content: story }
  ];
}

const DOC_BRIEF: Record<DocType, string> = {
  company_complaint:
    "a firm, polite written complaint addressed to the company's Grievance / Nodal Officer, sent by email. It must request a specific remedy and a reply within the legally applicable timeline.",
  legal_notice:
    "a formal legal notice under the Consumer Protection Act, 2019 sent by the consumer in person (not through an advocate). It must give the opposite party 15 days to comply, failing which the consumer will approach the Consumer Commission and claim costs and compensation.",
  regulator_complaint:
    "the complaint text to paste into the regulator / ombudsman portal named below. Concise, factual, chronological, ending with the specific relief sought."
};

export function draftMessages(args: {
  intake: Intake;
  story: string;
  docType: DocType;
  language: Language;
  complainant: { name?: string; city?: string };
  today: string;
}): ChatMessage[] {
  const def = getCategory(args.intake.category);
  const regulator = def.ladder.find((s) => s.id === def.regulatorStepId);
  const laws = def.laws.map((l) => `- ${l.name}: ${l.point}`).join("\n");
  const lang =
    args.language === "hi"
      ? "Write the entire document in clear, formal Hindi (Devanagari). Keep statute names, IDs and amounts as they are."
      : "Write in clear, formal Indian English.";

  return [
    {
      role: "system",
      content: `You are the drafting agent of Haq. Draft ${DOC_BRIEF[args.docType]}
${args.docType === "regulator_complaint" && regulator ? `Portal: ${regulator.forum}.` : ""}

You may cite ONLY these provisions (do not invent sections, case law or helplines):
${laws}

Requirements:
- Plain text only. No markdown symbols (#, *, **). Use simple numbered paragraphs.
- Start with date (${args.today}), From, To, and a one-line Subject.
- State the facts chronologically with every reference number, amount (₹) and date provided.
- Where a fact is unknown, insert a clear bracketed blank like [Order ID] — never invent facts, names, addresses or numbers.
- Demand a specific remedy (refund / reversal / compensation / replacement) with the amount where known.
- End with a list of enclosures based on the evidence the complainant should attach.
- Length: 250–450 words.
- ${lang}`
    },
    {
      role: "user",
      content: `Complainant name: ${args.complainant.name || "[Your Name]"}
Complainant city: ${args.complainant.city || "[City]"}
Opposite party: ${args.intake.opposite_party ?? "[Company name]"}
Category: ${def.label}
Amount: ${args.intake.amount_inr !== null ? `₹${args.intake.amount_inr.toLocaleString("en-IN")}` : "[Amount]"}
Incident date: ${args.intake.incident_date ?? "[Date]"}
Reference IDs: ${args.intake.reference_ids.join(", ") || "[Reference number]"}
Already complained before: ${args.intake.already_complained ? "yes" : "no"}
Summary: ${args.intake.summary}

Complainant's own words:
"""
${args.story}
"""`
    }
  ];
}
