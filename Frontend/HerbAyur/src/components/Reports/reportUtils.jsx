export const LOGO = "/images/HerbAyurLogo_transparent.png";

export const PRINT_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:36px;color:#1a3c34;background:white;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  .rpt-header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #2e7d32;padding-bottom:14px;margin-bottom:20px}
  .rpt-logo{width:64px;height:64px;object-fit:contain}
  .rpt-brand h1{font-size:20px;font-weight:600;line-height:1.2}
  .rpt-brand-herb{color:#1b5e20}
  .rpt-brand-ayur{color:#66bb6a}
  .rpt-brand p{font-size:11px;color:#1a3c34;margin-top:2px;font-weight:500}
  .rpt-doc-title{font-size:18px;font-weight:700;color:#1b5e20;margin-bottom:3px}
  .rpt-meta{font-size:11px;color:#2e7d32;margin-bottom:18px}
  .rpt-section{margin-bottom:24px;page-break-inside:avoid}
  .rpt-section-title{font-size:13px;font-weight:700;color:#1a3c34;background:#e8f5e9;padding:5px 12px;border-radius:6px;margin-bottom:10px;display:inline-block}
  .rpt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
  .rpt-stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}
  .rpt-stat-num{font-size:20px;font-weight:900;color:#2e7d32}
  .rpt-stat-label{font-size:10px;color:#6b7280;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
  th{background:#2e7d32;color:white;padding:7px 9px;text-align:left;font-size:11px;font-weight:900}
  td{padding:8px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top}
  tr:nth-child(even) td{background:#f9fafb}
  .badge{display:inline-block;padding:5px 12px;border-radius:10px;font-size:11px;font-weight:900;border:2px solid;text-shadow:0 1px 2px rgba(0,0,0,0.1);-webkit-font-smoothing:antialiased}
  .bg{background:#b7e4c7;color:#003d16;border-color:#0b5d22}
  .bb{background:#a3d8fd;color:#003d99;border-color:#0050cc}
  .ba{background:#fdd66b;color:#664d03;border-color:#b8860b}
  .br{background:#f8b4b4;color:#660000;border-color:#cc0000}
  .bp{background:#dda7e0;color:#440066;border-color:#9900cc}
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
          <h1>
            <span className="rpt-brand-herb">Herb</span>
            <span className="rpt-brand-ayur">Ayur</span>
          </h1>
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
    // Green (bg) - Success/Completed/In Stock/Approved
    Delivered: "bg", delivered: "bg",
    Approved: "bg", approved: "bg",
    "In Stock": "bg", "in stock": "bg",
    Completed: "bg", completed: "bg",
    Whole: "bg", whole: "bg",
    Customer: "bg", customer: "bg",
    
    // Amber (ba) - Processing/Pending/Low Stock/Partial
    Processing: "ba", processing: "ba",
    pending: "ba", Pending: "ba",
    "Low Stock": "ba", "low stock": "ba",
    Partial: "ba", partial: "ba",
    Guest: "ba", guest: "ba",
    
    // Blue (bb) - Confirmed/Active/Item/Supplier
    Confirmed: "bb", confirmed: "bb",
    active: "bb", Active: "bb",
    Item: "bb", item: "bb",
    Supplier: "bb", supplier: "bb",
    
    // Red (br) - Rejected/Cancelled/Out of Stock
    Rejected: "br", rejected: "br",
    "Out of Stock": "br", "out of stock": "br",
    Cancelled: "br", cancelled: "br",
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
