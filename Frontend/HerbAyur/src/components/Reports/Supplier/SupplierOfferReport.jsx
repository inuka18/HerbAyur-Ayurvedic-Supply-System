import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function SupplierOfferReport() {
  const [offers, setOffers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const ref   = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/offers/my-offers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOffers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const accepted = offers.filter(o => o.status === "Accepted");
  const pending  = offers.filter(o => o.status === "Pending");
  const rejected = offers.filter(o => o.status === "Rejected");

  const renderTable = (list, emptyMsg) => (
    list.length === 0
      ? <p style={{ color:"#9ca3af", fontSize:"0.85rem", padding:"0.5rem 0" }}>{emptyMsg}</p>
      : <table>
          <thead>
            <tr><th>#</th><th>Request / List</th><th>Customer</th><th>Supply Type</th><th>Items</th><th>Total Value</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {list.map((o, i) => {
              const total = (o.items || []).reduce((s, it) => s + it.price * it.supplyQty, 0);
              return (
                <tr key={o._id}>
                  <td>{i + 1}</td>
                  <td>{o.requestId?.listName || "—"}</td>
                  <td>{o.requestId?.customer?.name || "—"}</td>
                  <td><span className={`badge ${o.supplyType === "Whole" ? "bg" : o.supplyType === "Partial" ? "ba" : "bb"}`}>{o.supplyType}</span></td>
                  <td>{(o.items || []).map(it => `${it.name} ×${it.supplyQty}${it.unit}`).join(", ")}</td>
                  <td>Rs {total.toLocaleString()}</td>
                  <td><span className={`badge ${badge(o.status)}`}>{o.status}</span></td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
  );

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">📨 Offer Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Offer Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Requirement Request Offer Report" meta={`Supplier: ${user.name}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Offers",    value: offers.length },
            { label: "Accepted",        value: accepted.length },
            { label: "Pending",         value: pending.length },
            { label: "Rejected",        value: rejected.length },
          ]}/>
        </RptSection>
        <RptSection title="✅ Accepted Offers">
          {renderTable(accepted, "No accepted offers yet.")}
        </RptSection>
        <RptSection title="⏳ Pending Offers">
          {renderTable(pending, "No pending offers.")}
        </RptSection>
        <RptSection title="❌ Rejected Offers">
          {renderTable(rejected, "No rejected offers.")}
        </RptSection>
        <div className="rpt-footer">HerbAyur · Offer Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
