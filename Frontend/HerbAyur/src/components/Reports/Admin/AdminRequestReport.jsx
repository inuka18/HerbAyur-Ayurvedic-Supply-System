import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function AdminRequestReport() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRequests(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
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
      statusFilter === status;
    const matchesDate = (!fromDate && !toDate) || inDateRange(r.requiredDate || r.createdAt, fromDate, toDate);
    return matchesStatus && matchesDate;
  });

  const completed = filteredRequests.filter(r => r.fullyCompleted).length;
  const active    = filteredRequests.filter(r => !r.fullyCompleted).length;
  const partial   = filteredRequests.filter(r => !r.fullyCompleted && (r.coveredItems || []).length > 0).length;
  const noOrders  = filteredRequests.filter(r => !r.fullyCompleted && (r.coveredItems || []).length === 0).length;

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
        <RptHeader title="Requirement Request Report" meta={`Admin · Status: ${statusFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Requests",    value: filteredRequests.length },
            { label: "Active",            value: active },
            { label: "Fully Completed",   value: completed },
            { label: "Partially Ordered", value: partial },
            { label: "No Orders Yet",     value: noOrders },
          ]}/>
        </RptSection>
        <RptSection title="📋 All Requests">
          <table>
            <thead><tr><th>#</th><th>List Name</th><th>Customer</th><th>Location</th><th>Items</th><th>Required Date</th><th>Ordered</th><th>Status</th></tr></thead>
            <tbody>
              {filteredRequests.map((r, i) => (
                <tr key={r._id}>
                  <td>{i+1}</td>
                  <td>{r.listName || "—"}</td>
                  <td>{r.customer?.name}</td>
                  <td>{r.customer?.location}</td>
                  <td>{r.materials.length}</td>
                  <td>{new Date(r.requiredDate).toLocaleDateString()}</td>
                  <td>{(r.coveredItems || []).length}/{r.materials.length}</td>
                  <td><span className={`badge ${r.fullyCompleted ? "bg" : (r.coveredItems||[]).length > 0 ? "ba" : "br"}`}>
                    {r.fullyCompleted ? "Completed" : (r.coveredItems||[]).length > 0 ? "Partial" : "Pending"}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Requirement Request Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
