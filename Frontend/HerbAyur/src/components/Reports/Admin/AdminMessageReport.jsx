import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function AdminMessageReport() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/contact`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const filteredMessages = messages.filter((m) => {
    const role = m.role || "guest";
    const matchesRole = roleFilter === "all" || role === roleFilter;
    const matchesDate = (!fromDate && !toDate) || inDateRange(m.createdAt, fromDate, toDate);
    return matchesRole && matchesDate;
  });

  const fromCustomers  = filteredMessages.filter(m => m.role === "customer").length;
  const fromSuppliers  = filteredMessages.filter(m => m.role === "supplier").length;
  const fromGuests     = filteredMessages.filter(m => !m.role || m.role === "guest").length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">✉️ Message Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Message Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Sender Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="guest">Guest</option>
          </select>
        </div>
        <div className="rpt-filter-field">
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="rpt-filter-field">
          <label>To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button className="rpt-filter-reset" onClick={() => { setRoleFilter("all"); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Contact Message Report" meta={`Admin · Role: ${roleFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Messages",   value: filteredMessages.length },
            { label: "From Customers",   value: fromCustomers },
            { label: "From Suppliers",   value: fromSuppliers },
            { label: "From Guests",      value: fromGuests },
          ]}/>
        </RptSection>
        <RptSection title="✉️ All Messages">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Message</th><th>Received</th></tr></thead>
            <tbody>
              {filteredMessages.map((m, i) => (
                <tr key={m._id}>
                  <td>{i+1}</td>
                  <td>{m.name}</td>
                  <td><span className={`badge ${m.role === "customer" ? "bg" : m.role === "supplier" ? "bb" : "ba"}`}>
                    {m.role === "customer" ? "Customer" : m.role === "supplier" ? "Supplier" : "Guest"}
                  </span></td>
                  <td>{m.email}</td>
                  <td style={{ maxWidth:"300px", wordBreak:"break-word" }}>{m.message}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Message Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
