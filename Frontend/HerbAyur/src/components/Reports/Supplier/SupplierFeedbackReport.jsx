import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function SupplierFeedbackReport() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/feedback/my-feedbacks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const feedbacks = data?.feedbacks || [];
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesRating = ratingFilter === "all" || String(f.rating) === ratingFilter;
    const matchesDate = (!fromDate && !toDate) || inDateRange(f.createdAt, fromDate, toDate);
    return matchesRating && matchesDate;
  });

  const avg = filteredFeedbacks.length
    ? (filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length).toFixed(1)
    : null;
  const star5 = filteredFeedbacks.filter(f => f.rating === 5).length;
  const star4 = filteredFeedbacks.filter(f => f.rating === 4).length;
  const star3 = filteredFeedbacks.filter(f => f.rating === 3).length;
  const star2 = filteredFeedbacks.filter(f => f.rating === 2).length;
  const star1 = filteredFeedbacks.filter(f => f.rating === 1).length;

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">⭐ Feedback Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Feedback Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Rating</label>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
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
        <button className="rpt-filter-reset" onClick={() => { setRatingFilter("all"); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Customer Feedback Report" meta={`Supplier: ${user.name} · Rating: ${ratingFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Reviews",  value: filteredFeedbacks.length },
            { label: "Average Rating", value: avg ? `${avg} ★` : "—" },
            { label: "5 Stars",        value: star5 },
            { label: "4 Stars",        value: star4 },
            { label: "3 Stars",        value: star3 },
            { label: "2 Stars",        value: star2 },
            { label: "1 Star",         value: star1 },
          ]}/>
        </RptSection>
        <RptSection title="⭐ All Reviews">
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Order</th><th>Date</th></tr></thead>
            <tbody>
              {filteredFeedbacks.map((f, i) => (
                <tr key={f._id}>
                  <td>{i+1}</td>
                  <td>{f.customerId?.firstName} {f.customerId?.lastName}</td>
                  <td>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</td>
                  <td>{f.comment || "—"}</td>
                  <td>{f.orderId?.receiptNo ? `#${f.orderId.receiptNo}` : "—"}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Feedback Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
