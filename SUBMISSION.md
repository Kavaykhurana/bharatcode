# BharatCode Build League — Submission Kit

Everything needed to submit Haq and push for community votes. The deadline is **10 November 2026, 11:59 PM IST**.

## 1. Submission form

| Field | Value |
|---|---|
| Project name | `Haq — AI consumer-rights agent for India` |
| Repository link | `https://github.com/Kavaykhurana/bharatcode` (main repo link only, not a file or branch) |
| `BharatCode.txt` | ✅ In the repository root |

### Short description (925 characters, under the 1,000 limit)

```
Haq (हक़) is an AI consumer-rights agent for India. Describe your problem in English, Hindi or Hinglish — a stuck UPI transfer, a defective Flipkart order, a cancelled flight, a rejected insurance claim, an OTP fraud or a delayed flat — and Haq does three things in about 30 seconds. It routes the case to the correct forum and escalation ladder (bank → RBI Ombudsman, platform → National Consumer Helpline → e-Daakhil, 1930/cybercrime.gov.in, Bima Bharosa, AirSewa, RERA). It computes a dated plan: when to escalate, zero-liability windows, ₹100/day compensation accrued, limitation and the right Consumer Commission tier. And it drafts a ready-to-send complaint, legal notice or ombudsman complaint in English or Hindi, with calendar reminders. Two agents run on the BharatCode model API (intake + streamed drafting), grounded in a human-reviewed law file so they never invent a helpline or a section. It works offline too.
```

## 2. Pre-submit checklist

- [ ] Repository is **public**
- [ ] Merge this branch into `main` so the default branch shows the README and `BharatCode.txt`
- [ ] Add the GitHub repo description: `AI consumer-rights agent for India — right forum, ready draft, dated escalation plan. Built on the BharatCode API.`
- [ ] Add topics: `bharatcode`, `ai-agent`, `consumer-rights`, `india`, `nextjs`, `legal-tech`, `hindi`, `upi`
- [ ] Set the repo's social preview image to `docs/hero.jpg` (Settings → General → Social preview)
- [ ] Deploy to Vercel with `BHARATCODE_API_KEY` set, then add the live URL to the repo "Website" field and to the README header
- [ ] Run one real end-to-end test on the live URL with your actual BharatCode key
- [ ] Record the demo video (script below) and add the link to the README
- [ ] Add your teammate to the **Team AlphaFire** section of the README
- [ ] Submit on bharatcode.ai/hackathon, then confirm on Unstop

## 3. Demo video script (≈ 2 minutes)

| Time | Shot | Say |
|---|---|---|
| 0:00–0:15 | Face cam or title card | "₹4,500 debited on UPI, never credited, and the bank keeps saying wait. Most Indians don't know RBI rules owe them ₹100 a day for this. Haq fixes that." |
| 0:15–0:35 | Click **UPI transfer stuck**, then **Find my remedy** | "I describe the problem in plain words. Watch the agent: it understands the complaint with the BharatCode model, finds the forum and the law, and builds my timeline." |
| 0:35–1:00 | Scroll the case file, ladder and deadlines | "It pulled out the bank, amount, date and UTR. It tells me exactly where to go — bank first, then the RBI Ombudsman — with real dates, and it already calculated the compensation I'm owed." |
| 1:00–1:25 | Switch to **हिन्दी**, choose **Legal notice** and write the draft | "Need it in Hindi? One click. The legal notice streams live, cites only real provisions, and leaves blanks instead of inventing facts." |
| 1:25–1:40 | Click **Add reminders to calendar** and **WhatsApp** | "Escalation reminders go straight into my calendar, and I can share the plan on WhatsApp." |
| 1:40–1:55 | Run the **OTP fraud** example | "For fraud it switches to emergency mode — call 1930 now, with the zero-liability deadline counted in working days." |
| 1:55–2:05 | GitHub repo | "Open source, built on the BharatCode API. Star it if you think every Indian should know their haq." |

**Recording tips:** use a 1280×800 browser window at 125% zoom, record with QuickTime or OBS, keep it under 2:30, and upload it to YouTube as unlisted.

## 4. Getting stars and votes (this counts toward judging)

Post on LinkedIn, X and in WhatsApp groups, in this order: your college groups, family groups, then dev communities.

**LinkedIn / X post**

```
Most Indians don't know this:
• If a UPI transfer fails and isn't reversed by T+1, your bank owes you ₹100/day (RBI circular, 2019)
• Report a fraud within 3 working days → zero liability
• Consumer Commission filing is FREE for claims up to ₹5 lakh

So we built Haq (हक़) for the #BharatCodeBuildLeague — describe your problem in Hindi or English, and an AI agent tells you exactly where to complain, drafts the complaint/legal notice, and gives you a dated escalation plan.

Try it: <live URL>
⭐ Star it: https://github.com/Kavaykhurana/bharatcode
Vote for us on bharatcode.ai 🙏
```

**WhatsApp (Hinglish)**

```
UPI ka paisa atka hai? Flipkart refund nahi de raha? Flight cancel ho gayi?
Humne Haq banaya hai — apni problem Hindi/English mein likho, AI batayega kahan complaint karni hai aur complaint letter bhi likh dega. Free hai.
<live URL>
Hackathon ke liye hai — GitHub pe ⭐ aur bharatcode.ai pe vote kar do please 🙏
https://github.com/Kavaykhurana/bharatcode
```
