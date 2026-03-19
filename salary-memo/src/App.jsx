import { useState } from "react";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
  ExternalHyperlink, VerticalAlign
} from "docx";
import { saveAs } from "file-saver";

const SEA_CURRENCIES = [
  { code: "MYR", label: "MYR — Malaysian Ringgit",  locale: "en-MY", flag: "🇲🇾", defaultMonths: 12 },
  { code: "SGD", label: "SGD — Singapore Dollar",   locale: "en-SG", flag: "🇸🇬", defaultMonths: 12 },
  { code: "IDR", label: "IDR — Indonesian Rupiah",   locale: "id-ID", flag: "🇮🇩", defaultMonths: 13 },
  { code: "THB", label: "THB — Thai Baht",            locale: "th-TH", flag: "🇹🇭", defaultMonths: 12 },
  { code: "PHP", label: "PHP — Philippine Peso",      locale: "en-PH", flag: "🇵🇭", defaultMonths: 13 },
  { code: "VND", label: "VND — Vietnamese Dong",      locale: "vi-VN", flag: "🇻🇳", defaultMonths: 12 },
  //{ code: "MMK", label: "MMK — Myanmar Kyat",         locale: "my-MM", flag: "🇲🇲", defaultMonths: 12 },
  //{ code: "KHR", label: "KHR — Cambodian Riel",       locale: "km-KH", flag: "🇰🇭", defaultMonths: 12 },
  //{ code: "LAK", label: "LAK — Lao Kip",              locale: "lo-LA", flag: "🇱🇦", defaultMonths: 12 },
  //{ code: "BND", label: "BND — Brunei Dollar",        locale: "ms-BN", flag: "🇧🇳", defaultMonths: 12 },
];

const n = (v) => parseFloat(v) || 0;

const fmtCurrency = (v, code, locale) => {
  if (!v && v !== 0) return "—";
  const num = Number(v);
  if (!num) return "—";
  try {
    return `${code} ${num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } catch {
    return `${code} ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
};

const pct = (c, o) => { const cv = n(c), ov = n(o); if (!cv || !ov) return null; return ((ov - cv) / cv) * 100; };
const fmtPct = (val) => { if (val === null || isNaN(val)) return "—"; const s = val >= 0 ? "▲" : "▼"; return `${s} ${Math.abs(val).toFixed(2)}%`; };
const pctColor = (val) => { if (val === null) return "#999"; return val > 0 ? "#16a34a" : "#dc2626"; };
const FREQ_MULTIPLIER = { "Monthly": 12, "Quarterly": 4, "Bi-annually": 2, "Annually": 1, "One-time": 1 };
// Returns annual total across all allowance rows
const sumAllowAnnual = (rows) => rows.reduce((s, r) => s + n(r.amount) * (FREQ_MULTIPLIER[r.freq] ?? FREQ_MULTIPLIER["Monthly"]), 0);
// Returns monthly equivalent (annual / 12) — used for TTC calculations
const sumAllow = (rows) => sumAllowAnnual(rows) / 12;

const FONT = "'IBM Plex Sans', 'Segoe UI', sans-serif";
const RED = "#E02020";
const DARK = "#1a1a2e";

const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontFamily: FONT, color: "#111", background: "#fff", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 4, fontFamily: FONT };
const autoStyle = { padding: "9px 11px", background: "#f3f4f6", borderRadius: 6, fontSize: 13, fontFamily: FONT, color: "#374151", fontWeight: 600, border: "1px solid #e5e7eb" };

const JUSTIFICATION_OPTIONS = ["Talent Scarcity", "Business Urgency", "Loss in Cash", "Others"];
const FREQ_OPTIONS = ["Monthly", "Quarterly", "Bi-annually", "Annually", "One-time"];

function AllowanceEditor({ rows, onChange, label, fmt }) {
  const add = () => onChange([...rows, { id: Date.now() + Math.random(), type: "", amount: "", freq: "Monthly" }]);
  const remove = (id) => onChange(rows.filter(r => r.id !== id));
  const update = (id, field, val) => onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={labelStyle}>{label}</label>
        <button onClick={add} style={{ background: RED, color: "#fff", border: "none", borderRadius: 6, padding: "4px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>+ Add Row</button>
      </div>
      {rows.length === 0 && (
        <div style={{ padding: "12px 14px", background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 6, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
          No allowances — click Add Row to add one
        </div>
      )}
      {rows.map((r) => {
        const mult = FREQ_MULTIPLIER[r.freq] ?? 12;
        const annual = n(r.amount) * mult;
        const freqLabel = mult === 12 ? "× 12" : mult === 4 ? "× 4" : mult === 2 ? "× 2" : "× 1";
        return (
          <div key={r.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px 36px", gap: "0 8px", alignItems: "center" }}>
              <input value={r.type} onChange={e => update(r.id, "type", e.target.value)}
                placeholder="e.g. Transport, Housing, Meal"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
              <input type="number" value={r.amount} onChange={e => update(r.id, "amount", e.target.value)}
                placeholder="Amount"
                style={{ ...inputStyle, textAlign: "right" }}
                onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
              <select value={r.freq || "Monthly"} onChange={e => update(r.id, "freq", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"}>
                {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => remove(r.id)} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, width: 36, height: 38, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>
            {n(r.amount) > 0 && (
              <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                {fmt(n(r.amount))} {freqLabel} = <strong style={{ color: DARK }}>{fmt(annual)} / year</strong>
              </div>
            )}
          </div>
        );
      })}
      {rows.length > 0 && (
        <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: DARK, marginTop: 4 }}>
          Monthly equiv: {fmt(sumAllow(rows))} &nbsp;|&nbsp; Annual equiv: {fmt(sumAllowAnnual(rows))}
        </div>
      )}
    </div>
  );
}

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

function DeltaPreview({ curr, offer, signOn, currAllowances, offerAllowances, fmt, salaryMonths, offerSalaryMonths }) {
  const cAllow = sumAllow(currAllowances);
  const oAllow = sumAllow(offerAllowances);
  const rows = [
    { label: "Monthly Base", c: curr.monthly, o: offer.monthly },
    { label: `Annual Base (×${salaryMonths} / ×${offerSalaryMonths})`, c: curr.annual, o: offer.annual },
    ...(cAllow || oAllow ? [{ label: "Total Allowance / month", c: cAllow || null, o: oAllow || null }] : []),
    ...(curr.rsuTotal || offer.rsuTotal ? [{ label: "RSU / Options (Total)", c: curr.rsuTotal || null, o: offer.rsuTotal || null }] : []),
    ...(curr.rsuAnnual || offer.rsuAnnual ? [{ label: "RSU / Options (Annualised)", c: curr.rsuAnnual || null, o: offer.rsuAnnual || null }] : []),
    { label: "Target Bonus", c: curr.bonus, o: offer.bonus },
    { label: "Total Cash / Year", c: curr.ttc, o: offer.ttc, bold: true },
    ...(curr.nettTakeHome || offer.nettTakeHome ? [{ label: "Nett Take Home / month", c: curr.nettTakeHome || null, o: offer.nettTakeHome || null }] : []),
    ...(signOn ? [{ label: "Sign-on (one-time)", c: null, o: signOn }] : []),
    { label: "Effective 1st-Year Pkg", c: curr.ttc, o: offer.firstYear, bold: true, highlight: true },
  ];
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

async function generateDocx(payload) {
  const { currencyCode, currencyLocale, salaryMonths, offerSalaryMonths } = payload;
  const C = (v) => fmtCurrency(v, currencyCode, currencyLocale);
  const fmtD = (v) => { if (v === null || v === undefined) return "—"; const s = v > 0 ? "▲" : "▼"; return `${s} ${Math.abs(v).toFixed(2)}%`; };
  const pctC = (c, o) => { if (!n(c) || !n(o)) return null; return ((n(o) - n(c)) / n(c)) * 100; };

  const bdr = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };
  const mg = { top: 80, bottom: 80, left: 120, right: 120 };
  const CI = [2200, 1626, 2200, 3000];
  const CC = [3200, 1800, 1800, 2226];

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

  const compRow = (label, cV, oV, dNum, even = true, boldRow = false) => {
    const bg = even ? "FFFFFF" : "F9FAFB";
    const dColor = dNum === null ? "AAAAAA" : dNum < 0 ? "16A34A" : "DC2626";
    return new TableRow({ children: [
      tc(label, { w: CC[0], bg, bold: boldRow }),
      tc(cV,    { w: CC[1], bg, bold: boldRow, align: AlignmentType.RIGHT }),
      tc(oV,    { w: CC[2], bg, bold: boldRow, align: AlignmentType.RIGHT }),
      tc(fmtD(dNum), { w: CC[3], bg, bold: boldRow, color: dColor, align: AlignmentType.RIGHT }),
    ]});
  };

  const heading = (text) => new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text, bold: true, font: "Arial", size: 26 })] });
  const para = (text) => new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text, font: "Arial", size: 20 })] });
  const spacer = () => new Paragraph({ spacing: { before: 100, after: 0 }, children: [new TextRun("")] });
  const bullet = (text) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text, font: "Arial", size: 20 })] });
  const numbered = (ref, text, bold = false) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { before: 60, after: 40 }, children: [new TextRun({ text, font: "Arial", size: 20, bold })] });

  const { curr, offer, name, peopleLink, jobTitle, jobFamily, jobLevel,
    education, experience, workingYears, currentEmployer, justification, currAllowances, offerAllowances } = payload;

  const autoBullet = (name && education) ? `${name} graduated from ${education}` : null;
  const expLines = [
    ...(autoBullet ? [autoBullet] : []),
    ...(experience || "").split("\n").filter(l => l.trim()),
  ];

  // ── Comp table rows: Monthly Base → Month → Target Bonus → Allowance (total) → RSU → Other → TCC → Nett Take Home → Total Package ──
  const compRows = [];
  let even = true;
  const cr = (label, c, o, d, bold = false) => { compRows.push(compRow(label, c, o, d, even, bold)); even = !even; };

  cr("Monthly Base", C(curr.monthly), C(offer.monthly), pctC(curr.monthly, offer.monthly));
  cr("Month", String(salaryMonths), String(offerSalaryMonths), null);
  cr("Target Bonus", C(curr.bonus), C(offer.bonus), pctC(curr.bonus, offer.bonus));

  // Allowances — single total row (no breakdown by type)
  const cAllowTotal = sumAllow(currAllowances);
  const oAllowTotal = sumAllow(offerAllowances);
  if (true)
    const cAllowAnnual = sumAllowAnnual(currAllowances);
    const oAllowAnnual = sumAllowAnnual(offerAllowances);
    if (cAllowAnnual || oAllowAnnual)
      cr("Total Allowance (Annual)", C(cAllowAnnual), C(oAllowAnnual), pctC(cAllowAnnual, oAllowAnnual));

  if (n(curr.rsuTotal) || n(offer.rsuTotal))
    cr("Stock / Option (Total Grant)", C(curr.rsuTotal), C(offer.rsuTotal), pctC(curr.rsuTotal, offer.rsuTotal));
  if (n(curr.rsuAnnual) || n(offer.rsuAnnual))
    cr("Stock / Option (Annualised)", C(curr.rsuAnnual), C(offer.rsuAnnual), pctC(curr.rsuAnnual, offer.rsuAnnual));

  cr("Other Cash / Year", "—", "—", null);
  cr("Total Cash / Year", C(curr.ttc), C(offer.ttc), pctC(curr.ttc, offer.ttc));

  // Nett Take Home row (only if filled)
  if (n(curr.nettTakeHome) || n(offer.nettTakeHome))
    cr("Nett Take Home Pay / month", C(curr.nettTakeHome), C(offer.nettTakeHome), pctC(curr.nettTakeHome, offer.nettTakeHome));

  compRows.push(compRow("Total Package", C(curr.ttc), C(offer.ttc), pctC(curr.ttc, offer.ttc), even, true));

  const bD = pctC(curr.monthly, offer.monthly);
  const tD = pctC(curr.ttc, offer.ttc);
  const summaryLines = [
    bD !== null ? `Base ${bD < 0 ? "decrease" : "increase"} by ${Math.abs(bD).toFixed(2)}%` : null,
    tD !== null ? `TTC ${tD < 0 ? "decrease" : "increase"} by ${Math.abs(tD).toFixed(2)}%` : null,
    tD !== null ? `Total package ${tD < 0 ? "decrease" : "increase"} by ${Math.abs(tD).toFixed(2)}%` : null,
  ].filter(Boolean);

  // ── Current/Last Drawn detail lines — plain para(), no bullets, same indent level as Monthly Gross Base ──
  const detailLines = [
    ...(cAllowTotal ? [`Total Allowance: ${C(sumAllowAnnual(currAllowances))} / year  (${C(cAllowTotal)} / month equiv)`] : []),
    ...(n(curr.rsuTotal) ? [
      `RSU / Stock Options — Total Grant: ${C(curr.rsuTotal)}`,
      `RSU / Stock Options — Annualised (over ${curr.rsuVestYears || "?"} years): ${C(curr.rsuAnnual)}`,
    ] : []),
    ...(n(curr.nettTakeHome) ? [`Nett Take Home Pay: ${C(curr.nettTakeHome)} / month`] : []),
  ];

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
        new Paragraph({ spacing: { before: 0, after: 160 }, children: [new TextRun({ text: `Salary - ${name}`, bold: true, font: "Arial", size: 40 })] }),
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

        heading("Current/Last Drawn Salary Details"),
        para(`Monthly Gross Base: ${C(curr.monthly)} x ${salaryMonths}`),
        ...detailLines.map(l => para(l)),
        spacer(),

        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: CI,
          rows: [
            new TableRow({ children: [new TableCell({
              borders, columnSpan: 4, width: { size: 9026, type: WidthType.DXA },
              shading: { fill: "F59E0B", type: ShadingType.CLEAR }, margins: mg,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "候选人信息/Candidate Information", bold: true, font: "Arial", size: 22, color: "FFFFFF" })] })]
            })] }),
            infoRow("Name",               name || "—",            "Job Family",  jobFamily || "—"),
            infoRow("Bachelor",           education || "—",       "Level",       jobLevel || "—",  "F9FAFB"),
            infoRow("Master",             "—",                    "TP上限",      "—"),
            infoRow("Working Experience", workingYears ? `${workingYears} years` : "—", "TP/TP上限",   "—",              "F9FAFB"),
            infoRow("Current Employer",   currentEmployer || "—", "TP下限",      "—"),
            infoRow("Level",              jobLevel || "—",        "TP/TP下限",   "—",              "F9FAFB"),
            new TableRow({ children: [
              tc("",        { w: CC[0], bg: "1F2937", bold: true, color: "FFFFFF" }),
              tc("Current", { w: CC[1], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
              tc("Offer",   { w: CC[2], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
              tc("Delta",   { w: CC[3], bg: "1F2937", bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
            ]}),
            ...compRows,
            new TableRow({ children: [new TableCell({
              borders, columnSpan: 4, width: { size: 9026, type: WidthType.DXA },
              shading: { fill: "FEF3C7", type: ShadingType.CLEAR }, margins: mg,
              children: [new Paragraph({ spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "备注（涨幅超过30%或突破级别范围请务必备注原因，超过50%请先讨论通过）", font: "Arial", size: 16, color: "92400E", italics: true })] })]
            })] }),
          ]
        }),

        spacer(),
        para(`At our offered monthly base salary of ${C(offer.monthly)} we are looking at`),
        ...summaryLines.map(t => bullet(t)),
        spacer(),

        ...(n(offer.signOn) > 0 ? [
          heading("Sign-on bonus proposal"),
          bullet(`Proposed ${offer.signOnMonths} months of bonus at ${C(offer.signOn)}, ${offer.signOnPctTTC}% of TP as sign-on bonus, to be paid over ${offer.signOnSchedule || "—"} with ${offer.signOnBond || "—"} bond.`),
          spacer(),
        ] : []),

        ...(justification && justification.length > 0 ? [
          heading("Justification:"),
          ...justification.flatMap(item => [
            new Paragraph({ numbering: { reference: "just-ref", level: 0 }, spacing: { before: 80, after: 40 },
              children: [new TextRun({ text: item.type, bold: true, font: "Arial", size: 20 })] }),
            ...(item.text ? [bullet(item.text)] : []),
          ]),
          spacer(),
        ] : []),

        heading("Salary Documents"),
        para("(Documents to be attached in Lark)"),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Salary_Document_${name.replace(/\s+/g, "_")}.docx`);
}

export default function App() {
  const [currency, setCurrency] = useState(SEA_CURRENCIES[0]);
  const [salaryMonths, setSalaryMonths] = useState(12);
  const [offerSalaryMonths, setOfferSalaryMonths] = useState(12);

  const [name, setName] = useState("");
  const [peopleLink, setPeopleLink] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobFamily, setJobFamily] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [workingYears, setWorkingYears] = useState("");
  const [memoDate, setMemoDate] = useState("");

  const [currMonthly, setCurrMonthly] = useState("");
  const [currAllowances, setCurrAllowances] = useState([]);
  const [currRSUTotal, setCurrRSUTotal] = useState("");
  const [currRSUVestYears, setCurrRSUVestYears] = useState("");
  const [bonusMonths, setBonusMonths] = useState("");
  const [currBonusOverride, setCurrBonusOverride] = useState("");
  const [currNettTakeHome, setCurrNettTakeHome] = useState("");

  const [offerMonthly, setOfferMonthly] = useState("");
  const [offerAllowances, setOfferAllowances] = useState([]);
  const [offerRSUTotal, setOfferRSUTotal] = useState("");
  const [offerRSUVestYears, setOfferRSUVestYears] = useState("");
  const [offerBonusMonths, setOfferBonusMonths] = useState("");
  const [offerBonusOverride, setOfferBonusOverride] = useState("");
  const [offerNettTakeHome, setOfferNettTakeHome] = useState("");
  const [signOnAmt, setSignOnAmt] = useState("");
  const [signOnSchedule, setSignOnSchedule] = useState("");
  const [signOnBond, setSignOnBond] = useState("");

  const [justItems, setJustItems] = useState([]);
  const [status, setStatus] = useState(null);

  const fmt = (v) => fmtCurrency(v, currency.code, currency.locale);

  const handleCurrencyChange = (code) => {
    const c = SEA_CURRENCIES.find(x => x.code === code);
    setCurrency(c);
    setSalaryMonths(c.defaultMonths);
    setOfferSalaryMonths(c.defaultMonths);
  };

  const currAnnual = n(currMonthly) * salaryMonths;
  const currTotalAllowMonthly = sumAllow(currAllowances);
  const currRSUAnnual = (currRSUTotal && currRSUVestYears) ? n(currRSUTotal) / n(currRSUVestYears) : 0;
  const currBonus = currBonusOverride ? n(currBonusOverride) : n(currMonthly) * n(bonusMonths);
  const currTTC = currAnnual + (currTotalAllowMonthly * 12) + currBonus;

  const offerAnnual = n(offerMonthly) * offerSalaryMonths;
  const offerTotalAllowMonthly = sumAllow(offerAllowances);
  const offerRSUAnnual = (offerRSUTotal && offerRSUVestYears) ? n(offerRSUTotal) / n(offerRSUVestYears) : 0;
  const offerBonus = offerBonusOverride ? n(offerBonusOverride) : n(offerMonthly) * n(offerBonusMonths || bonusMonths);
  const offerTTC = offerAnnual + (offerTotalAllowMonthly * 12) + offerBonus;
  const offerFirstYear = offerTTC + n(signOnAmt);

  const ttcDelta = pct(currTTC, offerTTC);
  const firstYearDelta = pct(currTTC, offerFirstYear);
  const isPremium = ttcDelta !== null && ttcDelta > 30;
  const hasSignOn = n(signOnAmt) > 0;
  const needsJustification = isPremium || hasSignOn;

  const signOnPctTTC = (offerTTC && signOnAmt) ? ((n(signOnAmt) / offerTTC) * 100).toFixed(2) : null;
  const signOnMonths = (offerMonthly && signOnAmt) ? (n(signOnAmt) / n(offerMonthly)).toFixed(2) : null;

  const curr = { monthly: n(currMonthly), annual: currAnnual, rsuTotal: n(currRSUTotal), rsuAnnual: currRSUAnnual, bonus: currBonus, ttc: currTTC, nettTakeHome: n(currNettTakeHome) };
  const offer = { monthly: n(offerMonthly), annual: offerAnnual, rsuTotal: n(offerRSUTotal), rsuAnnual: offerRSUAnnual, bonus: offerBonus, ttc: offerTTC, firstYear: offerFirstYear, nettTakeHome: n(offerNettTakeHome) };
  const canGenerate = !!(name && offerMonthly);

  const generate = async () => {
    if (!canGenerate) return;
    setStatus("loading");
    try {
      await generateDocx({
        name, peopleLink, jobTitle, jobFamily, jobLevel, education, experience, workingYears, currentEmployer, memoDate,
        currAllowances, offerAllowances,
        currencyCode: currency.code,
        currencyLocale: currency.locale,
        salaryMonths,
        offerSalaryMonths,
        curr: { ...curr, rsuVestYears: currRSUVestYears },
        offer: { ...offer, signOn: n(signOnAmt), signOnMonths, signOnPctTTC, signOnSchedule, signOnBond },
        deltas: { base: pct(currMonthly, offerMonthly), ttc: ttcDelta, firstYear: firstYearDelta, isPremium },
        justification: needsJustification ? justItems : [],
      });
      setStatus("done");
    } catch(e) {
      console.error(e);
      setStatus("error");
    }
  };

  const monthsOptions = [12, 13];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: FONT }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: DARK, borderBottom: `4px solid ${RED}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: RED, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>S</span>
          </div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Salary Document Builder</div>
          {isPremium && (
            <div style={{ marginLeft: "auto", background: "#7f1d1d", border: "1px solid #dc2626", borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>PREMIUM &gt;30% — Justification Required</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* ── Currency + Salary Months ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 20, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Currency</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{currency.flag}</span>
                <select value={currency.code} onChange={e => handleCurrencyChange(e.target.value)}
                  style={{ ...inputStyle, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"}>
                  {SEA_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag}  {c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Current — Salary Months</div>
              <div style={{ display: "flex", gap: 6 }}>
                {monthsOptions.map(m => (
                  <button key={m} onClick={() => setSalaryMonths(m)}
                    style={{ padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${salaryMonths === m ? RED : "#d1d5db"}`, background: salaryMonths === m ? "#fef2f2" : "#fff", color: salaryMonths === m ? RED : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Offer — Salary Months</div>
              <div style={{ display: "flex", gap: 6 }}>
                {monthsOptions.map(m => (
                  <button key={m} onClick={() => setOfferSalaryMonths(m)}
                    style={{ padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${offerSalaryMonths === m ? RED : "#d1d5db"}`, background: offerSalaryMonths === m ? "#fef2f2" : "#fff", color: offerSalaryMonths === m ? RED : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {currency.defaultMonths === 13 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, color: "#1d4ed8" }}>
              ℹ️ {currency.flag} {currency.code} typically uses a 13-month salary structure — auto-applied. You can adjust manually above.
            </div>
          )}
        </div>

        <Card title="1 · Basic Information">
          <Grid>
            <Field label="Candidate Name" value={name} onChange={setName} />
            <Field label="Date of Memo" value={memoDate} onChange={setMemoDate} type="date" />
          </Grid>
          <Field label="People Link / Application ID" value={peopleLink} onChange={setPeopleLink} />
          <Grid>
            <Field label="Job Title" value={jobTitle} onChange={setJobTitle} />
            <Field label="Job Family" value={jobFamily} onChange={setJobFamily} />
          </Grid>
          <Grid>
            <Field label="Job Level" value={jobLevel} onChange={setJobLevel} />
            <Field label="Current Employer" value={currentEmployer} onChange={setCurrentEmployer} />
          </Grid>
          <Grid>
            <Field label="Years of Working Experience" value={workingYears} onChange={setWorkingYears} type="number" placeholder="e.g. 6" hint="Shown in Candidate Information table" />
            <div />
          </Grid>
          <Field label="Education" value={education} onChange={setEducation} />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Experience <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9ca3af" }}>— one line per bullet point</span></label>
            <textarea value={experience} onChange={e => setExperience(e.target.value)}
              rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
            {(experience || (name && education)) && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Preview — bullet points in document</div>
                {(() => {
                  const autoBullet = (name && education) ? `${name} graduated from ${education}` : null;
                  const lines = experience.split("\n").filter(l => l.trim());
                  const allLines = autoBullet ? [autoBullet, ...lines] : lines;
                  return allLines.map((line, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 8, marginBottom: 3 }}>
                      <span style={{ color: RED, fontWeight: 700, flexShrink: 0 }}>•</span>
                      <span style={{ color: i === 0 && autoBullet ? "#6b7280" : "#374151", fontStyle: i === 0 && autoBullet ? "italic" : "normal" }}>{line}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </Card>

        <Card title="2 · Current / Last Drawn Compensation">
          <Grid>
            <Field label={`Monthly Gross Base (${currency.code})`} value={currMonthly} onChange={setCurrMonthly} type="number" />
            <Field label={`Annual Base (×${salaryMonths}, auto)`} autoVal={currMonthly ? fmt(currAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Avg Bonus (months)" value={bonusMonths} onChange={setBonusMonths} type="number" hint="Auto-calculates target bonus" />
            <Field label="Target Perf. Bonus (auto)" autoVal={currBonus ? fmt(currBonus) : ""} />
          </Grid>
          <Field label="Override Bonus Amount (optional)" value={currBonusOverride} onChange={setCurrBonusOverride} type="number" />
          <AllowanceEditor rows={currAllowances} onChange={setCurrAllowances} label="Allowances (Current)" fmt={fmt} />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>RSU / Stock Options (Current)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label={`Total RSU Value (${currency.code})`} value={currRSUTotal} onChange={setCurrRSUTotal} type="number" />
              <Field label="Vesting Period (years)" value={currRSUVestYears} onChange={setCurrRSUVestYears} type="number" />
              <Field label="Annualised RSU (auto)" autoVal={currRSUAnnual ? fmt(currRSUAnnual) : ""} hint="Total ÷ Vesting years" />
            </div>
          </div>
          <Grid>
            <Field label={`Nett Take Home Pay / month (${currency.code})`} value={currNettTakeHome} onChange={setCurrNettTakeHome} type="number" hint="Optional — key for PH / ID candidates" />
            <div />
          </Grid>
          <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            {[["Annual Base", fmt(currAnnual)], ["Allowance/mo", currTotalAllowMonthly ? fmt(currTotalAllowMonthly) : "—"], ["Target Bonus", fmt(currBonus)], ["Total Cash/Year", fmt(currTTC)]].map(([k, v]) => (
              <div key={k} style={{ flex: "1 1 120px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="3 · Our Offer">
          <Grid>
            <Field label={`Offer Monthly Gross Base (${currency.code})`} value={offerMonthly} onChange={setOfferMonthly} type="number" />
            <Field label={`Offer Annual Base (×${offerSalaryMonths}, auto)`} autoVal={offerMonthly ? fmt(offerAnnual) : ""} />
          </Grid>
          <Grid>
            <Field label="Offer Bonus Months (blank = same as current)" value={offerBonusMonths} onChange={setOfferBonusMonths} type="number" placeholder={bonusMonths ? `Defaulting to ${bonusMonths} months` : ""} />
            <Field label="Offer Target Bonus (auto)" autoVal={offerBonus ? fmt(offerBonus) : ""} />
          </Grid>
          <Field label="Override Offer Bonus Amount (optional)" value={offerBonusOverride} onChange={setOfferBonusOverride} type="number" />
          <AllowanceEditor rows={offerAllowances} onChange={setOfferAllowances} label="Allowances (Offer)" fmt={fmt} />
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>RSU / Stock Options (Offer)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
              <Field label={`Total RSU Value (${currency.code})`} value={offerRSUTotal} onChange={setOfferRSUTotal} type="number" />
              <Field label="Vesting Period (years)" value={offerRSUVestYears} onChange={setOfferRSUVestYears} type="number" />
              <Field label="Annualised RSU (auto)" autoVal={offerRSUAnnual ? fmt(offerRSUAnnual) : ""} hint="Total ÷ Vesting years" />
            </div>
          </div>
          <Grid>
            <Field label={`Nett Take Home Pay / month (${currency.code})`} value={offerNettTakeHome} onChange={setOfferNettTakeHome} type="number" hint="Optional — key for PH / ID candidates" />
            <div />
          </Grid>
          <Grid>
            <Field label={`Sign-on Bonus (${currency.code})`} value={signOnAmt} onChange={setSignOnAmt} type="number" hint={hasSignOn ? "Justification section required" : ""} />
            <Field label="Sign-on as % of TTC (auto)" autoVal={signOnPctTTC ? `${signOnPctTTC}%  (${signOnMonths} months)` : ""} />
          </Grid>
          {hasSignOn && (
            <Grid>
              <Field label="Payment Schedule" value={signOnSchedule} onChange={setSignOnSchedule} />
              <Field label="Bond Period" value={signOnBond} onChange={setSignOnBond} />
            </Grid>
          )}
          {offerMonthly && <DeltaPreview curr={curr} offer={offer} signOn={n(signOnAmt)} currAllowances={currAllowances} offerAllowances={offerAllowances} fmt={fmt} salaryMonths={salaryMonths} offerSalaryMonths={offerSalaryMonths} />}
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
            {status === "loading" ? "Generating…" : "Generate Salary Document →"}
          </button>
          {!canGenerate && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Fill in candidate name and offer base salary to continue</div>}
          {status === "done" && (
            <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", display: "inline-block" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>✓ Salary Document downloaded! Check your Downloads folder.</div>
            </div>
          )}
          {status === "error" && <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>Something went wrong — please try again or contact support.</div>}
        </div>

      </div>
    </div>
  );
}
