export const LOGO = "/images/HerbAyurLogo_transparent.png";

export const PRINT_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:36px;color:#1a3c34;background:white}
  .rpt-header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #2e7d32;padding-bottom:14px;margin-bottom:20px}
  .rpt-logo{width:64px;height:64px;object-fit:contain}
  .rpt-brand h1{font-size:24px;font-weight:900;color:#1a3c34}
  .rpt-brand p{font-size:11px;color:#6b7280;margin-top:2px}
  .rpt-doc-title{font-size:18px;font-weight:800;color:#2e7d32;margin-bottom:3px}
  .rpt-meta{font-size:11px;color:#9ca3af;margin-bottom:18px}
  .rpt-section{margin-bottom:24px;page-break-inside:avoid}
  .rpt-section-title{font-size:13px;font-weight:700;color:#1a3c34;background:#e8f5e9;padding:5px 12px;border-radius:6px;margin-bottom:10px;display:inline-block}
  .rpt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
  .rpt-stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}
  .rpt-stat-num{font-size:20px;font-weight:900;color:#2e7d32}
  .rpt-stat-label{font-size:10px;color:#6b7280;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
  th{background:#2e7d32;color:white;padding:7px 9px;text-align:left;font-size:11px}
  td{padding:6px 9px;border-bottom:1px solid #f0f0f0;vertical-align:top}
  tr:nth-child(even) td{background:#f9fafb}
  .badge{display:inline-block;padding:2px 7px;border-radius:8px;font-size:9px;font-weight:700}
  .bg{background:#dcfce7;color:#166534}
  .bb{background:#dbeafe;color:#1d4ed8}
  .ba{background:#fef3c7;color:#92400e}
  .br{background:#fee2e2;color:#991b1b}
  .bp{background:#f3e8ff;color:#7c3aed}
  .rpt-footer{text-align:center;margin-top:24px;color:#9ca3af;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px}
`;

export function printReport(contentRef, title) {
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>${title}</title><style>${PRINT_CSS}</style></head><body>${contentRef.current.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  win.onload = () => { win.print(); win.close(); };
}

export function RptHeader({ title, meta }) {
  return (
    <>
      <div className="rpt-header">
        <img src={LOGO} alt="HerbAyur" className="rpt-logo"/>
        <div className="rpt-brand">
          <h1>HerbAyur</h1>
          <p>Sri Lanka's Ayurvedic Raw Material Platform</p>
        </div>
      </div>
      <div className="rpt-doc-title">{title}</div>
      <div className="rpt-meta">{meta} · Generated: {new Date().toLocaleString()}</div>
    </>
  );
}

export function RptSection({ title, children }) {
  return (
    <div className="rpt-section">
      <div className="rpt-section-title">{title}</div>
      {children}
    </div>
  );
}

export function RptStats({ stats }) {
  return (
    <div className="rpt-stats">
      {stats.map((s, i) => (
        <div className="rpt-stat" key={i}>
          <div className="rpt-stat-num">{s.value}</div>
          <div className="rpt-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function badge(status) {
  const map = {
    Delivered:"bg", Approved:"bg", approved:"bg", "In Stock":"bg",
    Processing:"ba", pending:"ba", "Pending":"ba", "Low Stock":"ba",
    Confirmed:"bb", active:"bb",
    Rejected:"br", rejected:"br", "Out of Stock":"br", Cancelled:"br",
  };
  return map[status] || "bb";
}

export function inDateRange(value, fromDate, toDate) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    if (date < from) return false;
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }

  return true;
}

export function getDateRangeLabel(fromDate, toDate) {
  if (!fromDate && !toDate) return "All dates";
  if (fromDate && toDate) return `${fromDate} to ${toDate}`;
  if (fromDate) return `From ${fromDate}`;
  return `Up to ${toDate}`;
}
