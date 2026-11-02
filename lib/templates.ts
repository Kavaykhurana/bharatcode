import { getCategory } from "./knowledge";
import type { DocType, Intake, Language } from "./types";

/**
 * Deterministic drafts used when the model is unavailable. Fully usable
 * documents with bracketed blanks — never fabricated facts.
 */
export function templateDraft(args: {
  intake: Intake;
  docType: DocType;
  language: Language;
  complainant: { name?: string; city?: string };
  today: string;
}): string {
  const { intake, docType, today } = args;
  const def = getCategory(intake.category);
  const name = args.complainant.name || "[Your Name]";
  const city = args.complainant.city || "[City]";
  const party = intake.opposite_party ?? "[Company name]";
  const amount = intake.amount_inr !== null ? `₹${intake.amount_inr.toLocaleString("en-IN")}` : "₹[Amount]";
  const date = intake.incident_date ?? "[Date of incident]";
  const refs = intake.reference_ids.length ? intake.reference_ids.join(", ") : "[Order / Transaction / Policy number]";
  const regulator = def.ladder.find((s) => s.id === def.regulatorStepId);
  const lawLines = def.laws.map((l, i) => `   (${String.fromCharCode(97 + i)}) ${l.name}: ${l.point}`).join("\n");
  const enclosures = def.evidence.map((e, i) => `${i + 1}. ${e}`).join("\n");

  if (args.language === "hi") {
    const heading =
      docType === "legal_notice" ? "विधिक नोटिस" : docType === "regulator_complaint" ? `शिकायत — ${regulator?.forum ?? "नियामक"}` : "लिखित शिकायत";
    return `दिनांक: ${today}

प्रेषक: ${name}, ${city}
सेवा में: शिकायत निवारण अधिकारी, ${party}

विषय: ${heading} — ${def.labelHi} से संबंधित (संदर्भ: ${refs})

महोदय/महोदया,

1. मैं, ${name}, आपकी सेवाओं का उपभोक्ता हूँ। दिनांक ${date} को ${party} के साथ ${amount} राशि से संबंधित निम्न समस्या हुई: ${intake.summary}

2. मैंने इस विषय में पहले भी संपर्क किया${intake.already_complained ? "" : " [यदि किया हो तो शिकायत संख्या लिखें]"}, किंतु अब तक समाधान नहीं हुआ है।

3. यह मामला निम्न प्रावधानों के अंतर्गत आता है:
${lawLines}

4. अतः मेरा अनुरोध है कि ${amount} की राशि वापस/समायोजित की जाए तथा हुई असुविधा हेतु उचित क्षतिपूर्ति दी जाए।

5. ${docType === "legal_notice" ? "यदि इस नोटिस की प्राप्ति के 15 दिनों के भीतर समाधान नहीं किया गया, तो मैं उपभोक्ता आयोग में शिकायत दर्ज करूँगा/करूँगी तथा वाद-व्यय एवं क्षतिपूर्ति की माँग करूँगा/करूँगी।" : "कृपया नियमानुसार निर्धारित समय-सीमा में लिखित उत्तर दें।"}

संलग्नक:
${enclosures}

भवदीय,
${name}
[मोबाइल नंबर] | [ईमेल]`;
  }

  const subject =
    docType === "legal_notice"
      ? `Legal notice under the Consumer Protection Act, 2019 — ${refs}`
      : docType === "regulator_complaint"
        ? `Complaint against ${party} — ${def.label} — ${refs}`
        : `Complaint regarding ${def.label.toLowerCase()} — ${refs}`;

  const to =
    docType === "regulator_complaint" && regulator
      ? regulator.forum
      : `The Grievance Officer / Nodal Officer, ${party}`;

  const closing =
    docType === "legal_notice"
      ? `5. Take notice that if the above relief is not provided within 15 days of receipt of this notice, I shall be constrained to file a complaint before the appropriate Consumer Disputes Redressal Commission, seeking the amount along with interest, compensation for mental agony and litigation costs, entirely at your risk as to costs.`
      : docType === "regulator_complaint"
        ? `5. I approached the opposite party first, but my grievance remains unresolved. I request this forum to direct ${party} to provide the relief sought above.`
        : `5. I request a written response within the timeline prescribed under the applicable rules, failing which I will escalate the matter to ${regulator?.forum ?? "the appropriate forum"}.`;

  return `Date: ${today}

From:
${name}
${city}
[Phone] | [Email]

To:
${to}

Subject: ${subject}

Sir/Madam,

1. I am a consumer of ${party}. The transaction / service in question is ${refs}, dated ${date}, involving ${amount}.

   Facts: ${intake.summary}

2. ${intake.already_complained ? "I raised this with your customer support earlier" : "I have tried to resolve this informally"} [complaint/ticket number, if any], but the issue remains unresolved as of the date of this letter.

3. Your conduct amounts to a deficiency in service / unfair trade practice. I rely on:
${lawLines}

4. I therefore request:
   (a) refund / reversal / replacement in respect of ${amount};
   (b) reasonable compensation for the inconvenience and loss caused; and
   (c) a written confirmation of the action taken.

${closing}

Enclosures:
${enclosures}

Yours faithfully,
${name}`;
}
