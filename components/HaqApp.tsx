"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { planToIcs } from "@/lib/ics";
import { KNOWLEDGE } from "@/lib/knowledge";
import type { AnalyzeEvent, CasePlan, DocType, Language } from "@/lib/types";

const REPO_URL = "https://github.com/Kavaykhurana/bharatcode";
const LIVE_URL = "https://haq-glqi.onrender.com";

const EXAMPLES: { label: string; labelHi: string; story: string }[] = [
  {
    label: "UPI transfer stuck",
    labelHi: "UPI पैसा अटका",
    story:
      "On 28 Oct 2026 I sent ₹4,500 via PhonePe from my HDFC Bank account to a shopkeeper. Money got debited (UTR 629814573021) but he never received it. HDFC customer care says wait, it's been days and no refund."
  },
  {
    label: "Defective phone",
    labelHi: "ख़राब फ़ोन",
    story:
      "Ordered a phone on Flipkart for ₹18,999 (order OD43215678901234) on 15 Oct 2026. It arrived with a dead display. Flipkart rejected my return saying 'physical damage', but it was dead on unboxing — I have the unboxing video."
  },
  {
    label: "Flight cancelled",
    labelHi: "फ्लाइट रद्द",
    story:
      "My IndiGo flight Delhi to Bengaluru (PNR: K7XQ2M) on 20 Oct 2026 was cancelled 3 hours before departure. They offered no alternate flight the same day and I still haven't got my ₹7,840 refund."
  },
  {
    label: "OTP fraud",
    labelHi: "OTP फ्रॉड",
    story:
      "Someone called pretending to be from SBI KYC team yesterday, I shared an OTP and ₹62,000 was debited from my account in two transactions. I didn't authorise it."
  },
  {
    label: "Claim rejected",
    labelHi: "क्लेम ख़ारिज",
    story:
      "Star Health rejected my father's hospitalisation claim of ₹1.8 lakh in Sep 2026 saying pre-existing disease, but he was diagnosed after the policy started 4 years ago."
  },
  {
    label: "Builder delay",
    labelHi: "बिल्डर की देरी",
    story:
      "मैंने 2021 में नोएडा में एक फ्लैट बुक किया था, ₹45 लाख दे चुका हूँ। पज़ेशन दिसंबर 2024 में मिलना था लेकिन बिल्डर अब तक टाल रहा है।"
  }
];

const T = {
  en: {
    heroTitle: "Know where to complain. Get it drafted.",
    heroBody: "Describe a consumer problem in your own words. Haq names the right forum, writes the complaint and tells you when to escalate.",
    heroCta: "Describe your problem",
    heroLink: "How it works",
    intakeTitle: "Tell us what happened.",
    intakeBody: "Plain words are enough. Include the company, the amount, the date and any order, UTR or PNR number you have.",
    intakeLabel: "Your complaint",
    placeholder: "On 28 October I paid ₹4,500 on UPI. The money left my account but never arrived…",
    examples: "Or start from an example",
    analyze: "Find my remedy",
    analyzing: "Working",
    caseFile: "Case file",
    ladder: "Where to go, in order",
    deadlines: "Dates that matter",
    laws: "The law on your side",
    evidence: "What to keep ready",
    missing: "Add these to strengthen the case",
    tips: "Before you write",
    draft: "Your draft",
    draftBody: "Choose a document. Haq fills in your facts and leaves a bracketed blank wherever something is missing.",
    generate: "Write the draft",
    regenerate: "Write it again",
    copy: "Copy",
    copied: "Copied",
    download: "Download .txt",
    print: "Print or save as PDF",
    calendar: "Add reminders to calendar",
    share: "Share on WhatsApp",
    yourName: "Your name",
    yourCity: "City",
    startOn: "Start",
    escalateOn: "Escalate if unresolved by",
    disclaimer:
      "Haq gives legal information, not legal advice. Forums, limits and timelines are curated from official sources and can change; verify on the linked portals before filing."
  },
  hi: {
    heroTitle: "कहाँ शिकायत करें, और क्या लिखें।",
    heroBody: "अपनी समस्या अपने शब्दों में लिखें। Haq सही मंच बताता है, शिकायत लिखता है और बताता है कि कब आगे बढ़ना है।",
    heroCta: "अपनी समस्या लिखें",
    heroLink: "यह कैसे काम करता है",
    intakeTitle: "बताइए क्या हुआ।",
    intakeBody: "सीधे शब्द काफ़ी हैं। कंपनी का नाम, राशि, तारीख और ऑर्डर / UTR / PNR नंबर लिखें, अगर हो।",
    intakeLabel: "आपकी शिकायत",
    placeholder: "28 अक्टूबर को मैंने UPI से ₹4,500 भेजे। पैसे कट गए लेकिन पहुँचे नहीं…",
    examples: "या किसी उदाहरण से शुरू करें",
    analyze: "मेरा समाधान खोजें",
    analyzing: "काम चल रहा है",
    caseFile: "केस फ़ाइल",
    ladder: "कहाँ जाएँ, किस क्रम में",
    deadlines: "ज़रूरी तारीख़ें",
    laws: "क़ानून आपके साथ",
    evidence: "ये तैयार रखें",
    missing: "केस मज़बूत करने के लिए यह जोड़ें",
    tips: "लिखने से पहले",
    draft: "आपका ड्राफ़्ट",
    draftBody: "दस्तावेज़ चुनें। Haq आपकी जानकारी भरता है और जो नहीं पता, वहाँ ब्रैकेट में खाली जगह छोड़ता है।",
    generate: "ड्राफ़्ट लिखें",
    regenerate: "दोबारा लिखें",
    copy: "कॉपी",
    copied: "कॉपी हुआ",
    download: ".txt डाउनलोड",
    print: "प्रिंट या PDF",
    calendar: "कैलेंडर में रिमाइंडर जोड़ें",
    share: "WhatsApp पर भेजें",
    yourName: "आपका नाम",
    yourCity: "शहर",
    startOn: "शुरू",
    escalateOn: "हल न हो तो आगे बढ़ें",
    disclaimer:
      "Haq क़ानूनी जानकारी देता है, क़ानूनी सलाह नहीं। नियम आधिकारिक स्रोतों से लिए गए हैं और बदल सकते हैं; शिकायत से पहले लिंक किए गए पोर्टल पर जाँच लें।"
  }
} as const;

type Strings = (typeof T)[Language];

const DOC_LABELS: Record<DocType, { en: string; hi: string }> = {
  company_complaint: { en: "Complaint to the company", hi: "कंपनी को शिकायत" },
  legal_notice: { en: "Legal notice", hi: "विधिक नोटिस" },
  regulator_complaint: { en: "Regulator or ombudsman", hi: "नियामक / लोकपाल" }
};

const STEP_LABELS = {
  classify: { en: "Reading the complaint", hi: "शिकायत पढ़ना" },
  route: { en: "Finding the forum and the law", hi: "सही मंच और क़ानून" },
  plan: { en: "Setting the dates", hi: "तारीख़ें तय करना" }
} as const;

type StepId = keyof typeof STEP_LABELS;
type StepState = { status: "running" | "done"; detail?: string };
const FALLBACK_MARKER = "\u0000HAQ_FALLBACK\u0000";
const KEY_STORAGE = "haq.bharatcodeKey";

/* ---------- small helpers ---------- */

function readStorage(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // storage unavailable (private mode) — the key just won't persist
  }
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string | null, lang: Language): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function cleanDraft(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ArrowIcon() {
  return (
    <svg className="arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" />
    </svg>
  );
}

function ArrowCircle() {
  return (
    <span className="arrow-circle" aria-hidden="true">
      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 5h5M5.5 3 7.5 5l-2 2" />
      </svg>
    </span>
  );
}

function Mark() {
  return (
    <svg className="nav-mark" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3v14M4 6h12" />
      <path d="M4 6 2 11a2.2 2.2 0 0 0 4 0L4 6ZM16 6l-2 5a2.2 2.2 0 0 0 4 0l-2-5Z" />
      <path d="M7 17h6" />
    </svg>
  );
}

/* ---------- page ---------- */

export default function HaqApp() {
  const [lang, setLang] = useState<Language>("en");
  const [story, setStory] = useState("");
  const [steps, setSteps] = useState<Partial<Record<StepId, StepState>>>({});
  const [plan, setPlan] = useState<CasePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const t = T[lang];

  useEffect(() => {
    setApiKey(readStorage(KEY_STORAGE));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const headers = useCallback((): HeadersInit => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey.trim()) h["x-bharatcode-key"] = apiKey.trim();
    return h;
  }, [apiKey]);

  async function analyze() {
    if (story.trim().length < 20) {
      setError(lang === "hi" ? "कृपया थोड़ा और विस्तार से लिखें (कम से कम 20 अक्षर)।" : "Please describe the problem in a little more detail — at least 20 characters.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setPlan(null);
    setSteps({});

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ story, language: lang, today: localToday() }),
        signal: controller.signal
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const event = JSON.parse(line) as AnalyzeEvent;
          if (event.type === "step") setSteps((s) => ({ ...s, [event.id]: { status: event.status, detail: event.detail } }));
          else if (event.type === "result") {
            setPlan(event.plan);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
          } else if (event.type === "error") throw new Error(event.message);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  return (
    <>
      <div className="nav-wrap no-print">
        <nav className="nav-pill" aria-label="Primary">
          <a href="#top" className="nav-link" aria-label="Haq, home" style={{ padding: "6px 8px 6px 0", display: "inline-flex", alignItems: "center" }}>
            <Mark />
            <span>Haq</span>
          </a>
          <a href="#how" className="nav-link nav-link--optional">
            {lang === "hi" ? "कैसे" : "How it works"}
          </a>
          <a href="#coverage" className="nav-link nav-link--optional">
            {lang === "hi" ? "दायरा" : "Coverage"}
          </a>
          <button type="button" className="nav-link" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => setLang(lang === "en" ? "hi" : "en")} aria-label="Switch language">
            {lang === "en" ? "हिन्दी" : "English"}
          </button>
          <button type="button" className="btn btn--secondary" style={{ marginLeft: 4 }} onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
            API key
          </button>
        </nav>
      </div>

      {showSettings && <SettingsPanel apiKey={apiKey} setApiKey={setApiKey} onClose={() => setShowSettings(false)} />}

      <header id="top" className="hero hero--inset haq-hero no-print">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="scene" src="/scenes/meadow.svg" alt="" />
        <div className="hero-inner">
          <div className="card-frosted stack-16">
            <h1 className="t-display t-balance">{t.heroTitle}</h1>
            <p className="t-body" style={{ color: "inherit", maxWidth: "44ch" }}>
              {t.heroBody}
            </p>
            <div className="row">
              <a href="#intake" className="btn btn--on-dark btn--lg">
                {t.heroCta}
              </a>
              <a href="#how" className="link-arrow" style={{ color: "#ffffff" }}>
                {t.heroLink}
                <ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        <section id="intake" className="section no-print" style={{ scrollMarginTop: 80 }}>
          <div className="wrap grid-12">
            <div className="span-5 stack-16">
              <h2 className="t-heading t-balance">{t.intakeTitle}</h2>
              <p className="t-body t-measure t-muted">{t.intakeBody}</p>
              <ul className="list-rule" style={{ marginTop: 24 }}>
                {(lang === "hi"
                  ? ["सही मंच, सही क्रम में", "तारीख़ों के साथ योजना", "अंग्रेज़ी या हिंदी में ड्राफ़्ट"]
                  : ["The right forum, in the right order", "A dated plan with every deadline", "A draft in English or Hindi"]
                ).map((line) => (
                  <li key={line} className="t-body-sm">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="span-7">
              <div className="card stack-16" style={{ padding: 24 }}>
                <div className="field">
                  <label className="field-label" htmlFor="story">
                    {t.intakeLabel}
                  </label>
                  <textarea
                    id="story"
                    className="textarea"
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
                    }}
                    rows={7}
                    maxLength={4000}
                    placeholder={t.placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "story-err" : "story-hint"}
                  />
                  {error ? (
                    <p className="field-error" id="story-err" role="alert">
                      {error}
                    </p>
                  ) : (
                    <p className="field-hint" id="story-hint">
                      {story.length}/4000 · {lang === "hi" ? "Ctrl + Enter से भेजें" : "Ctrl + Enter to submit"}
                    </p>
                  )}
                </div>

                <div className="stack-8">
                  <p className="t-caption">{t.examples}</p>
                  <div className="row" style={{ gap: 8 }}>
                    {EXAMPLES.map((ex) => (
                      <button key={ex.label} type="button" className="tag" onClick={() => setStory(ex.story)}>
                        {lang === "hi" ? ex.labelHi : ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row" style={{ justifyContent: "flex-end", paddingTop: 8 }}>
                  <button type="button" className="btn btn--primary btn--lg" onClick={analyze} disabled={busy} aria-busy={busy || undefined}>
                    {busy ? `${t.analyzing}…` : t.analyze}
                    {!busy && <ArrowCircle />}
                  </button>
                </div>
              </div>

              {(busy || Object.keys(steps).length > 0) && (
                <ol className="list-rule" style={{ marginTop: 24 }} aria-live="polite">
                  {(Object.keys(STEP_LABELS) as StepId[]).map((id, i) => {
                    const s = steps[id];
                    return (
                      <li key={id} className="flex items-start gap-3">
                        <span className="numeral">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                            <span className="t-label">{STEP_LABELS[id][lang]}</span>
                            {s?.status === "done" ? (
                              <span className="tag tag--moss">
                                <span className="dot" />
                                {lang === "hi" ? "पूरा" : "Done"}
                              </span>
                            ) : s ? (
                              <span className="tag tag--blue">
                                <span className="dot" />
                                {t.analyzing}
                              </span>
                            ) : (
                              <span className="tag">{lang === "hi" ? "प्रतीक्षा" : "Waiting"}</span>
                            )}
                          </div>
                          {s?.detail && <p className="t-caption" style={{ marginTop: 6 }}>{s.detail}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </section>

        {plan && (
          <section ref={resultRef} className="section section--paper section--rule" style={{ scrollMarginTop: 72 }} aria-label={t.caseFile}>
            <Results plan={plan} story={story} lang={lang} t={t} headers={headers} />
          </section>
        )}

        <HowItWorks />
        <Coverage />

        <section className="section no-print" aria-label="Cyber fraud">
          <div className="wrap">
            <div className="card-atmos stack-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="scene" src="/scenes/sky.svg" alt="" />
              <h2 className="t-heading-lg t-measure-narrow t-balance">Lost money to a scam? Call 1930 before anything else.</h2>
              <p className="t-body t-measure">
                Funds can often be frozen in the fraudster&apos;s account if the report reaches the cyber-crime helpline within hours. Report it, then come back here for the bank complaint and the zero-liability deadline.
              </p>
              <div className="row">
                <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="btn btn--on-dark btn--lg">
                  Open cybercrime.gov.in
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer no-print">
        <div className="wrap stack-48">
          <p className="footer-statement">Every consumer in India has rights. Few know where to use them.</p>
          <div className="grid-12" style={{ alignItems: "end" }}>
            <div className="span-7 stack-12">
              <p className="footer-meta t-measure">{t.disclaimer}</p>
              <p className="footer-meta">Built by Team AlphaFire for the BharatCode Build League · Powered by the BharatCode model API · MIT licence</p>
            </div>
            <ul className="footer-links span-5" style={{ justifyContent: "flex-end" }}>
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  Source on GitHub
                </a>
              </li>
              <li>
                <a href="https://bharatcode.ai/hackathon" target="_blank" rel="noreferrer">
                  BharatCode Build League
                </a>
              </li>
              <li>
                <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer">
                  National Consumer Helpline
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ---------- settings ---------- */

function SettingsPanel({ apiKey, setApiKey, onClose }: { apiKey: string; setApiKey: (v: string) => void; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="card settings-pop stack-16 no-print" role="dialog" aria-label="BharatCode API key" style={{ padding: 20 }}>
      <div className="field">
        <label className="field-label" htmlFor="key">
          BharatCode API key
        </label>
        <input ref={inputRef} id="key" type="password" autoComplete="off" className="input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your key" aria-describedby="key-hint" />
        <p className="field-hint" id="key-hint">
          Optional. Stored only in this browser. Leave empty to use the server&apos;s key; with no key at all Haq runs in offline mode.
        </p>
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setApiKey("");
            writeStorage(KEY_STORAGE, "");
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            writeStorage(KEY_STORAGE, apiKey.trim());
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ---------- results ---------- */

function Results({ plan, story, lang, t, headers }: { plan: CasePlan; story: string; lang: Language; t: Strings; headers: () => HeadersInit }) {
  const { intake } = plan;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const urgent = plan.deadlines.filter((d) => d.urgent);
  const ready = Object.values(checked).filter(Boolean).length;

  const shareText = useMemo(
    () =>
      `My consumer complaint plan from Haq (${plan.category.label}):\n${plan.steps
        .map((s) => `${s.order}) ${s.title}${s.links[0] ? ` — ${s.links[0].url}` : ""}`)
        .join("\n")}\n\nMake yours: ${LIVE_URL}`,
    [plan]
  );

  return (
    <div className="wrap stack-48">
      <div className="grid-12">
        <div className="span-8 stack-12">
          <div className="row" style={{ gap: 8 }}>
            <span className="t-caption">{t.caseFile}</span>
            <span className={plan.mode === "ai" ? "tag tag--moss" : "tag"} title={plan.mode === "ai" ? "Classified by the BharatCode model" : "Classified by the offline rule engine"}>
              {plan.mode === "ai" ? `BharatCode model · ${Math.round(intake.confidence * 100)}% confident` : "Offline mode"}
            </span>
          </div>
          <h2 className="t-heading-lg t-balance">{lang === "hi" ? plan.category.labelHi : plan.category.label}</h2>
          <p className="t-body t-measure">{intake.summary}</p>
        </div>
      </div>

      {urgent.length > 0 && (
        <div className="card card--urgent stack-12" role="alert" style={{ padding: 20 }}>
          {urgent.map((d) => (
            <div key={d.label} className="stack-4">
              <div className="row" style={{ gap: 8 }}>
                <span className="tag tag--ember">
                  <span className="dot" />
                  {lang === "hi" ? "तुरंत" : "Urgent"}
                </span>
                <span className="t-label t-ink">
                  {d.label}
                  {d.date ? ` — ${formatDate(d.date, lang)}` : ""}
                </span>
              </div>
              <p className="t-body-sm">{d.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="stack-12">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact label={lang === "hi" ? "किसके ख़िलाफ़" : "Against"} value={intake.opposite_party ?? "—"} />
        <Fact label={lang === "hi" ? "राशि" : "Amount"} value={intake.amount_inr !== null ? `₹${intake.amount_inr.toLocaleString("en-IN")}` : "—"} />
        <Fact label={lang === "hi" ? "घटना" : "Incident"} value={formatDate(intake.incident_date, lang)} />
        <Fact label={lang === "hi" ? "संदर्भ" : "References"} value={intake.reference_ids.join(", ") || "—"} />
      </dl>
      {plan.commission && (
        <p className="t-caption">
          <b style={{ fontWeight: 500, color: "var(--color-charcoal)" }}>{lang === "hi" ? "अगर मामला आयोग तक जाए:" : "If it reaches a commission:"}</b> {plan.commission.level}. {plan.commission.feeNote}
        </p>
      )}
      </div>

      <div className="grid-12">
        <div className="span-7 stack-16">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 className="t-heading-sm">{t.ladder}</h3>
          </div>
          <ol className="list-rule">
            {plan.steps.map((s) => (
              <li key={s.id} className="flex gap-4">
                <span className="numeral">{s.order}</span>
                <div className="min-w-0 flex-1 stack-8">
                  <div>
                    <p className="t-subheading">{s.title}</p>
                    <p className="t-caption" style={{ marginTop: 4 }}>
                      {s.forum}
                    </p>
                  </div>
                  <p className="t-body-sm">{s.how}</p>
                  <p className="t-caption">
                    {t.startOn} {formatDate(s.startOn, lang)}
                    {s.escalateOn && (
                      <>
                        {" · "}
                        {t.escalateOn} <span className="t-ink">{formatDate(s.escalateOn, lang)}</span>
                      </>
                    )}
                  </p>
                  {(s.links.length > 0 || s.phones) && (
                    <div className="row" style={{ gap: 8 }}>
                      {s.links.map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="tag tag--blue">
                          {l.label}
                        </a>
                      ))}
                      {s.phones?.map((p) => (
                        <a key={p} href={`tel:${p.replace(/[^\d]/g, "")}`} className="tag">
                          {p}
                        </a>
                      ))}
                    </div>
                  )}
                  {s.note && <p className="t-caption" style={{ fontStyle: "italic" }}>{s.note}</p>}
                </div>
              </li>
            ))}
          </ol>
          <div className="row no-print">
            <button type="button" className="btn btn--secondary" onClick={() => downloadFile("haq-escalation-plan.ics", planToIcs(plan), "text/calendar")}>
              {t.calendar}
            </button>
            <a className="btn btn--secondary" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
              {t.share}
            </a>
          </div>
        </div>

        <div className="span-5 stack-32">
          <div className="stack-16">
            <h3 className="t-heading-sm">{t.deadlines}</h3>
            <ul className="list-rule">
              {plan.deadlines.map((d) => (
                <li key={d.label} className="stack-4">
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <span className={`t-label ${d.urgent ? "" : "t-ink"}`} style={d.urgent ? { color: "var(--color-ember)" } : undefined}>
                      {d.label}
                    </span>
                    {d.date && <span className="t-caption t-ink" style={{ fontVariantNumeric: "tabular-nums" }}>{formatDate(d.date, lang)}</span>}
                  </div>
                  <p className="t-caption">{d.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="stack-16">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 className="t-heading-sm">{t.evidence}</h3>
              <span className="t-caption">
                {ready}/{plan.evidence.length}
              </span>
            </div>
            <ul className="list-rule">
              {plan.evidence.map((e, i) => (
                <li key={e} style={{ paddingBlock: 12 }}>
                  <label className="check">
                    <input type="checkbox" checked={!!checked[i]} onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))} />
                    <span style={checked[i] ? { color: "var(--color-ash)", textDecoration: "line-through" } : undefined}>{e}</span>
                  </label>
                </li>
              ))}
            </ul>
            {intake.missing_info.length > 0 && (
              <div className="card card--flat stack-8" style={{ background: "var(--color-linen)" }}>
                <p className="t-label">{t.missing}</p>
                <ul className="stack-4" style={{ paddingLeft: 18, listStyle: "disc" }}>
                  {intake.missing_info.map((m) => (
                    <li key={m} className="t-body-sm">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-12">
        <div className="span-7 stack-16">
          <h3 className="t-heading-sm">{t.laws}</h3>
          <ul className="list-rule">
            {plan.laws.map((l) => (
              <li key={l.name} className="stack-4">
                <p className="t-label t-ink" style={{ lineHeight: 1.4 }}>
                  {l.name}
                </p>
                <p className="t-body-sm t-muted">{l.point}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="span-5 stack-16">
          <h3 className="t-heading-sm">{t.tips}</h3>
          <ul className="list-rule">
            {plan.tips.map((tip) => (
              <li key={tip} className="t-body-sm">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <DraftPanel plan={plan} story={story} lang={lang} t={t} headers={headers} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card--flat stack-4" style={{ background: "var(--color-linen)" }}>
      <dt className="t-caption">{label}</dt>
      <dd className="t-subheading truncate" title={value} style={{ margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}

/* ---------- draft ---------- */

function DraftPanel({ plan, story, lang, t, headers }: { plan: CasePlan; story: string; lang: Language; t: Strings; headers: () => HeadersInit }) {
  const [docType, setDocType] = useState<DocType>("company_complaint");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromTemplate, setFromTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function generate() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setDraft("");
    setFromTemplate(false);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ intake: plan.intake, story, docType, language: lang, complainant: { name, city }, today: localToday() }),
        signal: controller.signal
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
      }
      if (res.headers.get("X-Haq-Mode") === "offline") setFromTemplate(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const marker = text.indexOf(FALLBACK_MARKER);
        if (marker !== -1) {
          text = text.slice(marker + FALLBACK_MARKER.length);
          setFromTemplate(true);
        }
        setDraft(cleanDraft(text));
      }
      text += decoder.decode();
      setDraft(cleanDraft(text).trim());
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Drafting failed");
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  return (
    <div className="card stack-24" style={{ padding: 24 }}>
      <div className="no-print stack-16">
        <div className="stack-8">
          <h3 className="t-heading-sm">{t.draft}</h3>
          <p className="t-body-sm t-muted t-measure">{t.draftBody}</p>
        </div>
        <div className="segmented" role="tablist" aria-label="Document type">
          {(Object.keys(DOC_LABELS) as DocType[]).map((d) => (
            <button key={d} type="button" role="tab" aria-selected={docType === d} onClick={() => setDocType(d)}>
              {DOC_LABELS[d][lang]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="field">
            <label className="field-label" htmlFor="name">
              {t.yourName}
            </label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="city">
              {t.yourCity}
            </label>
            <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} autoComplete="address-level2" />
          </div>
          <button type="button" className="btn btn--primary btn--lg" onClick={generate} disabled={busy} aria-busy={busy || undefined}>
            {busy ? `${t.analyzing}…` : draft ? t.regenerate : t.generate}
            {!busy && <ArrowCircle />}
          </button>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {(draft || busy) && (
        <div className="stack-12">
          {fromTemplate && <p className="t-caption no-print">Written from Haq&apos;s offline template. Fill the bracketed blanks before you send it.</p>}
          {busy && !draft && <div className="skeleton no-print" style={{ height: 240 }} aria-hidden="true" />}
          {draft && (
            <>
              <label className="sr-only" htmlFor="draft">
                {t.draft}
              </label>
              <textarea
                id="draft"
                lang={lang}
                className="textarea draft-editor no-print"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.min(32, Math.max(14, draft.split("\n").length + 2))}
              />
              <pre className="print-only" style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "12pt", lineHeight: 1.6 }}>
                {draft}
              </pre>
              <div className="row no-print">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(draft);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {
                      setError("Clipboard access is blocked in this browser. Select the text and copy it manually.");
                    }
                  }}
                >
                  {copied ? t.copied : t.copy}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => downloadFile(`haq-${docType}.txt`, draft, "text/plain;charset=utf-8")}>
                  {t.download}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => window.print()}>
                  {t.print}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- editorial sections ---------- */

function HowItWorks() {
  return (
    <section id="how" className="section section--paper section--rule no-print" style={{ scrollMarginTop: 72 }}>
      <div className="wrap grid-12" style={{ alignItems: "center" }}>
        <div className="span-6 stack-16">
          <p className="t-caption">How it works</p>
          <h2 className="t-heading t-balance">The model reads and writes. It never decides where you go.</h2>
          <p className="t-body t-measure">
            An intake agent on the BharatCode model turns your words into facts. A rules file, reviewed by people, picks the forum, the order of escalation and the law. A planner computes the dates. A second agent drafts the letter from those facts alone.
          </p>
          <p className="t-body t-measure">If the model is unavailable, a rule-based classifier and template drafts take over, so the plan is always there.</p>
          <p className="figure-caption">
            <b>Figure 1.</b> Two agents, one rules file. Helplines, sections and deadlines come only from the rules file, so they cannot be invented.
          </p>
        </div>
        <div className="span-6">
          <figure className="card-diagram">
            <PipelineDiagram />
          </figure>
        </div>
      </div>
    </section>
  );
}

function PipelineDiagram() {
  const box = (x: number, y: number, w: number, label: string, sub: string) => (
    <g key={label}>
      <rect x={x} y={y} width={w} height="56" rx="8" fill="#ffffff" stroke="#282834" strokeWidth="1" />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="13" fontWeight="500" fill="#2c2c2c">
        {label}
      </text>
      <text x={x + w / 2} y={y + 42} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11" fill="#646464">
        {sub}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label="Pipeline: your words go to the intake agent, then the rules file and planner, then the drafting agent, producing documents and reminders.">
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0 8 4 0 8" fill="none" stroke="#282834" strokeWidth="1" />
        </marker>
      </defs>
      <g fill="none" stroke="#282834" strokeWidth="1" markerEnd="url(#arr)">
        <path d="M260 66v34" />
        <path d="M260 156v34" />
        <path d="M200 218H150" />
        <path d="M260 246v34" />
      </g>
      <path d="M360 128h75v56" fill="none" stroke="#b4b8b4" strokeDasharray="3 4" markerEnd="url(#arr)" />
      <path d="M435 246v62h-69" fill="none" stroke="#b4b8b4" strokeDasharray="3 4" markerEnd="url(#arr)" />
      {box(170, 10, 180, "Your words", "English · हिन्दी · Hinglish")}
      {box(160, 100, 200, "Intake agent", "BharatCode model → JSON")}
      {box(200, 190, 120, "Rules file", "forums · laws")}
      {box(20, 190, 130, "Planner", "dates · tiers")}
      {box(370, 190, 130, "Fallback", "if the model fails")}
      {box(160, 280, 200, "Drafting agent", "streamed, grounded")}
      <text x="260" y="372" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11" fill="#646464">
        Complaint · Legal notice · Ombudsman text · Calendar reminders
      </text>
    </svg>
  );
}

function Coverage() {
  const rows = Object.values(KNOWLEDGE);
  return (
    <section id="coverage" className="section section--rule no-print" style={{ scrollMarginTop: 72 }}>
      <div className="wrap stack-32">
        <div className="grid-12">
          <div className="span-8 stack-12">
            <p className="t-caption">Coverage</p>
            <h2 className="t-heading-lg t-balance">Eight kinds of trouble, each with its own ladder.</h2>
          </div>
        </div>
        <div className="card card--flat" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table coverage-table">
            <thead>
              <tr>
                <th scope="col">Problem</th>
                <th scope="col">First stop</th>
                <th scope="col">Then</th>
                <th scope="col">Key rule</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="t-ink" style={{ fontWeight: 500 }}>
                    {c.label}
                  </td>
                  <td>{c.ladder[0].title}</td>
                  <td>{c.ladder.slice(1).map((s) => s.title.replace(/ —.*$/, "")).join(" → ")}</td>
                  <td className="t-muted">{c.laws[0].name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
