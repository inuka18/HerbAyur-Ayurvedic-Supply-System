import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats } from "../reportUtils";
import "../Reports.css";

export default function AdminMessageReport() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/contact`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const fromCustomers  = messages.filter(m => m.role === "customer").length;
  const fromSuppliers  = messages.filter(m => m.role === "supplier").length;
  const fromGuests     = messages.filter(m => !m.role || m.role === "guest").length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">✉️ Message Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Message Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Contact Message Report" meta="Admin"/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Messages",   value: messages.length },
            { label: "From Customers",   value: fromCustomers },
            { label: "From Suppliers",   value: fromSuppliers },
            { label: "From Guests",      value: fromGuests },
          ]}/>
        </RptSection>
        <RptSection title="✉️ All Messages">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Message</th><th>Received</th></tr></thead>
            <tbody>
              {messages.map((m, i) => (
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
