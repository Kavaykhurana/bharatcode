import type { Category, CategoryDef, LadderStepDef } from "./types";

/**
 * Curated, human-reviewed routing knowledge for Indian consumer grievances.
 * The model never invents forums, helplines or statutes — it only classifies
 * and drafts. Everything the user is told to *do* comes from this file.
 * Last reviewed: November 2026. Rules change; always verify on the linked portals.
 */

const NCH: LadderStepDef = {
  id: "nch",
  title: "National Consumer Helpline (pre-litigation)",
  forum: "Department of Consumer Affairs — National Consumer Helpline / INGRAM",
  how: "Register a grievance online, on WhatsApp or by phone. NCH forwards it to the company's nodal officer and tracks it — many cases settle here without a lawsuit.",
  links: [{ label: "consumerhelpline.gov.in", url: "https://consumerhelpline.gov.in" }],
  phones: ["1915", "WhatsApp 8800001915"],
  waitDays: 15
};

const LEGAL_NOTICE: LadderStepDef = {
  id: "legal_notice",
  title: "Send a legal notice",
  forum: "Opposite party (registered office)",
  how: "Send the Haq-drafted legal notice by Speed Post / registered post with acknowledgement and by email. Keep the postal receipt — it is evidence that you gave them a final chance.",
  links: [],
  waitDays: 15
};

const COMMISSION: LadderStepDef = {
  id: "consumer_commission",
  title: "File at the Consumer Commission",
  forum: "Consumer Disputes Redressal Commission (via e-Daakhil)",
  how: "File online on e-Daakhil — no lawyer is required. Attach your complaint, all correspondence, the legal notice and proof of payment.",
  links: [{ label: "edaakhil.nic.in", url: "https://edaakhil.nic.in" }],
  waitDays: 0,
  note: "Limitation: 2 years from the date the cause of action arose (Section 69, Consumer Protection Act, 2019)."
};

const CPA_LAW = {
  name: "Consumer Protection Act, 2019",
  point:
    "Covers defective goods, deficiency in service and unfair trade practices (Sections 2(11), 2(47)); complaints are filed with District / State / National Commissions based on value."
};

export const KNOWLEDGE: Record<Category, CategoryDef> = {
  banking_upi: {
    id: "banking_upi",
    label: "Banking / UPI / Cards",
    labelHi: "बैंकिंग / UPI / कार्ड",
    emoji: "🏦",
    regulatorStepId: "rbi_cms",
    laws: [
      {
        name: "RBI circular on TAT for failed transactions (RBI/2019-20/67, 20 Sep 2019)",
        point:
          "If your account is debited but the beneficiary is not credited in a UPI/IMPS transfer, the bank must auto-reverse by T+1 day; beyond that it owes ₹100 per day of delay as compensation. Failed ATM withdrawals: T+5 days, then ₹100/day."
      },
      {
        name: "Reserve Bank – Integrated Ombudsman Scheme, 2021",
        point:
          "Free remedy against banks, NBFCs and payment apps. File if the bank rejects your complaint or does not reply within 30 days; file within 1 year of the bank's reply."
      },
      CPA_LAW
    ],
    ladder: [
      {
        id: "bank_grievance",
        title: "Complain to the bank / payment app",
        forum: "Bank or app grievance redressal cell",
        how: "Raise a dispute in the UPI app (\"Raise dispute\" / \"Help\" on the transaction) AND email the bank's grievance cell. Get a complaint/ticket number in writing.",
        links: [{ label: "NPCI UPI dispute redressal", url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism" }],
        waitDays: 30,
        note: "The Ombudsman will not accept your case unless you complained to the bank first."
      },
      {
        id: "rbi_cms",
        title: "RBI Ombudsman (CMS portal)",
        forum: "Reserve Bank of India — Complaint Management System",
        how: "File online with your bank complaint number and the bank's reply (or proof that 30 days passed with no reply). No fee.",
        links: [{ label: "cms.rbi.org.in", url: "https://cms.rbi.org.in" }],
        phones: ["14448"],
        waitDays: 30
      },
      COMMISSION
    ],
    evidence: [
      "Transaction screenshot with UTR / RRN number, date and time",
      "Bank statement showing the debit",
      "Complaint / ticket number from the bank or UPI app",
      "Emails or chat transcripts with customer care",
      "Proof the beneficiary did not receive the money (their statement or message)"
    ],
    tips: [
      "Always quote the UTR/RRN — it is the single most important fact in a UPI dispute.",
      "Ask for compensation at ₹100/day of delay explicitly; banks rarely pay it unless asked."
    ]
  },

  cyber_fraud: {
    id: "cyber_fraud",
    label: "Cyber fraud / Unauthorised transaction",
    labelHi: "साइबर फ्रॉड / अनधिकृत लेनदेन",
    emoji: "🚨",
    regulatorStepId: "rbi_cms",
    laws: [
      {
        name: "RBI – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions (6 July 2017)",
        point:
          "Zero liability if you report a third-party fraud within 3 working days. Reporting in 4–7 working days caps your liability (up to ₹25,000 depending on the account). The bank must credit the amount (shadow reversal) within 10 working days of your report."
      },
      {
        name: "Information Technology Act, 2000",
        point: "Identity theft, cheating by impersonation and similar offences are punishable (Sections 66C, 66D); report to the cyber police."
      },
      {
        name: "Reserve Bank – Integrated Ombudsman Scheme, 2021",
        point: "If the bank does not resolve within 30 days, escalate to the RBI Ombudsman."
      }
    ],
    ladder: [
      {
        id: "report_1930",
        title: "Call 1930 and report on cybercrime.gov.in — NOW",
        forum: "National Cyber Crime Reporting Portal (I4C, MHA)",
        how: "Call 1930 immediately; funds can often be frozen in the fraudster's account if reported within hours. Then file the complaint online and save the acknowledgement number.",
        links: [{ label: "cybercrime.gov.in", url: "https://cybercrime.gov.in" }],
        phones: ["1930"],
        waitDays: 0
      },
      {
        id: "bank_grievance",
        title: "Block card/UPI and complain to the bank in writing",
        forum: "Bank fraud / grievance cell",
        how: "Block the card/UPI, then email the bank stating the transaction was unauthorised, quoting the 1930/cybercrime acknowledgement number. Ask for shadow reversal within 10 working days.",
        links: [],
        waitDays: 30
      },
      {
        id: "rbi_cms",
        title: "RBI Ombudsman (CMS portal)",
        forum: "Reserve Bank of India — Complaint Management System",
        how: "File if the bank denies liability or does not resolve within 30 days.",
        links: [{ label: "cms.rbi.org.in", url: "https://cms.rbi.org.in" }],
        phones: ["14448"],
        waitDays: 30
      },
      COMMISSION
    ],
    evidence: [
      "1930 call reference / cybercrime.gov.in acknowledgement number",
      "SMS / email alerts of the unauthorised debit",
      "Bank statement showing the transactions",
      "Screenshots of the fraudster's calls, messages, links or UPI IDs",
      "Written complaint to the bank with date and time of reporting"
    ],
    tips: [
      "Speed matters more than anything else here — report before you do anything else.",
      "Never share OTPs or install screen-sharing apps on the 'bank's' request."
    ]
  },

  ecommerce: {
    id: "ecommerce",
    label: "E-commerce / Online shopping",
    labelHi: "ई-कॉमर्स / ऑनलाइन शॉपिंग",
    emoji: "📦",
    regulatorStepId: "nch",
    laws: [
      CPA_LAW,
      {
        name: "Consumer Protection (E-Commerce) Rules, 2020",
        point:
          "Every platform must appoint a Grievance Officer who acknowledges complaints within 48 hours and redresses them within one month (Rule 4(5)). Platforms cannot refuse returns or refunds for defective, deficient or wrongly-delivered goods."
      }
    ],
    ladder: [
      {
        id: "company_grievance",
        title: "Write to the platform's Grievance Officer",
        forum: "Platform / seller grievance officer",
        how: "Find the Grievance Officer's name and email on the platform's 'Grievance redressal' page. Email them (not just chat support) with the order ID and the remedy you want.",
        links: [],
        waitDays: 30,
        note: "Rule 4(5): acknowledgement in 48 hours, resolution within one month."
      },
      NCH,
      LEGAL_NOTICE,
      COMMISSION
    ],
    evidence: [
      "Order ID, invoice and payment proof",
      "Unboxing video / photos of the defective or wrong product",
      "Chat transcripts and emails with support",
      "Screenshot of the product listing (description, return policy) at the time of purchase",
      "Grievance Officer complaint and any reply"
    ],
    tips: [
      "Record an unboxing video for expensive orders — it settles most 'wrong item' disputes.",
      "Ask for a specific remedy (refund of ₹X + compensation) rather than 'please help'."
    ]
  },

  telecom: {
    id: "telecom",
    label: "Telecom / Broadband / DTH",
    labelHi: "टेलीकॉम / ब्रॉडबैंड / DTH",
    emoji: "📶",
    regulatorStepId: "telecom_appellate",
    laws: [
      {
        name: "TRAI Telecom Consumers Complaint Redressal Regulations, 2012",
        point:
          "Every operator must run a complaint centre that issues a docket number, and an Appellate Authority to which you can appeal if the complaint is not resolved to your satisfaction."
      },
      CPA_LAW
    ],
    ladder: [
      {
        id: "complaint_centre",
        title: "Complaint centre — get a docket number",
        forum: "Operator's customer complaint centre",
        how: "Call 198 (toll-free complaint number) or use the operator's app. Insist on a docket number and note the promised resolution date.",
        links: [],
        phones: ["198"],
        waitDays: 15
      },
      {
        id: "telecom_appellate",
        title: "Appeal to the operator's Appellate Authority",
        forum: "Operator's Appellate Authority (details on the operator's website)",
        how: "File an appeal quoting the docket number. The Appellate Authority must decide within 39 days.",
        links: [],
        waitDays: 39,
        note: "TRAI does not resolve individual complaints itself; for spam / fraud calls use Sanchar Saathi (sancharsaathi.gov.in)."
      },
      NCH,
      COMMISSION
    ],
    evidence: [
      "Docket / complaint numbers with dates",
      "Bills showing wrong charges, or speed-test screenshots for broadband",
      "Plan details at the time of recharge / subscription",
      "Emails and SMS from the operator"
    ],
    tips: ["Escalations are faster if every call ends with a fresh docket number written down."]
  },

  insurance: {
    id: "insurance",
    label: "Insurance",
    labelHi: "बीमा",
    emoji: "🛡️",
    regulatorStepId: "ombudsman",
    laws: [
      {
        name: "IRDAI (Protection of Policyholders' Interests) framework",
        point: "Insurers must acknowledge a grievance promptly and resolve it within 14 days; reasons for rejecting a claim must be given in writing."
      },
      {
        name: "Insurance Ombudsman Rules, 2017 (as amended 2023)",
        point:
          "Free remedy for claim disputes up to ₹50 lakh. Approach after the insurer rejects your grievance or does not reply within 30 days, and within 1 year of the insurer's reply."
      },
      CPA_LAW
    ],
    ladder: [
      {
        id: "insurer_gro",
        title: "Complain to the insurer's Grievance Redressal Officer",
        forum: "Insurer's grievance cell (GRO)",
        how: "Email the GRO with the policy number and claim number; ask for written reasons if the claim was rejected.",
        links: [],
        waitDays: 14
      },
      {
        id: "bima_bharosa",
        title: "IRDAI Bima Bharosa",
        forum: "IRDAI — Bima Bharosa grievance portal",
        how: "Register the grievance online; it is tracked by the regulator.",
        links: [{ label: "bimabharosa.irdai.gov.in", url: "https://bimabharosa.irdai.gov.in" }],
        phones: ["155255", "1800 4254 732"],
        waitDays: 16
      },
      {
        id: "ombudsman",
        title: "Insurance Ombudsman",
        forum: "Council for Insurance Ombudsmen",
        how: "File online (Annexure VI-A form) with the rejection letter. No fee, no lawyer.",
        links: [{ label: "cioins.co.in", url: "https://www.cioins.co.in" }],
        waitDays: 90
      },
      COMMISSION
    ],
    evidence: [
      "Policy document and premium receipts",
      "Claim form, claim number and rejection / repudiation letter",
      "Hospital bills, discharge summary or loss assessment (as applicable)",
      "All emails with the insurer / TPA"
    ],
    tips: ["Read the exact clause the insurer relied on — many rejections cite exclusions that don't actually apply."]
  },

  airline: {
    id: "airline",
    label: "Airline / Flight",
    labelHi: "एयरलाइन / फ्लाइट",
    emoji: "✈️",
    regulatorStepId: "airsewa",
    laws: [
      {
        name: "DGCA CAR Section 3, Series M, Part IV",
        point:
          "Cancellation informed less than 2 weeks before departure (without an alternate within ±2 hours): refund plus compensation of ₹5,000 / ₹7,500 / ₹10,000 depending on block time. Denied boarding: 200% of basic fare + fuel charge (max ₹10,000) if alternate within 24h, 400% (max ₹20,000) beyond. Not payable for extraordinary circumstances (weather, etc.)."
      },
      {
        name: "DGCA CAR Section 3, Series M, Part II (refunds)",
        point: "Card payments must be refunded within 7 days; tickets bought through an agent within 30 days."
      },
      CPA_LAW
    ],
    ladder: [
      {
        id: "airline_nodal",
        title: "Complain to the airline's Nodal / Appellate officer",
        forum: "Airline grievance officer",
        how: "Email the airline's nodal officer (listed on its website) with PNR, flight number and the compensation you are owed under the CAR.",
        links: [],
        waitDays: 30
      },
      {
        id: "airsewa",
        title: "AirSewa (Ministry of Civil Aviation)",
        forum: "AirSewa grievance portal",
        how: "File the grievance with PNR and the airline's reply.",
        links: [{ label: "airsewa.gov.in", url: "https://airsewa.gov.in" }],
        waitDays: 30
      },
      COMMISSION
    ],
    evidence: [
      "E-ticket / boarding pass with PNR",
      "Cancellation / delay SMS or email with timestamps",
      "Payment proof and refund status",
      "Receipts for meals, hotel or alternate travel you paid for"
    ],
    tips: ["Quote the CAR clause and the exact rupee amount — airlines pay faster when you show you know the number."]
  },

  real_estate: {
    id: "real_estate",
    label: "Real estate / Builder",
    labelHi: "रियल एस्टेट / बिल्डर",
    emoji: "🏗️",
    regulatorStepId: "rera",
    laws: [
      {
        name: "Real Estate (Regulation and Development) Act, 2016 — Section 18",
        point: "If possession is delayed, the allottee can withdraw and get a full refund with interest, or stay and get interest for every month of delay."
      },
      {
        name: "RERA — Section 31",
        point: "Complaints against registered projects go to the State RERA authority / adjudicating officer."
      },
      {
        name: CPA_LAW.name,
        point: "Homebuyers may alternatively approach the Consumer Commission — the remedies run in parallel (Imperia Structures v. Anil Patni, Supreme Court, 2020)."
      }
    ],
    ladder: [
      {
        id: "builder_notice",
        title: "Written demand to the builder",
        forum: "Builder / promoter",
        how: "Email and post a demand quoting the agreement's possession date and RERA registration number.",
        links: [],
        waitDays: 15
      },
      {
        id: "rera",
        title: "Complaint to the State RERA",
        forum: "State Real Estate Regulatory Authority",
        how: "File online on your state's RERA portal (fee varies by state). Quote the project's RERA registration number.",
        links: [],
        waitDays: 60,
        note: "Find your state's RERA portal via the Ministry of Housing & Urban Affairs."
      },
      COMMISSION
    ],
    evidence: [
      "Builder–buyer agreement / allotment letter",
      "Payment receipts and bank statements",
      "Project RERA registration number and promised possession date",
      "All correspondence with the builder"
    ],
    tips: ["Check the project's RERA page — the builder's own declared completion date is strong evidence."]
  },

  general_consumer: {
    id: "general_consumer",
    label: "Consumer goods & services",
    labelHi: "उपभोक्ता सामान और सेवाएँ",
    emoji: "🧾",
    regulatorStepId: "nch",
    laws: [CPA_LAW],
    ladder: [
      {
        id: "company_grievance",
        title: "Written complaint to the company",
        forum: "Company customer care / grievance officer",
        how: "Email the company's grievance or nodal officer with invoice details and the remedy you want. Get a reference number.",
        links: [],
        waitDays: 15
      },
      NCH,
      LEGAL_NOTICE,
      COMMISSION
    ],
    evidence: [
      "Invoice / bill and payment proof",
      "Warranty card or service agreement",
      "Photos / videos of the defect",
      "All correspondence with the company"
    ],
    tips: ["Keep everything in writing — phone calls leave no evidence."]
  }
};

export function getCategory(id: Category): CategoryDef {
  return KNOWLEDGE[id];
}

/** Pecuniary jurisdiction under the Consumer Protection (Jurisdiction of the District, State and National Commissions) Rules, 2021. */
export function commissionFor(amountInr: number | null): { level: string; feeNote: string } {
  if (amountInr === null) {
    return {
      level: "District Commission (if the claim is up to ₹50 lakh)",
      feeNote: "No filing fee for claims up to ₹5 lakh."
    };
  }
  const feeNote = amountInr <= 500_000 ? "No filing fee — claim is up to ₹5 lakh." : "A small filing fee applies; e-Daakhil shows it at filing.";
  if (amountInr <= 5_000_000) return { level: "District Consumer Commission (claims up to ₹50 lakh)", feeNote };
  if (amountInr <= 20_000_000) return { level: "State Consumer Commission (₹50 lakh – ₹2 crore)", feeNote };
  return { level: "National Consumer Commission (above ₹2 crore)", feeNote };
}
