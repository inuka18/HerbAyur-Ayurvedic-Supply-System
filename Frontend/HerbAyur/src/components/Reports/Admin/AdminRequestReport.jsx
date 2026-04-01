import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function AdminRequestReport() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRequests(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const completed = requests.filter(r => r.fullyCompleted).length;
  const active    = requests.filter(r => !r.fullyCompleted).length;
  const partial   = requests.filter(r => !r.fullyCompleted && (r.coveredItems || []).length > 0).length;
  const noOrders  = requests.filter(r => !r.fullyCompleted && (r.coveredItems || []).length === 0).length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">📋 Requirement Request Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Requirement Request Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Requirement Request Report" meta="Admin"/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Requests",    value: requests.length },
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
              {requests.map((r, i) => (
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
