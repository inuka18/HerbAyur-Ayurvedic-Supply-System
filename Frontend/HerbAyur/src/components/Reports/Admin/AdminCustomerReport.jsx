import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function AdminCustomerReport() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d.filter(u => u.role === "customer") : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const searchLower = search.trim().toLowerCase();
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = !searchLower || `${c.firstName || ""} ${c.lastName || ""} ${c.email || ""}`.toLowerCase().includes(searchLower);
    const matchesDate = (!fromDate && !toDate) || inDateRange(c.createdAt, fromDate, toDate);
    return matchesSearch && matchesDate;
  });

  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const newThisMonth = filteredCustomers.filter(c => new Date(c.createdAt) >= thisMonth).length;
  const lastMonth = new Date(thisMonth); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const newLastMonth = filteredCustomers.filter(c => {
    const d = new Date(c.createdAt);
    return d >= lastMonth && d < thisMonth;
  }).length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">👤 Customer Management Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Customer Management Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Search Customer</label>
          <input type="text" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rpt-filter-field">
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="rpt-filter-field">
          <label>To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button className="rpt-filter-reset" onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Customer Management Report" meta={`Admin · Search: ${search || "All"} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Customers",    value: filteredCustomers.length },
            { label: "New This Month",     value: newThisMonth },
            { label: "New Last Month",     value: newLastMonth },
          ]}/>
        </RptSection>
        <RptSection title="🆕 All Registered Customers (Newest First)">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Registered</th></tr></thead>
            <tbody>
              {[...filteredCustomers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((c, i) => (
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
