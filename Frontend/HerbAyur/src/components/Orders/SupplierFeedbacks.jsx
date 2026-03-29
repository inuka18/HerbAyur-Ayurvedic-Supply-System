import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import API_BASE from "../../api";
import "../Orders/Orders.css";
import "./SupplierFeedbacks.css";

function Stars({ rating }) {
  return (
    <div className="sf-stars">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={16}
          className={s <= rating ? "sf-star-filled" : "sf-star-empty"}/>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="sf-bar-row">
      <span className="sf-bar-label">{label}</span>
      <div className="sf-bar-track">
        <div className="sf-bar-fill" style={{ width:`${pct}%`, background: color }}/>
      </div>
      <span className="sf-bar-count">{count}</span>
    </div>
  );
}

export default function SupplierFeedbacks() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all, 1-5 = star filter

  useEffect(() => {
    fetch(`${API_BASE}/feedback/my-feedbacks`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ord-page"><p className="ord-loading">Loading feedbacks...</p></div>;

  const feedbacks = data?.feedbacks || [];
  const avg       = data?.avg || null;
  const total     = data?.count || 0;

  const starCounts = [5,4,3,2,1].map(s => ({
    star: s,
    count: feedbacks.filter(f => f.rating === s).length,
    color: s >= 4 ? "#22c55e" : s === 3 ? "#f59e0b" : "#ef4444",
  }));

  const displayed = filter === 0 ? feedbacks : feedbacks.filter(f => f.rating === filter);

  return (
    <div className="ord-page">
      <div className="ord-header">
        <h2>⭐ Customer Feedbacks</h2>
        <span className="ord-count">{total} reviews</span>
      </div>

      {total === 0 ? (
        <div className="ord-empty">No feedbacks yet. Complete orders to receive customer reviews.</div>
      ) : (
        <>
          {/* SUMMARY CARD */}
          <div className="sf-summary">
            <div className="sf-avg-block">
              <div className="sf-avg-num">{avg || "—"}</div>
              <Stars rating={Math.round(avg || 0)}/>
              <div className="sf-avg-label">{total} review{total !== 1 ? "s" : ""}</div>
            </div>
            <div className="sf-bars">
              {starCounts.map(({ star, count, color }) => (
                <RatingBar key={star} label={`${star}★`} count={count} total={total} color={color}/>
              ))}
            </div>
          </div>

          {/* FILTER */}
          <div className="sf-filter">
            <button className={filter === 0 ? "sf-filter-btn active" : "sf-filter-btn"} onClick={() => setFilter(0)}>All</button>
            {[5,4,3,2,1].map(s => (
              <button key={s}
                className={filter === s ? "sf-filter-btn active" : "sf-filter-btn"}
                onClick={() => setFilter(s)}>
                {s}★
              </button>
            ))}
          </div>

          {/* FEEDBACK CARDS */}
          <div className="sf-list">
            {displayed.length === 0 ? (
              <p style={{ color:"#9ca3af", padding:"1rem" }}>No {filter}★ reviews yet.</p>
            ) : displayed.map((f, i) => (
              <div key={i} className="sf-card">
                {/* HEADER */}
                <div className="sf-card-header">
                  <div className="sf-customer-avatar">
                    {f.customerId?.firstName?.[0]}{f.customerId?.lastName?.[0]}
                  </div>
                  <div className="sf-customer-info">
                    <div className="sf-customer-name">{f.customerId?.firstName} {f.customerId?.lastName}</div>
                    {f.customerId?.phone && <div className="sf-customer-phone">{f.customerId.phone}</div>}
                  </div>
                  <div className="sf-card-right">
                    <Stars rating={f.rating}/>
                    <div className="sf-date">{new Date(f.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* COMMENT */}
                {f.comment && (
                  <div className="sf-comment">"{f.comment}"</div>
                )}

                {/* ORDER DETAILS */}
                {f.orderId && (
                  <div className="sf-order-details">
                    <div className="sf-order-header">
                      <span className="sf-order-receipt">📦 Order #{f.orderId.receiptNo}</span>
                      {f.orderId.listName && <span className="sf-order-list">📋 {f.orderId.listName}</span>}
                      <span className="sf-order-amount">Rs {f.orderId.totalAmount?.toLocaleString()}</span>
                      <span className={`sf-order-status sf-status-${(f.orderId.orderStatus||"").toLowerCase()}`}>
                        {f.orderId.orderStatus}
                      </span>
                    </div>
                    {f.orderId.items?.length > 0 && (
                      <div className="sf-order-items">
                        {f.orderId.items.map((item, j) => (
                          <span key={j} className="sf-item-tag">{item.name} × {item.supplyQty}{item.unit}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
