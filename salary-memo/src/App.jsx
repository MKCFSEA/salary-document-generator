import { useState } from "react";

const n = (v) => parseFloat(v) || 0;
const fmt = (v) => v ? `MYR ${Number(v).toLocaleString("en-MY", { minimumFractionDigits: 0 })}` : "—";
const pct = (curr, offer) => { const c = n(curr), o = n(offer); if (!c || !o) return null; return ((o - c) / c) * 100; };
const fmtPct = (val) => { if (val === null || isNaN(val)) return "—"; const s = val >= 0 ? "▲" : "▼"; return `${s} ${Math.abs(val).toFixed(2)}%`; };
const pctColor = (val) => { if (val === null) return "#999"; return val > 0 ? "#16a34a" : "#dc2626"; };

const FONT = "'IBM Plex Sans', 'Segoe UI', sans-serif";
const RED = "#E02020";
const DARK = "#1a1a2e";

const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontFamily: FONT, color: "#111", background: "#fff", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 4, fontFamily: FONT };
const autoStyle = { padding: "9px 11px", background: "#f3f4f6", borderRadius: 6, fontSize: 13, fontFamily: FONT, color: "#374151", fontWeight: 600, border: "1px solid #e5e7eb" };

const JUSTIFICATION_OPTIONS = ["Talent Scarcity", "Business Urgency", "Loss in Cash", "Others"];

function Field({ label, value, onChange, type = "text", placeholder = "", hint, autoVal }) {
  if (autoVal !== undefined) return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={autoStyle}>{autoVal || "—"}</div>
      {hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{hint}</div>}
    </div>
  );
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = "#d1d5db"} />
      {hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Card({ title, badge, badgeColor, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10, background: "#fafafa" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: DARK, fontFamily: FONT }}>{title}</span>
        {badge && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", background: badgeColor || RED, color: "#fff", padding: "3px 10px", borderRadius: 20 }}>{badge}</span>}
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function Grid({ cols = 2, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0 18px" }}>{children}</div>;
}

function DeltaPreview({ curr, offer, signOn }) {
  const rows = [
    { label: "Monthly Base", c: curr.monthly, o: offer.monthly },
    { label: "Annual Base (×12)", c: curr.annual, o: offer.annual },
    { label: "Monthly Fixed Allowance", c: curr.allowance || null, o: offer.allowance || null },
    { label: "Annual Allowance (×12)", c: curr.annualAllowance || null, o: offer.annualAllowance || null },
    { label: "Total RSU / Options", c: curr.rsuTotal || null, o: offer.rsuTotal || null },
    { label: "Annualised RSU / Options", c: curr.rsuAnnual || null, o: offer.rsuAnnual || null },
    { label: "Target Bonus", c: curr.bonus, o: offer.bonus },
    { label: "Total Cash / Year", c: curr.ttc, o: offer.ttc, bold: true },
    { label: "Sign-on (one-time)", c: null, o: signOn || null },
    { label: "Effective 1st-Year Pkg", c: curr.ttc, o: offer.firstYear, bold: true, highlight: true },
  ].filter(r => r.label === "Monthly Base" || r.label === "Annual Base (×12)" || r.label === "Target Bonus" || r.label === "Total Cash / Year" || r.label === "Sign-on (one-time)" || r.label === "Effective 1st-Year Pkg" || r.c || r.o);
  const th = { padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", background: DARK };
  const td = (bold, hi) => ({ padding: "8px 12px", fontSize: 12, fontWeight: bold ? 700 : 400, background: hi ? "#fef9c3" : "transparent", borderBottom: "1px solid #f3f4f6", fontFamily: FONT });
  return (
    <div style={{ overflowX: "auto", marginTop: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
        <thead><tr>{["Item", "Current", "Our Offer", "Delta"].map(h => <th key={h} style={{ ...th, textAlign: h === "Item" ? "left" : "right" }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const delta = pct(r.c, r.o);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={td(r.bold, r.highlight)}>{r.label}</td>
                <td style={{ ...td(r.bold, r.highlight), textAlign: "right" }}>{r.c ? fmt(r.c) : "—"}</td>
                <td style={{ ...td(r.bold, r.highlight), textAlign: "right" }}>{r.o ? fmt(r.o) : "—"}</td>
                <td style={{ ...td(r.bold, r.highlight), textAlign: "right", color: pctColor(delta) }}>{fmtPct(delta)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Justification Block ──────────────────────────────────────────────────────
function JustificationBlock({ items, onChange }) {
  const addItem = (type) => {
    if (items.find(i => i.type === type)) return;
    onChange([...items, { type, text: "" }]);
  };
  const removeItem = (type) => onChange(items.filter(i => i.type !== type));
  const updateText = (type, text) => onChange(items.map(i => i.type === type ? { ...i, text } : i));
  const moveUp = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; onChange(a); };
  const moveDown = (idx) => { if (idx === items.length - 1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; onChange(a); };

  const available = JUSTIFICATION_OPTIONS.filter(o => !items.find(i => i.type === o));

  const placeholders = {
    "Talent Scarcity": "e.g. We interviewed 23 candidates — this is the only offer extended at 4.34% conversion rate…",
    "Business Urgency": "e.g. The role has been vacant for 3 months and is critical to the Q2 launch timeline…",
    "Loss in Cash": "e.g. Candidate takes an 11.11% base cut. Sign-on compensates for unvested bonus and notice period…",
    "Others": "Enter additional justification details…"
  };

  return (
    <div>
      {/* Dropdown to add */}
      {available.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Add Justification Reason</label>
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }}
            style={{ ...inputStyle, color: "#374151", cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = RED}
            onBlur={e => e.target.style.borderColor = "#d1d5db"}
          >
            <option value="" disabled>Select a reason to add…</option>
            {available.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af", fontSize: 13, fontStyle: "italic", background: "#f9fafb", borderRadius: 8, border: "1px dashed #e5e7eb" }}>
          No justification reasons added yet — select one from the dropdown above
        </div>
      )}

      {items.map((item, idx) => (
        <div key={item.type} style={{ marginBottom: 12, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: DARK, flex: 1 }}>{idx + 1}. {item.type}</span>
            <button onClick={() => moveUp(idx)} disabled={idx === 0} title="Move up"
              style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#d1d5db" : "#6b7280", fontSize: 13, padding: "2px 5px" }}>↑</button>
            <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} title="Move down"
              style={{ background: "none", border: "none", cursor: idx === items.length - 1 ? "default" : "pointer", color: idx === items.length - 1 ? "#d1d5db" : "#6b7280", fontSize: 13, padding: "2px 5px" }}>↓</button>
            <button onClick={() => removeItem(item.type)} title="Remove"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "2px 5px", fontWeight: 700, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: "12px 14px", background: "#fff" }}>
            <textarea
              value={item.text}
              onChange={e => updateText(item.type, e.target.value)}
              placeholder={placeholders[item.type]}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [name, setName] = useState("");
  const [peopleLink, setPeopleLink] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobFamily, setJobFamily] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [memoDate, setMemoDate] = useState("");

  const [currMonthly, setCurrMonthly] = useState("");
  const [currAllowance, setCurrAllowance] = useState("");
  const [currRSUTotal, setCurrRSUTotal] = useState("");
  const [currRSUVestYears, setCurrRSUVestYears] = useState("");
  const [bonusMonths, setBonusMonths] = useState("");
  const [currBonusOverride, setCurrBonusOverride] = useState("");

  const [offerMonthly, setOfferMonthly] = useState("");
  const [offerAllowance, setOfferAllowance] = useState("");
  const [offerRSUTotal, setOfferRSUTotal] = useState("");
  const [offerRSUVestYears, setOfferRSUVestYears] = useState("");
  const [offerBonusMonths, setOfferBonusMonths] = useState("");
  const [offerBonusOverride, setOfferBonusOverride] = useState("");
  const [signOnAmt, setSignOnAmt] = useState("");
  const [signOnSchedule, setSignOnSchedule] = useState("");
  const [signOnBond, setSignOnBond] = useState("");

  const [justItems, setJustItems] = useState([]);
  const [status, setStatus] = useState(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currAnnual = n(currMonthly) * 12;
  const currAnnualAllowance = n(currAllowance) * 12;
  const currRSUAnnual = currRSUTotal && currRSUVestYears ? n(currRSUTotal) / n(currRSUVestYears) : 0;
  const currBonus = currBonusOverride ? n(currBonusOverride) : n(currMonthly) * n(bonusMonths);
  const currTTC = currAnnual + currAnnualAllowance + currBonus;

  const offerAnnual = n(offerMonthly) * 12;
  const offerAnnualAllowance = n(offerAllowance) * 12;
  const offerRSUAnnual = offerRSUTotal && offerRSUVestYears ? n(offerRSUTotal) / n(offerRSUVestYears) : 0;
  const offerBonus = offerBonusOverride ? n(offerBonusOverride) : n(offerMonthly) * n(offerBonusMonths || bonusMonths);
  const offerTTC = offerAnnual + offerAnnualAllowance + offerBonus;
  const offerFirstYear = offerTTC + n(signOnAmt);

  const ttcDelta = pct(currTTC, offerTTC);
  const firstYearDelta = pct(currTTC, offerFirstYear);
  const isPremium = ttcDelta !== null && ttcDelta > 30;
  const hasSignOn = n(signOnAmt) > 0;
  const needsJustification = isPremium || hasSignOn;

  const signOnPctTTC = offerTTC && signOnAmt ? ((n(signOnAmt) / offerTTC) * 100).toFixed(2) : null;
  const signOnMonths = offerMonthly && signOnAmt ? (n(signOnAmt) / n(offerMonthly)).toFixed(2) : null;

  const curr = { monthly: n(currMonthly), annual: currAnnual, allowance: n(currAllowance), annualAllowance: currAnnualAllowance, rsuTotal: n(currRSUTotal), rsuAnnual: currRSUAnnual, bonus: currBonus, ttc: currTTC };
  const offer = { monthly: n(offerMonthly), annual: offerAnnual, allowance: n(offerAllowance), annualAllowance: offerAnnualAllowance, rsuTotal: n(offerRSUTotal), rsuAnnual: offerRSUAnnual, bonus: offerBonus, ttc: offerTTC, firstYear: offerFirstYear };
  const canGenerate = !!(name && offerMonthly);

  const generate = async () => {
    if (!canGenerate) return;
    setStatus("loading");
    try {
      const payload = {
        name, peopleLink, jobTitle, jobFamily, jobLevel, education, experience, currentEmployer, memoDate,
        curr: { monthly: currMonthly, annual: currAnnual, allowance: currAllowance, annualAllowance: currAnnualAllowance, rsuTotal: currRSUTotal, rsuVestYears: currRSUVestYears, rsuAnnual: currRSUAnnual, bonusMonths, bonus: currBonus, ttc: currTTC },
        offer: { monthly: offerMonthly, annual: offerAnnual, allowance: offerAllowance, annualAllowance: offerAnnualAllowance, rsuTotal: offerRSUTotal, rsuVestYears: offerRSUVestYears, rsuAnnual: offerRSUAnnual, bonus: offerBonus, ttc: offerTTC, firstYear: offerFirstYear, signOn: signOnAmt, signOnMonths, signOnPctTTC, signOnSchedule, signOnBond },
        deltas: { base: pct(currMonthly, offerMonthly), ttc: ttcDelta, firstYear: firstYearDelta, isPremium },
        justification: needsJustification ? justItems : [],
      };

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `Generate a complete Node.js script using the 'docx' npm package that creates a salary justification memo .docx at "/mnt/user-data/outputs/SalaryMemo_${name.replace(/\s+/g, "_")}.docx".

EXACT FORMAT — match this structure:

1. Title: "Salary - [name]" large bold heading
2. Section "Basic information:" numbered list: Name & People Link (hyperlink), Job title, Background — education as a single bullet, then experience split by newline into individual bullet points (each non-empty line = one bullet)
3. Section "Current/Last Drawn Salary Details":
   - "Monthly Gross Base: MYR [X] x 12"
   - Table "候选人信息/Candidate Information" — amber (#F59E0B) header spanning 4 cols. 4 columns total:
     Info rows (left label | left value | right label | right value): Name, Bachelor, Master, Working Experience, Current Employer, Level vs Job Family, Level, TP上限, TP/TP上限, TP下限, TP/TP下限
     Then dark sub-header row: "Current Employer" | "Current" | "Offer" | "Delta"
     Then comp rows (label | current | offer | delta%): Monthly Base, Month, Monthly Fixed Allowance (only if allowance > 0), Stock/Option (show Total RSU if entered), Stock/Option Value (show Annualised RSU if entered), Target Bonus(month), Other Cash/Year, Total Cash/Year, Total Package (bold)
     Delta % column: green for negative (decrease), red for positive (increase)
     Footer row amber (#FEF3C7): "备注（涨幅超过30%或突破级别范围请务必备注原因，超过50%请先讨论通过）"
   - Summary bullets: base/TTC/total package change text
4. Section "Sign-on bonus proposal" (only if signOn > 0): bullet with months, amount, % of TP, schedule, bond
5. Section "Justification:" (only if justification array non-empty): numbered list, each item has bold type heading + bullet with the text
6. Section "Salary Documents" — heading only, no content

CRITICAL RULES:
- ShadingType.CLEAR always (never SOLID)
- columnWidths must exactly sum to table width in DXA
- Set width on Table AND each TableCell
- LevelFormat.BULLET for bullets, never unicode
- Arial font throughout, A4 page size
- Output ONLY raw Node.js code, no markdown fences, no explanation

DATA: ${JSON.stringify(payload, null, 2)}`
          }]
        })
      });

      const result = await resp.json();
      const script = result.content?.map(b => b.text || "").join("").replace(/```javascript\n?|```js\n?|```\n?/g, "").trim();
      const blob = new Blob([script], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generate_SalaryMemo_${name.replace(/\s+/g, "_")}.js`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch(e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: FONT }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: DARK, borderBottom: `4px solid ${RED}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: RED, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>S</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Salary Justification Builder</div>
          </div>
          {isPremium && (
            <div style={{ marginLeft: "auto", background: "#7f1d1d", border: "1px solid #dc2626", borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>PREMIUM &gt;30% — Justification Required</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px 60px" }}>

        <Card title="1 · Basic Information">
          <Grid>
            <Field label="Candidate Name" value={name} onChange={setName} placeholder="e.g. Kevin Lim Kguanwei" />
            <Field label="Date of Memo" value={memoDate} onChange={setMemoDate} type="date" />
          </Grid>
          <Field label="People Link / Application ID" value={peopleLink} onChange={setPeopleLink} placeholder="Paste hyperlink or ID" />
          <Grid>
            <Field label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Special Project Strategist (Malaysia)" />
            <Field label="Job Family" value={jobFamily} onChange={setJobFamily} placeholder="e.g. E-commerce Operations" />
          </Grid>
          <Grid>
            <Field label="Job Level" value={jobLevel} onChange={setJobLevel} placeholder="e.g. L4 / 3-1" />
            <Field label="Current Employer" value={currentEmployer} onChange={setCurrentEmployer} placeholder="e.g. Roland Berger" />
          </Grid>
          <Field label="Education" value={education} onChange={setEducation} placeholder="e.g. BSc. Accounting and Finance (Honours), University of Warwick" />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Experience <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9ca3af" }}>— one line per bullet point</span></label>
            <textarea
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder={"e.g.\n6 years of consultancy experience at Roland Berger\nStrong macro strategy & commercial analysis skills\nExpertise in e-commerce and sustainability"}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
            {experience && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Preview — will appear as bullet points in document</div>
                {experience.split("\n").filter(l => l.trim()).map((line, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 8, marginBottom: 3 }}>
                    <span style={{ color: RED, fontWeight: 700, flexShrink: 0 }}>•</span>
                    <span>{line.trim()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="2 · Current / Last Drawn Compensation">
          <Grid>
            <Field label="Monthly Gross Base (MYR)" value={currMonthly} onChange={setCurrMonthly} type="number" placeholder="e.g. 33750" />
            <Field label="Annual Base (auto)" autoVal={currMonthly ? fmt(currAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Avg Bonus (months)" value={bonusMonths} onChange={setBonusMonths} type="number" placeholder="e.g. 1.696" hint="Auto-calculates target bonus" />
            <Field label="Target Perf. Bonus (auto)" autoVal={currBonus ? fmt(currBonus) : ""} />
          </Grid>
          <Field label="Override Bonus Amount (optional)" value={currBonusOverride} onChange={setCurrBonusOverride} type="number" placeholder="Leave blank to use auto-calculated" />
          <Grid>
            <Field label="Monthly Fixed Allowance (MYR)" value={currAllowance} onChange={setCurrAllowance} type="number" placeholder="e.g. 2000 — leave blank if none" hint="Included in Total Cash/Year" />
            <Field label="Annual Allowance (auto)" autoVal={currAllowance ? fmt(currAnnualAllowance) : ""} />
          </Grid>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>RSU / Stock Options</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label="Total RSU Value (MYR)" value={currRSUTotal} onChange={setCurrRSUTotal} type="number" placeholder="e.g. 120000" />
              <Field label="Vesting Period (years)" value={currRSUVestYears} onChange={setCurrRSUVestYears} type="number" placeholder="e.g. 4" />
              <Field label="Annualised RSU (auto)" autoVal={currRSUAnnual ? fmt(currRSUAnnual) : ""} hint="Total ÷ Vesting years" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {[["Annual Base", fmt(currAnnual)], ["Allowance (annual)", currAllowance ? fmt(currAnnualAllowance) : "—"], ["Target Bonus", fmt(currBonus)], ["Total Cash/Year", fmt(currTTC)]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="3 · Our Offer">
          <Grid>
            <Field label="Offer Monthly Gross Base (MYR)" value={offerMonthly} onChange={setOfferMonthly} type="number" placeholder="e.g. 30000" />
            <Field label="Offer Annual Base (auto)" autoVal={offerMonthly ? fmt(offerAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Offer Bonus Months (blank = same as current)" value={offerBonusMonths} onChange={setOfferBonusMonths} type="number" placeholder={`Using ${bonusMonths || "—"} months`} />
            <Field label="Offer Target Bonus (auto)" autoVal={offerBonus ? fmt(offerBonus) : ""} />
          </Grid>
          <Field label="Override Offer Bonus Amount (optional)" value={offerBonusOverride} onChange={setOfferBonusOverride} type="number" placeholder="Leave blank to auto-calculate" />
          <Grid>
            <Field label="Offer Monthly Fixed Allowance (MYR)" value={offerAllowance} onChange={setOfferAllowance} type="number" placeholder="e.g. 2000 — leave blank if none" hint="Included in Offer Total Cash/Year" />
            <Field label="Offer Annual Allowance (auto)" autoVal={offerAllowance ? fmt(offerAnnualAllowance) : ""} />
          </Grid>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Offer RSU / Stock Options</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label="Total RSU Value (MYR)" value={offerRSUTotal} onChange={setOfferRSUTotal} type="number" placeholder="e.g. 200000" />
              <Field label="Vesting Period (years)" value={offerRSUVestYears} onChange={setOfferRSUVestYears} type="number" placeholder="e.g. 4" />
              <Field label="Annualised RSU (auto)" autoVal={offerRSUAnnual ? fmt(offerRSUAnnual) : ""} hint="Total ÷ Vesting years" />
            </div>
          </div>
          <Grid>
            <Field label="Sign-on Bonus (MYR)" value={signOnAmt} onChange={setSignOnAmt} type="number" placeholder="Leave blank if none" hint={hasSignOn ? "Justification section required" : ""} />
            <Field label="Sign-on as % of TTC (auto)" autoVal={signOnPctTTC ? `${signOnPctTTC}%  (${signOnMonths} months)` : ""} />
          </Grid>
          {hasSignOn && (
            <Grid>
              <Field label="Payment Schedule" value={signOnSchedule} onChange={setSignOnSchedule} placeholder="e.g. 2 installments" />
              <Field label="Bond Period" value={signOnBond} onChange={setSignOnBond} placeholder="e.g. 1 year" />
            </Grid>
          )}
          {offerMonthly && <DeltaPreview curr={curr} offer={offer} signOn={n(signOnAmt)} />}
          {offerMonthly && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {[["Base Change", pct(currMonthly, offerMonthly)], ["TTC Change", ttcDelta], ["1st-Year Package", firstYearDelta]].map(([k, v]) => (
                <div key={k} style={{ flex: 1, background: isPremium && k === "TTC Change" ? "#fef2f2" : "#f8fafc", border: `1px solid ${isPremium && k === "TTC Change" ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: pctColor(v) }}>{fmtPct(v)}{isPremium && k === "TTC Change" ? " 🔴" : ""}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Justification — conditional */}
        {needsJustification && (
          <Card title="4 · Justification" badge="REQUIRED" badgeColor={RED}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#92400e", display: "flex", gap: 8 }}>
              <span>⚠️</span>
              <span>Required because: {[isPremium && `Total package delta > 30% (${fmtPct(ttcDelta)})`, hasSignOn && `Sign-on bonus proposed (${fmt(n(signOnAmt))})`].filter(Boolean).join("  ·  ")}</span>
            </div>
            <JustificationBlock items={justItems} onChange={setJustItems} />
          </Card>
        )}

        {/* Salary Documents — heading only */}
        <Card title={`${needsJustification ? "5" : "4"} · Salary Documents`}>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
            Documents to be attached manually in Lark.
          </p>
        </Card>

        {/* Generate */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <button onClick={generate} disabled={!canGenerate || status === "loading"}
            style={{ background: !canGenerate ? "#94a3b8" : RED, color: "#fff", border: "none", padding: "15px 48px", borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: canGenerate ? "pointer" : "not-allowed", letterSpacing: "0.04em", boxShadow: canGenerate ? "0 4px 20px rgba(224,32,32,0.35)" : "none" }}>
            {status === "loading" ? "Generating…" : "Generate Salary Memo →"}
          </button>
          {!canGenerate && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Fill in candidate name and offer base salary to continue</div>}
          {status === "done" && (
            <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", display: "inline-block", textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>✓ Script downloaded!</div>
              <div style={{ fontSize: 12, color: "#15803d", marginTop: 6, lineHeight: 1.6 }}>
                Open a new Claude chat → upload the <code style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>.js</code> file → type <em>"Run this script and give me the docx"</em>
              </div>
            </div>
          )}
          {status === "error" && <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>Something went wrong — please try again.</div>}
        </div>
      </div>
    </div>
  );
}
