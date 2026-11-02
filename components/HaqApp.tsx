"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { planToIcs } from "@/lib/ics";
import type { AnalyzeEvent, CasePlan, DocType, Language } from "@/lib/types";

const EXAMPLES: { label: string; story: string }[] = [
  {
    label: "💸 UPI stuck",
    story:
      "On 28 Oct 2026 I sent ₹4,500 via PhonePe from my HDFC Bank account to a shopkeeper. Money got debited (UTR 629814573021) but he never received it. HDFC customer care says wait, it's been days and no refund."
  },
  {
    label: "📦 Defective phone",
    story:
      "Ordered a phone on Flipkart for ₹18,999 (order OD43215678901234) on 15 Oct 2026. It arrived with a dead display. Flipkart rejected my return saying 'physical damage', but it was dead on unboxing — I have the unboxing video."
  },
  {
    label: "✈️ Flight cancelled",
    story:
      "My IndiGo flight Delhi to Bengaluru (PNR: K7XQ2M) on 20 Oct 2026 was cancelled 3 hours before departure. They offered no alternate flight the same day and I still haven't got my ₹7,840 refund."
  },
  {
    label: "🚨 OTP fraud",
    story:
      "Someone called pretending to be from SBI KYC team yesterday, I shared an OTP and ₹62,000 was debited from my account in two transactions. I didn't authorise it."
  },
  {
    label: "🛡️ Claim rejected",
    story:
      "Star Health rejected my father's hospitalisation claim of ₹1.8 lakh in Sep 2026 saying pre-existing disease, but he was diagnosed after the policy started 4 years ago."
  },
  {
    label: "🏗️ Builder delay",
    story:
      "मैंने 2021 में नोएडा में एक फ्लैट बुक किया था, ₹45 लाख दे चुका हूँ। पज़ेशन दिसंबर 2024 में मिलना था लेकिन बिल्डर अब तक टाल रहा है।"
  }
];

const T = {
  en: {
    tagline: "Know where to complain. Get it drafted. Know when to escalate.",
    placeholder:
      "Describe what happened, in English, Hindi or Hinglish. Include the company, amount, date and any order / UTR / PNR number if you have it…",
    analyze: "Find my remedy",
    analyzing: "Working…",
    tryExample: "Try an example",
    caseFile: "Case file",
    ladder: "Escalation ladder",
    deadlines: "Deadlines",
    laws: "Your rights — the law on your side",
    evidence: "Evidence checklist",
    missing: "Add these to strengthen your case",
    draft: "Draft",
    generate: "Generate draft",
    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Copied",
    download: "Download .txt",
    print: "Print / PDF",
    calendar: "Add reminders to calendar",
    share: "Share on WhatsApp",
    yourName: "Your name",
    yourCity: "City",
    startOn: "Start",
    escalateOn: "Escalate if unresolved by",
    disclaimer:
      "Haq gives legal information, not legal advice. Forum rules and limits are curated from official sources and may change — verify on the linked portals before filing."
  },
  hi: {
    tagline: "कहाँ शिकायत करें, क्या लिखें, और कब आगे बढ़ें — सब एक जगह।",
    placeholder: "क्या हुआ, अपने शब्दों में लिखें — कंपनी का नाम, राशि, तारीख और ऑर्डर / UTR / PNR नंबर (अगर हो)…",
    analyze: "मेरा समाधान खोजें",
    analyzing: "काम चल रहा है…",
    tryExample: "उदाहरण आज़माएँ",
    caseFile: "केस फ़ाइल",
    ladder: "शिकायत की सीढ़ी",
    deadlines: "समय-सीमाएँ",
    laws: "आपके अधिकार — क़ानून आपके साथ",
    evidence: "सबूतों की सूची",
    missing: "केस मज़बूत करने के लिए यह जोड़ें",
    draft: "ड्राफ़्ट",
    generate: "ड्राफ़्ट बनाएँ",
    regenerate: "दोबारा बनाएँ",
    copy: "कॉपी",
    copied: "कॉपी हुआ",
    download: ".txt डाउनलोड",
    print: "प्रिंट / PDF",
    calendar: "कैलेंडर में रिमाइंडर जोड़ें",
    share: "WhatsApp पर भेजें",
    yourName: "आपका नाम",
    yourCity: "शहर",
    startOn: "शुरू",
    escalateOn: "हल न हो तो आगे बढ़ें",
    disclaimer:
      "Haq क़ानूनी जानकारी देता है, क़ानूनी सलाह नहीं। नियम आधिकारिक स्रोतों से लिए गए हैं और बदल सकते हैं — शिकायत से पहले लिंक किए गए पोर्टल पर जाँच लें।"
  }
} as const;

const DOC_LABELS: Record<DocType, { en: string; hi: string }> = {
  company_complaint: { en: "Complaint to company", hi: "कंपनी को शिकायत" },
  legal_notice: { en: "Legal notice", hi: "विधिक नोटिस" },
  regulator_complaint: { en: "Regulator / Ombudsman", hi: "नियामक / लोकपाल" }
};

const STEP_LABELS = {
  classify: { en: "Understanding your complaint", hi: "शिकायत समझना" },
  route: { en: "Finding the right forum & law", hi: "सही मंच और क़ानून" },
  plan: { en: "Building your timeline", hi: "समय-रेखा बनाना" }
} as const;

type StepState = { status: "running" | "done"; detail?: string };
const FALLBACK_MARKER = "\u0000HAQ_FALLBACK\u0000";
const KEY_STORAGE = "haq.bharatcodeKey";

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
    // storage unavailable (private mode) — key just won't persist
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

export default function HaqApp() {
  const [lang, setLang] = useState<Language>("en");
  const [story, setStory] = useState("");
  const [steps, setSteps] = useState<Partial<Record<keyof typeof STEP_LABELS, StepState>>>({});
  const [plan, setPlan] = useState<CasePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const t = T[lang];

  useEffect(() => {
    setApiKey(readStorage(KEY_STORAGE));
  }, []);

  const headers = useCallback((): HeadersInit => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey.trim()) h["x-bharatcode-key"] = apiKey.trim();
    return h;
  }, [apiKey]);

  async function analyze() {
    if (story.trim().length < 20) {
      setError(lang === "hi" ? "कृपया थोड़ा और विस्तार से लिखें (कम से कम 20 अक्षर)।" : "Please describe the problem in a bit more detail (at least 20 characters).");
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
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <header className="no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-saffron-500 to-leaf-500 text-lg font-black text-ink-950">ह</div>
          <div>
            <div className="text-lg font-bold leading-none">
              Haq <span className="font-devanagari text-saffron-400">हक़</span>
            </div>
            <div className="text-xs text-zinc-500">Consumer-rights agent for India</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-ink-600 bg-ink-800 p-0.5 text-xs">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-lg px-3 py-1.5 transition ${lang === l ? "bg-saffron-500 font-semibold text-ink-950" : "text-zinc-400 hover:text-white"}`}
                aria-pressed={lang === l}
              >
                {l === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
          <button className="btn-ghost whitespace-nowrap px-3 py-1.5 text-xs" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings} aria-label="API key settings">
            ⚙︎<span className="hidden sm:inline"> API key</span>
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="card no-print mt-4">
          <label className="label" htmlFor="key">
            BharatCode API key (optional — stored only in this browser)
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bc-…"
              className="flex-1 rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-saffron-500"
            />
            <button
              className="btn-primary"
              onClick={() => {
                writeStorage(KEY_STORAGE, apiKey.trim());
                setShowSettings(false);
              }}
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Leave empty to use the server&apos;s key. Without any key Haq still works in offline mode (rule-based classifier + template drafts).
          </p>
        </div>
      )}

      <section className="no-print mt-10 text-center">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          {lang === "hi" ? (
            <span className="font-devanagari">आपका हक़, आपकी भाषा में।</span>
          ) : (
            <>
              Your money. Your rights. <span className="text-saffron-400">Your Haq.</span>
            </>
          )}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-zinc-400">{t.tagline}</p>
      </section>

      <section className="card no-print mt-8">
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
          }}
          rows={6}
          maxLength={4000}
          placeholder={t.placeholder}
          className="w-full resize-y rounded-xl border border-ink-600 bg-ink-950 p-4 text-[15px] leading-relaxed outline-none placeholder:text-zinc-600 focus:border-saffron-500"
          aria-label="Describe your complaint"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label mr-1">{t.tryExample}</span>
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="chip" onClick={() => setStory(ex.story)}>
                {ex.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-zinc-600">{story.length}/4000</span>
            <button className="btn-primary min-w-40" onClick={analyze} disabled={busy}>
              {busy ? t.analyzing : `${t.analyze} →`}
            </button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
      </section>

      {(busy || Object.keys(steps).length > 0) && (
        <section className="no-print mt-4 grid gap-2 sm:grid-cols-3" aria-live="polite">
          {(Object.keys(STEP_LABELS) as (keyof typeof STEP_LABELS)[]).map((id, i) => {
            const s = steps[id];
            return (
              <div key={id} className={`rounded-xl border px-4 py-3 text-sm transition ${s?.status === "done" ? "border-leaf-500/40 bg-leaf-500/5" : s ? "border-saffron-500/50 bg-saffron-500/5" : "border-ink-700 bg-ink-900/50 opacity-50"}`}>
                <div className="flex items-center gap-2 font-medium">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${s?.status === "done" ? "bg-leaf-500 text-white" : s ? "animate-pulse bg-saffron-500 text-ink-950" : "bg-ink-700"}`}>
                    {s?.status === "done" ? "✓" : i + 1}
                  </span>
                  {STEP_LABELS[id][lang]}
                </div>
                {s?.detail && <div className="mt-1 truncate pl-7 text-xs text-zinc-500">{s.detail}</div>}
              </div>
            );
          })}
        </section>
      )}

      {plan && (
        <div ref={resultRef} className="scroll-mt-6">
          <Results plan={plan} story={story} lang={lang} t={t} headers={headers} />
        </div>
      )}

      <footer className="mt-16 border-t border-ink-700 pt-6 text-center text-xs leading-relaxed text-zinc-500">
        <p className="mx-auto max-w-2xl">{t.disclaimer}</p>
        <p className="mt-2">
          Built for the BharatCode Build League · Powered by the BharatCode model API ·{" "}
          <a className="underline hover:text-zinc-300" href="https://github.com/Kavaykhurana/bharatcode" target="_blank" rel="noreferrer">
            ⭐ Star on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}

function Results({
  plan,
  story,
  lang,
  t,
  headers
}: {
  plan: CasePlan;
  story: string;
  lang: Language;
  t: (typeof T)[Language];
  headers: () => HeadersInit;
}) {
  const { intake } = plan;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const urgent = plan.deadlines.filter((d) => d.urgent);

  const shareText = useMemo(() => {
    const first = plan.steps[0];
    return `My consumer complaint plan from Haq (${plan.category.label}):\n1) ${first.title}\n${plan.steps
      .slice(1)
      .map((s) => `${s.order}) ${s.title}${s.links[0] ? ` — ${s.links[0].url}` : ""}`)
      .join("\n")}\n\nGet yours: https://github.com/Kavaykhurana/bharatcode`;
  }, [plan]);

  return (
    <div className="mt-8 space-y-4">
      {urgent.length > 0 && (
        <div className="rounded-2xl border border-red-700/60 bg-red-950/40 p-4">
          {urgent.map((d) => (
            <div key={d.label} className="flex gap-3 text-sm">
              <span className="text-lg">⏰</span>
              <div>
                <div className="font-semibold text-red-200">
                  {d.label}
                  {d.date ? ` — ${formatDate(d.date, lang)}` : ""}
                </div>
                <div className="text-red-300/80">{d.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label">{t.caseFile}</div>
            <h2 className="mt-1 text-xl font-bold">
              {plan.category.emoji} {lang === "hi" ? plan.category.labelHi : plan.category.label}
            </h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${plan.mode === "ai" ? "bg-leaf-500/15 text-leaf-400" : "bg-zinc-700/40 text-zinc-400"}`}
            title={plan.mode === "ai" ? "Classified by the BharatCode model" : "Classified by the offline rule engine"}
          >
            {plan.mode === "ai" ? `AI · ${Math.round(intake.confidence * 100)}% confident` : "Offline mode"}
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-300">{intake.summary}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Fact label="Against" value={intake.opposite_party ?? "—"} />
          <Fact label="Amount" value={intake.amount_inr !== null ? `₹${intake.amount_inr.toLocaleString("en-IN")}` : "—"} />
          <Fact label="Incident" value={formatDate(intake.incident_date, lang)} />
          <Fact label="References" value={intake.reference_ids.join(", ") || "—"} />
        </dl>
        {plan.commission && (
          <p className="mt-4 rounded-lg bg-ink-800 px-3 py-2 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">If it goes to court:</span> {plan.commission.level}. {plan.commission.feeNote}
          </p>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold">🪜 {t.ladder}</h3>
          <div className="no-print flex gap-2">
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => downloadFile("haq-escalation-plan.ics", planToIcs(plan), "text/calendar")}>
              📅 {t.calendar}
            </button>
            <a className="btn-ghost px-3 py-1.5 text-xs" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
              💬 {t.share}
            </a>
          </div>
        </div>
        <ol className="relative mt-5 space-y-5 border-l border-ink-600 pl-6">
          {plan.steps.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full border border-ink-600 bg-ink-800 text-xs font-bold text-saffron-400">{s.order}</span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <div className="font-semibold">{s.title}</div>
                <div className="text-xs tabular-nums text-zinc-500">
                  {t.startOn}: {formatDate(s.startOn, lang)}
                  {s.escalateOn && (
                    <>
                      {" "}
                      · {t.escalateOn}: <span className="text-zinc-300">{formatDate(s.escalateOn, lang)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-zinc-500">{s.forum}</div>
              <p className="mt-1.5 text-sm text-zinc-300">{s.how}</p>
              {(s.links.length > 0 || s.phones) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-md bg-ink-800 px-2 py-1 text-xs text-saffron-400 hover:underline">
                      ↗ {l.label}
                    </a>
                  ))}
                  {s.phones?.map((p) => (
                    <a key={p} href={`tel:${p.replace(/[^\d]/g, "")}`} className="rounded-md bg-ink-800 px-2 py-1 text-xs text-leaf-400">
                      ☎ {p}
                    </a>
                  ))}
                </div>
              )}
              {s.note && <p className="mt-2 text-xs italic text-zinc-500">{s.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h3 className="text-base font-bold">⏳ {t.deadlines}</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {plan.deadlines.map((d) => (
            <li key={d.label} className={`rounded-xl border p-3 text-sm ${d.urgent ? "border-red-700/60 bg-red-950/30" : "border-ink-700 bg-ink-800/50"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-200">{d.label}</span>
                {d.date && <span className="shrink-0 text-xs tabular-nums text-saffron-400">{formatDate(d.date, lang)}</span>}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{d.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h3 className="text-base font-bold">⚖️ {t.laws}</h3>
          <ul className="mt-3 space-y-3">
            {plan.laws.map((l) => (
              <li key={l.name} className="text-sm">
                <div className="font-medium text-zinc-200">{l.name}</div>
                <div className="text-zinc-400">{l.point}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3 className="text-base font-bold">📎 {t.evidence}</h3>
          <ul className="mt-3 space-y-2">
            {plan.evidence.map((e, i) => (
              <li key={e}>
                <label className="flex cursor-pointer gap-2.5 text-sm">
                  <input type="checkbox" className="mt-0.5 accent-saffron-500" checked={!!checked[i]} onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))} />
                  <span className={checked[i] ? "text-zinc-500 line-through" : "text-zinc-300"}>{e}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-zinc-500">
            {Object.values(checked).filter(Boolean).length}/{plan.evidence.length} ready
          </div>
          {intake.missing_info.length > 0 && (
            <div className="mt-4 rounded-lg border border-saffron-500/30 bg-saffron-500/5 p-3">
              <div className="label text-saffron-400">{t.missing}</div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {intake.missing_info.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <h3 className="text-base font-bold">💡 Tips</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
          {plan.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <DraftPanel plan={plan} story={story} lang={lang} t={t} headers={headers} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-800/70 px-3 py-2">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-zinc-200" title={value}>
        {value}
      </dd>
    </div>
  );
}

function DraftPanel({
  plan,
  story,
  lang,
  t,
  headers
}: {
  plan: CasePlan;
  story: string;
  lang: Language;
  t: (typeof T)[Language];
  headers: () => HeadersInit;
}) {
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
    <section className="card">
      <div className="no-print">
        <h3 className="text-base font-bold">✍️ {t.draft}</h3>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist">
          {(Object.keys(DOC_LABELS) as DocType[]).map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={docType === d}
              onClick={() => setDocType(d)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${docType === d ? "border-saffron-500 bg-saffron-500/10 text-saffron-400" : "border-ink-600 text-zinc-400 hover:text-white"}`}
            >
              {DOC_LABELS[d][lang]}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder={t.yourName}
            className="rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-saffron-500"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            placeholder={t.yourCity}
            className="rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-saffron-500"
          />
          <button className="btn-primary" onClick={generate} disabled={busy}>
            {busy ? t.analyzing : draft ? t.regenerate : t.generate}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {(draft || busy) && (
        <>
          {fromTemplate && (
            <p className="no-print mt-4 text-xs text-zinc-500">Generated from Haq&apos;s offline template — fill the [bracketed] blanks before sending.</p>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(30, Math.max(12, draft.split("\n").length + 1))}
            className={`no-print mt-3 w-full rounded-xl border border-ink-600 bg-ink-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-200 outline-none focus:border-saffron-500 ${lang === "hi" ? "font-devanagari" : ""}`}
            aria-label="Draft document"
          />
          <pre className="print-only whitespace-pre-wrap font-serif text-[12pt] leading-relaxed">{draft}</pre>
          <div className="no-print mt-3 flex flex-wrap gap-2">
            <button
              className="btn-ghost text-xs"
              disabled={!draft}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setError("Clipboard is blocked in this browser — select the text and copy manually.");
                }
              }}
            >
              📋 {copied ? t.copied : t.copy}
            </button>
            <button className="btn-ghost text-xs" disabled={!draft} onClick={() => downloadFile(`haq-${docType}.txt`, draft, "text/plain;charset=utf-8")}>
              ⬇ {t.download}
            </button>
            <button className="btn-ghost text-xs" disabled={!draft} onClick={() => window.print()}>
              🖨 {t.print}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
