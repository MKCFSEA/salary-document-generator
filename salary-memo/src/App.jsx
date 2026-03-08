import { useState } from "react";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
  ExternalHyperlink, VerticalAlign
} from "docx";
import { saveAs } from "file-saver";

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
  ].filter(r => ["Monthly Base","Annual Base (×12)","Target Bonus","Total Cash / Year","Sign-on (one-time)","Effective 1st-Year Pkg"].includes(r.label) || r.c || r.o);
  const th = { padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#fff", background: DARK };
  const td = (bold, hi) => ({ padding: "8px 12px", fontSize: 12, fontWeight: bold ? 700 : 400, background: hi ? "#fef9c3" : "transparent", borderBottom: "1px solid #f3f4f6", fontFamily: FONT });
  return (
    <div style={{ overflowX: "auto", marginTop: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
        <thead><tr>{["Item","Current","Our Offer","Delta"].map(h => <th key={h} style={{ ...th, textAlign: h === "Item" ? "left" : "right" }}>{h}</th>)}</tr></thead>
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

function JustificationBlock({ items, onChange }) {
  const addItem = (type) => { if (items.find(i => i.type === type)) return; onChange([...items, { type, text: "" }]); };
  const removeItem = (type) => onChange(items.filter(i => i.type !== type));
  const updateText = (type, text) => onChange(items.map(i => i.type === type ? { ...i, text } : i));
  const moveUp = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; onChange(a); };
  const moveDown = (idx) => { if (idx === items.length - 1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; onChange(a); };
  const available = JUSTIFICATION_OPTIONS.filter(o => !items.find(i => i.type === o));
  const placeholders = {
    "Talent Scarcity": "Describe pipeline challenge, number of candidates interviewed, offer conversion rate…",
    "Business Urgency": "Describe why this role needs to be filled urgently and the business impact of delay…",
    "Loss in Cash": "Describe compensation loss — base cut, unvested bonus, notice period buyout, etc…",
    "Others": "Enter additional justification details…"
  };
  return (
    <div>
      {available.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Add Justification Reason</label>
          <select defaultValue="" onChange={e => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }}
            style={{ ...inputStyle, color: "#374151", cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"}>
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
            <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#d1d5db" : "#6b7280", fontSize: 13, padding: "2px 5px" }}>↑</button>
            <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} style={{ background: "none", border: "none", cursor: idx === items.length - 1 ? "default" : "pointer", color: idx === items.length - 1 ? "#d1d5db" : "#6b7280", fontSize: 13, padding: "2px 5px" }}>↓</button>
            <button onClick={() => removeItem(item.type)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "2px 5px", fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ padding: "12px 14px", background: "#fff" }}>
            <textarea value={item.text} onChange={e => updateText(item.type, e.target.value)}
              placeholder={placeholders[item.type]} rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Generate DOCX directly in browser via docx CDN ──────────────────────────
async function generateDocx(payload) {

  const MYR = (v) => (v && n(v)) ? `MYR ${Number(v).toLocaleString("en-MY")}` : "—";
  const fmtD = (v) => { if (v === null || v === undefined) return "—"; const s = v > 0 ? "▲" : "▼"; return `${s} ${Math.abs(v).toFixed(2)}%`; };
  const pctC = (c, o) => { if (!n(c) || !n(o)) return null; return ((n(o) - n(c)) / n(c)) * 100; };

  const bdr = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };
  const mg = { top: 80, bottom: 80, left: 120, right: 120 };

  // Column widths — must sum to 9026 DXA
  const CI = [2200, 1626, 2200, 3000]; // info table
  const CC = [3200, 1800, 1800, 2226]; // comp table

  const tc = (text, { w, bg = "FFFFFF", bold = false, color = "000000", align = AlignmentType.LEFT, colspan, size = 20 } = {}) =>
    new TableCell({
      borders, margins: mg,
      width: { size: w, type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR },
      ...(colspan ? { columnSpan: colspan } : {}),
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: align, spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: String(text ?? "—"), bold, color, font: "Arial", size })]
      })]
    });

  const infoRow = (lL, lV, rL, rV, bg = "FFFFFF") => new TableRow({ children: [
    tc(lL, { w: CI[0], bg, bold: true, color: "374151" }),
    tc(lV, { w: CI[1], bg }),
    tc(rL, { w: CI[2], bg, bold: true, color: "374151" }),
    tc(rV, { w: CI[3], bg }),
  ]});

  const compRow = (label, curr, ofr, deltaNum, even = true, boldRow = false) => {
    const bg = even ? "FFFFFF" : "F9FAFB";
    const dStr = fmtD(deltaNum);
    const dColor = deltaNum === null ? "AAAAAA" : deltaNum < 0 ? "16A34A" : "DC2626";
    return new TableRow({ children: [
      tc(label, { w: CC[0], bg, bold: boldRow }),
      tc(curr,  { w: CC[1], bg, bold: boldRow, align: AlignmentType.RIGHT }),
      tc(ofr,   { w: CC[2], bg, bold: boldRow, align: AlignmentType.RIGHT }),
      tc(dStr,  { w: CC[3], bg, bold: boldRow, color: dColor, align: AlignmentType.RIGHT }),
    ]});
  };

  const heading = (text) => new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26 })]
  });

  const para = (text) => new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 20 })]
  });

  const spacer = () => new Paragraph({ spacing: { before: 100, after: 0 }, children: [new TextRun("")] });

  const bullet = (text) => new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 20 })]
  });

  const numbered = (ref, text, bold = false) => new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { before: 60, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 20, bold })]
  });

  const { curr, offer, name, peopleLink, jobTitle, jobFamily, jobLevel,
    education, experience, currentEmployer, justification } = payload;

  const expLines = (experience || "").split("\n").filter(l => l.trim());

  // Build comp rows — only show optional rows if data exists
  const compRows = [];
  let even = true;
  const cr = (label, c, o, d) => { compRows.push(compRow(label, c, o, d, even)); even = !even; };

  cr("Monthly Base",         MYR(curr.monthly),  MYR(offer.monthly),  pctC(curr.monthly, offer.monthly));
  cr("Month",                "12",               "12",                null);
  if (n(curr.allowance) || n(offer.allowance))
    cr("Monthly Fixed Allowance", MYR(curr.allowance), MYR(offer.allowance), pctC(curr.allowance, offer.allowance));
  if (n(curr.rsuTotal) || n(offer.rsuTotal))
    cr("Stock / Option (Total)",  MYR(curr.rsuTotal),  MYR(offer.rsuTotal),  pctC(curr.rsuTotal, offer.rsuTotal));
  if (n(curr.rsuAnnual) || n(offer.rsuAnnual))
    cr("Stock / Option (Annualised)", MYR(curr.rsuAnnual), MYR(offer.rsuAnnual), pctC(curr.rsuAnnual, offer.rsuAnnual));
  cr("Target Bonus (month)", MYR(curr.bonus),    MYR(offer.bonus),    pctC(curr.bonus, offer.bonus));
  cr("Other Cash / Year",    "—",                "—",                 null);
  cr("Total Cash / Year",    MYR(curr.ttc),      MYR(offer.ttc),      pctC(curr.ttc, offer.ttc));
  compRows.push(compRow("Total Package", MYR(curr.ttc), MYR(offer.ttc), pctC(curr.ttc, offer.ttc), even, true));

  // Summary text
  const bD = pctC(curr.monthly, offer.monthly);
  const tD = pctC(curr.ttc, offer.ttc);
  const summaryLines = [
    bD !== null ? `Base ${bD < 0 ? "decrease" : "increase"} by ${Math.abs(bD).toFixed(2)}%` : null,
    tD !== null ? `TTC ${tD < 0 ? "decrease" : "increase"} by ${Math.abs(tD).toFixed(2)}%` : null,
    tD !== null ? `Total package ${tD < 0 ? "decrease" : "increase"} by ${Math.abs(tD).toFixed(2)}%` : null,
  ].filter(Boolean);

  const doc = new Document({
    numbering: {
      config: [
        { reference: "bullets",  levels: [{ level: 0, format: LevelFormat.BULLET,  text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers",  levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",    alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "just-ref", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",    alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ]
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 } } },
      children: [
        // Title
        new Paragraph({ spacing: { before: 0, after: 160 }, children: [new TextRun({ text: `Salary - ${name}`, bold: true, font: "Arial", size: 40 })] }),

        // Basic Info
        heading("Basic information:"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: "Name & People Link: ", font: "Arial", size: 20 }),
            peopleLink
              ? new ExternalHyperlink({ link: peopleLink, children: [new TextRun({ text: name, style: "Hyperlink", font: "Arial", size: 20, color: "2563EB" })] })
              : new TextRun({ text: name, font: "Arial", size: 20 })
          ]
        }),
        numbered("numbers", `Job title: ${jobTitle || "—"}`),
        numbered("numbers", "Background:"),
        ...(education ? [bullet(education)] : []),
        ...expLines.map(l => bullet(l.trim())),

        spacer(),

        // Current Salary
        heading("Current/Last Drawn Salary Details"),
        para(`Monthly Gross Base: ${MYR(curr.monthly)} x 12`),
        spacer(),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [CI[0], CI[1], CI[2], CI[3]],
          rows: [
            new TableRow({ children: [new TableCell({
              borders, columnSpan: 4,
              width: { size: 9026, type: WidthType.DXA },
              shading: { fill: "F59E0B", type: ShadingType.CLEAR },
              margins: mg,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "候选人信息/Candidate Information", bold: true, font: "Arial", size: 22, color: "FFFFFF" })] })]
            })] }),
            infoRow("Name",               name || "—",              "Job Family",   jobFamily || "—"),
            infoRow("Bachelor",           education || "—",         "Level",        jobLevel || "—",   "F9FAFB"),
            infoRow("Master",             "—",                      "TP上限",       "—"),
            infoRow("Working Experience", currentEmployer || "—",   "TP/TP上限",    "—",               "F9FAFB"),
            infoRow("Current Employer",   currentEmployer || "—",   "TP下限",       "—"),
            infoRow("Level",              jobLevel || "—",          "TP/TP下限",    "—",               "F9FAFB"),
            new TableRow({ children: [
              tc("",         { w: CC[0], bg: "1F2937", bold: true, color: "FFFFFF" }),
              tc("Current",  { w: CC[1], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
              tc("Offer",    { w: CC[2], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
              tc("Delta",    { w: CC[3], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
            ]}),
            ...compRows,
            new TableRow({ children: [new TableCell({
              borders, columnSpan: 4,
              width: { size: 9026, type: WidthType.DXA },
              shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
              margins: mg,
              children: [new Paragraph({ spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "备注（涨幅超过30%或突破级别范围请务必备注原因，超过50%请先讨论通过）", font: "Arial", size: 16, color: "92400E", italics: true })] })]
            })] }),
          ]
        }),

        spacer(),
        para(`At our offered monthly base salary of ${MYR(offer.monthly)} we are looking at`),
        ...summaryLines.map(t => bullet(t)),
        spacer(),

        // Sign-on
        ...(n(offer.signOn) > 0 ? [
          heading("Sign-on bonus proposal"),
          bullet(`Proposed ${offer.signOnMonths} months of bonus at ${MYR(offer.signOn)}, ${offer.signOnPctTTC}% of TP as sign-on bonus, to be paid over ${offer.signOnSchedule || "—"} with ${offer.signOnBond || "—"} bond.`),
          spacer(),
        ] : []),

        // Justification
        ...(justification && justification.length > 0 ? [
          heading("Justification:"),
          ...justification.flatMap(item => [
            new Paragraph({ numbering: { reference: "just-ref", level: 0 }, spacing: { before: 80, after: 40 },
              children: [new TextRun({ text: item.type, bold: true, font: "Arial", size: 20 })] }),
            ...(item.text ? [bullet(item.text)] : []),
          ]),
          spacer(),
        ] : []),

        // Salary Documents
        heading("Salary Documents"),
        para("(Documents to be attached in Lark)"),
      ]
    }]
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `Salary_Document_${name.replace(/\s+/g, "_")}.docx`);
}

// ─── Main App ─────────────────────────────────────────────────────────────────
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

  const currAnnual = n(currMonthly) * 12;
  const currAnnualAllowance = n(currAllowance) * 12;
  const currRSUAnnual = (currRSUTotal && currRSUVestYears) ? n(currRSUTotal) / n(currRSUVestYears) : 0;
  const currBonus = currBonusOverride ? n(currBonusOverride) : n(currMonthly) * n(bonusMonths);
  const currTTC = currAnnual + currAnnualAllowance + currBonus;

  const offerAnnual = n(offerMonthly) * 12;
  const offerAnnualAllowance = n(offerAllowance) * 12;
  const offerRSUAnnual = (offerRSUTotal && offerRSUVestYears) ? n(offerRSUTotal) / n(offerRSUVestYears) : 0;
  const offerBonus = offerBonusOverride ? n(offerBonusOverride) : n(offerMonthly) * n(offerBonusMonths || bonusMonths);
  const offerTTC = offerAnnual + offerAnnualAllowance + offerBonus;
  const offerFirstYear = offerTTC + n(signOnAmt);

  const ttcDelta = pct(currTTC, offerTTC);
  const firstYearDelta = pct(currTTC, offerFirstYear);
  const isPremium = ttcDelta !== null && ttcDelta > 30;
  const hasSignOn = n(signOnAmt) > 0;
  const needsJustification = isPremium || hasSignOn;

  const signOnPctTTC = (offerTTC && signOnAmt) ? ((n(signOnAmt) / offerTTC) * 100).toFixed(2) : null;
  const signOnMonths = (offerMonthly && signOnAmt) ? (n(signOnAmt) / n(offerMonthly)).toFixed(2) : null;

  const curr = { monthly: n(currMonthly), annual: currAnnual, allowance: n(currAllowance), annualAllowance: currAnnualAllowance, rsuTotal: n(currRSUTotal), rsuAnnual: currRSUAnnual, bonus: currBonus, ttc: currTTC };
  const offer = { monthly: n(offerMonthly), annual: offerAnnual, allowance: n(offerAllowance), annualAllowance: offerAnnualAllowance, rsuTotal: n(offerRSUTotal), rsuAnnual: offerRSUAnnual, bonus: offerBonus, ttc: offerTTC, firstYear: offerFirstYear };
  const canGenerate = !!(name && offerMonthly);

  const generate = async () => {
    if (!canGenerate) return;
    setStatus("loading");
    try {
      await generateDocx({
        name, peopleLink, jobTitle, jobFamily, jobLevel, education, experience, currentEmployer, memoDate,
        curr: { monthly: n(currMonthly), annual: currAnnual, allowance: n(currAllowance), annualAllowance: currAnnualAllowance, rsuTotal: n(currRSUTotal), rsuAnnual: currRSUAnnual, bonusMonths, bonus: currBonus, ttc: currTTC },
        offer: { monthly: n(offerMonthly), annual: offerAnnual, allowance: n(offerAllowance), annualAllowance: offerAnnualAllowance, rsuTotal: n(offerRSUTotal), rsuAnnual: offerRSUAnnual, bonus: offerBonus, ttc: offerTTC, firstYear: offerFirstYear, signOn: n(signOnAmt), signOnMonths, signOnPctTTC, signOnSchedule, signOnBond },
        deltas: { base: pct(currMonthly, offerMonthly), ttc: ttcDelta, firstYear: firstYearDelta, isPremium },
        justification: needsJustification ? justItems : [],
      });
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
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Salary Document Builder</div>
            <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>E-Commerce</div>
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
            <Field label="Candidate Name" value={name} onChange={setName} placeholder="" />
            <Field label="Date of Memo" value={memoDate} onChange={setMemoDate} type="date" />
          </Grid>
          <Field label="People Link / Application ID" value={peopleLink} onChange={setPeopleLink} placeholder="" />
          <Grid>
            <Field label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="" />
            <Field label="Job Family" value={jobFamily} onChange={setJobFamily} placeholder="" />
          </Grid>
          <Grid>
            <Field label="Job Level" value={jobLevel} onChange={setJobLevel} placeholder="" />
            <Field label="Current Employer" value={currentEmployer} onChange={setCurrentEmployer} placeholder="" />
          </Grid>
          <Field label="Education" value={education} onChange={setEducation} placeholder="" />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Experience <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9ca3af" }}>— one line per bullet point</span></label>
            <textarea value={experience} onChange={e => setExperience(e.target.value)}
              placeholder=""
              rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
            {experience && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Preview — bullet points in document</div>
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
            <Field label="Monthly Gross Base (MYR)" value={currMonthly} onChange={setCurrMonthly} type="number" placeholder="" />
            <Field label="Annual Base (auto)" autoVal={currMonthly ? fmt(currAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Avg Bonus (months)" value={bonusMonths} onChange={setBonusMonths} type="number" placeholder="" hint="Auto-calculates target bonus" />
            <Field label="Target Perf. Bonus (auto)" autoVal={currBonus ? fmt(currBonus) : ""} />
          </Grid>
          <Field label="Override Bonus Amount (optional)" value={currBonusOverride} onChange={setCurrBonusOverride} type="number" placeholder="" />
          <Grid>
            <Field label="Monthly Fixed Allowance (MYR)" value={currAllowance} onChange={setCurrAllowance} type="number" placeholder="" hint="Included in Total Cash/Year" />
            <Field label="Annual Allowance (auto)" autoVal={currAllowance ? fmt(currAnnualAllowance) : ""} />
          </Grid>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>RSU / Stock Options</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label="Total RSU Value (MYR)" value={currRSUTotal} onChange={setCurrRSUTotal} type="number" placeholder="" />
              <Field label="Vesting Period (years)" value={currRSUVestYears} onChange={setCurrRSUVestYears} type="number" placeholder="" />
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
            <Field label="Offer Monthly Gross Base (MYR)" value={offerMonthly} onChange={setOfferMonthly} type="number" placeholder="" />
            <Field label="Offer Annual Base (auto)" autoVal={offerMonthly ? fmt(offerAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Offer Bonus Months (blank = same as current)" value={offerBonusMonths} onChange={setOfferBonusMonths} type="number" placeholder={bonusMonths ? `Defaulting to ${bonusMonths} months` : "Bonus months"} />
            <Field label="Offer Target Bonus (auto)" autoVal={offerBonus ? fmt(offerBonus) : ""} />
          </Grid>
          <Field label="Override Offer Bonus Amount (optional)" value={offerBonusOverride} onChange={setOfferBonusOverride} type="number" placeholder="" />
          <Grid>
            <Field label="Offer Monthly Fixed Allowance (MYR)" value={offerAllowance} onChange={setOfferAllowance} type="number" placeholder="" hint="Included in Offer Total Cash/Year" />
            <Field label="Offer Annual Allowance (auto)" autoVal={offerAllowance ? fmt(offerAnnualAllowance) : ""} />
          </Grid>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Offer RSU / Stock Options</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label="Total RSU Value (MYR)" value={offerRSUTotal} onChange={setOfferRSUTotal} type="number" placeholder="" />
              <Field label="Vesting Period (years)" value={offerRSUVestYears} onChange={setOfferRSUVestYears} type="number" placeholder="" />
              <Field label="Annualised RSU (auto)" autoVal={offerRSUAnnual ? fmt(offerRSUAnnual) : ""} hint="Total ÷ Vesting years" />
            </div>
          </div>
          <Grid>
            <Field label="Sign-on Bonus (MYR)" value={signOnAmt} onChange={setSignOnAmt} type="number" placeholder="" hint={hasSignOn ? "Justification section required" : ""} />
            <Field label="Sign-on as % of TTC (auto)" autoVal={signOnPctTTC ? `${signOnPctTTC}%  (${signOnMonths} months)` : ""} />
          </Grid>
          {hasSignOn && (
            <Grid>
              <Field label="Payment Schedule" value={signOnSchedule} onChange={setSignOnSchedule} placeholder="" />
              <Field label="Bond Period" value={signOnBond} onChange={setSignOnBond} placeholder="" />
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

        {needsJustification && (
          <Card title="4 · Justification" badge="REQUIRED" badgeColor={RED}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#92400e", display: "flex", gap: 8 }}>
              <span>⚠️</span>
              <span>Required because: {[isPremium && `Total package delta > 30% (${fmtPct(ttcDelta)})`, hasSignOn && `Sign-on bonus proposed (${fmt(n(signOnAmt))})`].filter(Boolean).join("  ·  ")}</span>
            </div>
            <JustificationBlock items={justItems} onChange={setJustItems} />
          </Card>
        )}

        <Card title={`${needsJustification ? "5" : "4"} · Salary Documents`}>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Documents to be attached manually in Lark.</p>
        </Card>

        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <button onClick={generate} disabled={!canGenerate || status === "loading"}
            style={{ background: !canGenerate ? "#94a3b8" : RED, color: "#fff", border: "none", padding: "15px 48px", borderRadius: 50, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: canGenerate ? "pointer" : "not-allowed", letterSpacing: "0.04em", boxShadow: canGenerate ? "0 4px 20px rgba(224,32,32,0.35)" : "none" }}>
            {status === "loading" ? "Generating…" : "Generate Salary Memo →"}
          </button>
          {!canGenerate && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Fill in candidate name and offer base salary to continue</div>}
          {status === "done" && (
            <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", display: "inline-block" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>✓ Memo downloaded! Check your Downloads folder.</div>
            </div>
          )}
          {status === "error" && <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>Something went wrong — please try again or contact support.</div>}
        </div>
      </div>
    </div>
  );
}
