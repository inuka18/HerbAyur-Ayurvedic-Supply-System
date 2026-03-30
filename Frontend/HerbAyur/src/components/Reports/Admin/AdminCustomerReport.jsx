import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats } from "../reportUtils";
import "../Reports.css";

export default function AdminCustomerReport() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d.filter(u => u.role === "customer") : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const newThisMonth = customers.filter(c => new Date(c.createdAt) >= thisMonth).length;
  const lastMonth = new Date(thisMonth); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const newLastMonth = customers.filter(c => {
    const d = new Date(c.createdAt);
    return d >= lastMonth && d < thisMonth;
  }).length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">👤 Customer Management Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Customer Management Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Customer Management Report" meta="Admin"/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Customers",    value: customers.length },
            { label: "New This Month",     value: newThisMonth },
            { label: "New Last Month",     value: newLastMonth },
          ]}/>
        </RptSection>
        <RptSection title="🆕 All Registered Customers (Newest First)">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Registered</th></tr></thead>
            <tbody>
              {[...customers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((c, i) => (
                <tr key={c._id}>
                  <td>{i+1}</td>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.email}</td><td>{c.phone}</td><td>{c.address}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Customer Management Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
