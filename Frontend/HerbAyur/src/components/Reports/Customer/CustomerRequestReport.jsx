import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function CustomerRequestReport() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const all = Array.isArray(d) ? d : [];
        setRequests(all.filter(r => r.customerId === user.id || r.customerId?._id === user.id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const getStatus = (request) => {
    if (request.fullyCompleted) return "completed";
    if ((request.coveredItems || []).length > 0) return "partial";
    return "pending";
  };

  const filteredRequests = requests.filter((r) => {
    const status = getStatus(r);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !r.fullyCompleted) ||
      status === statusFilter;
    const matchesDate = (!fromDate && !toDate) || inDateRange(r.requiredDate || r.createdAt, fromDate, toDate);
    return matchesStatus && matchesDate;
  });

  const completed = filteredRequests.filter(r => r.fullyCompleted);
  const active    = filteredRequests.filter(r => !r.fullyCompleted);
  const partial   = active.filter(r => (r.coveredItems || []).length > 0);
  const noOrders  = active.filter(r => (r.coveredItems || []).length === 0);

  const statusLabel = (r) => r.fullyCompleted ? "Completed" : (r.coveredItems||[]).length > 0 ? "Partial" : "Pending";
  const statusClass = (r) => r.fullyCompleted ? "bg" : (r.coveredItems||[]).length > 0 ? "ba" : "br";

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">📋 Requirement Request Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Requirement Request Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
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
        <button className="rpt-filter-reset" onClick={() => { setStatusFilter("all"); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Requirement Request Report" meta={`Customer: ${user.name} · Status: ${statusFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Requests",    value: filteredRequests.length },
            { label: "Active",            value: active.length },
            { label: "Fully Completed",   value: completed.length },
            { label: "Partially Ordered", value: partial.length },
            { label: "No Orders Yet",     value: noOrders.length },
          ]}/>
        </RptSection>

        {active.length > 0 && (
          <RptSection title="🔄 Active Requests">
            <table>
              <thead><tr><th>#</th><th>List Name</th><th>Items</th><th>Required Date</th><th>Ordered</th><th>Remaining</th><th>Status</th></tr></thead>
              <tbody>
                {active.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i+1}</td>
                    <td>{r.listName || "—"}</td>
                    <td>{r.materials.length}</td>
                    <td>{new Date(r.requiredDate).toLocaleDateString()}</td>
                    <td>{(r.coveredItems || []).length}</td>
                    <td>{r.materials.length - (r.coveredItems || []).length}</td>
                    <td><span className={`badge ${statusClass(r)}`}>{statusLabel(r)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RptSection>
        )}

        {completed.length > 0 && (
          <RptSection title="✅ Fully Completed Lists">
            <table>
              <thead><tr><th>#</th><th>List Name</th><th>Items</th><th>Required Date</th><th>Status</th></tr></thead>
              <tbody>
                {completed.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i+1}</td>
                    <td>{r.listName || "—"}</td>
                    <td>{r.materials.length}</td>
                    <td>{new Date(r.requiredDate).toLocaleDateString()}</td>
                    <td><span className="badge bg">Completed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RptSection>
        )}

        <div className="rpt-footer">HerbAyur · Requirement Request Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
