import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function AdminSupplierReport() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSuppliers(Array.isArray(d) ? d.filter(u => u.role === "supplier") : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const approved  = suppliers.filter(s => s.status === "approved").length;
  const pending   = suppliers.filter(s => s.status === "pending").length;
  const rejected  = suppliers.filter(s => s.status === "rejected").length;
  const withPending = suppliers.filter(s => s.pendingChanges?.submittedAt).length;
  // New this month
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const newThisMonth = suppliers.filter(s => new Date(s.createdAt) >= thisMonth).length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">🏭 Supplier Management Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Supplier Management Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Supplier Management Report" meta="Admin"/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Suppliers",    value: suppliers.length },
            { label: "Approved",           value: approved },
            { label: "Pending Approval",   value: pending },
            { label: "Rejected",           value: rejected },
            { label: "New This Month",     value: newThisMonth },
            { label: "Pending Changes",    value: withPending },
          ]}/>
        </RptSection>
        <RptSection title="🆕 Newly Registered Suppliers">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>Status</th><th>Registered</th></tr></thead>
            <tbody>
              {[...suppliers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((s, i) => (
                <tr key={s._id}>
                  <td>{i+1}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.companyName || "—"}</td>
                  <td>{s.email}</td><td>{s.phone}</td><td>{s.address}</td>
                  <td><span className={`badge ${badge(s.status)}`}>{s.status}</span></td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Supplier Management Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
