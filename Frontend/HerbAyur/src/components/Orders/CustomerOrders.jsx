import { useState, useEffect, useRef } from "react";
import { Printer, X, CheckCircle2, Star, MessageSquare, ShoppingBag, AlertCircle, List } from "lucide-react";
import API_BASE from "../../api";
import "./Orders.css";

const STATUS_COLORS = {
  Confirmed:  { bg: "#dbeafe", color: "#1d4ed8" },
  Processing: { bg: "#fef3c7", color: "#d97706" },
  Delivered:  { bg: "#dcfce7", color: "#166534" },
};

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="co-star-row">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={30}
          className={`co-star ${s <= (hovered || value) ? "co-star-filled" : "co-star-empty"}`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        />
      ))}
    </div>
  );
}

function ReceiptModal({ order, onClose }) {
  const ref = useRef();
  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Receipt #${order.receiptNo}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a3c34}
      .logo{font-size:26px;font-weight:800;color:#15803d;margin-bottom:2px}
      .sub{color:#6b7280;font-size:12px;margin-bottom:20px}
      hr{border:none;border-top:1px solid #e5e7eb;margin:14px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
      .label{color:#6b7280}.val{font-weight:600}
      table{width:100%;border-collapse:collapse;margin:14px 0}
      th{background:#66bb6a;color:white;padding:9px;text-align:left;font-size:13px}
      td{padding:9px;border-bottom:1px solid #f0f0f0;font-size:13px}
      .grand{font-weight:700;font-size:15px;color:#15803d}
      .badge{background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
      .footer{text-align:center;margin-top:28px;color:#9ca3af;font-size:11px;line-height:1.6}
    </style></head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  return (
    <div className="ord-overlay">
      <div className="ord-receipt-modal">
        <div className="ord-receipt-actions">
          <button className="ord-print-btn" onClick={handlePrint}><Printer size={15}/> Print / Save PDF</button>
          <button className="ord-close-x" onClick={onClose}><X size={16}/></button>
        </div>
        <div ref={ref}>
          <div className="logo">🌿 HerbAyur</div>
          <div className="sub">Sri Lanka's Ayurvedic Raw Material Platform</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:20,fontWeight:800}}>RECEIPT</span>
            <span className="badge">✅ {order.paymentStatus}</span>
          </div>
          <hr/>
          <div className="row"><span className="label">Receipt No</span><span className="val">#{order.receiptNo}</span></div>
          <div className="row"><span className="label">Date</span><span className="val">{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="row"><span className="label">Payment</span><span className="val">{order.paymentMethod}</span></div>
          <div className="row"><span className="label">Status</span><span className="val">{order.orderStatus}{order.customerConfirmed ? " ✅ Confirmed" : ""}</span></div>
          <hr/>
          <div className="row"><span className="label">Customer</span><span className="val">{order.customerName}</span></div>
          <div className="row"><span className="label">Supplier</span><span className="val">{order.supplierName}</span></div>
          {order.listName && <div className="row"><span className="label">List</span><span className="val">{order.listName}</span></div>}
          <hr/>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.supplyQty} {item.unit}</td>
                  <td>Rs {item.price.toLocaleString()}</td>
                  <td>Rs {(item.price * item.supplyQty).toLocaleString()}</td>
                </tr>
              ))}
              <tr><td colSpan={3} style={{textAlign:"right",paddingRight:12,fontWeight:700}}>Grand Total</td>
                <td className="grand">Rs {order.totalAmount.toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div className="footer">Thank you for using HerbAyur 🌿 | support@herbayur.lk | +94 78 3730 114<br/>Computer-generated receipt. No signature required.</div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrders() {
  const [orders, setOrders]             = useState([]);
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [receipt, setReceipt]           = useState(null);
  const [feedbackMap, setFeedbackMap]   = useState({});
  const [confirmingId, setConfirmingId] = useState(null);
  const [fbModal, setFbModal]           = useState(null);
  const [fbRating, setFbRating]         = useState(0);
  const [fbComment, setFbComment]       = useState("");
  const [fbError, setFbError]           = useState("");
  const [fbSuccess, setFbSuccess]       = useState("");
  const [fbLoading, setFbLoading]       = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, requestsData] = await Promise.all([
        fetch(`${API_BASE}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE}/requests`,          { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      const list = Array.isArray(ordersData) ? ordersData : [];
      setOrders(list);
      setRequests(Array.isArray(requestsData) ? requestsData : []);

      const fbMap = {};
      await Promise.all(
        list.filter(o => o.orderStatus === "Delivered" && o.customerConfirmed).map(async (o) => {
          const d = await fetch(`${API_BASE}/feedback/check-order/${o._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json());
          fbMap[o._id] = d.given;
        })
      );
      setFeedbackMap(fbMap);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const confirmDelivery = async (orderId) => {
    setConfirmingId(orderId);
    try {
      const res  = await fetch(`${API_BASE}/orders/${orderId}/confirm-delivery`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      await fetchData();
      const confirmed = orders.find(o => o._id === orderId);
      if (confirmed) openFeedback(confirmed);
    } catch {}
    finally { setConfirmingId(null); }
  };

  const openFeedback = (order) => {
    setFbModal(order);
    setFbRating(0); setFbComment(""); setFbError(""); setFbSuccess("");
  };

  const submitFeedback = async () => {
    if (!fbRating) return setFbError("Please select a star rating.");
    setFbLoading(true); setFbError("");
    try {
      const res  = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplierId: fbModal.supplierId?._id || fbModal.supplierId,
          orderId:    fbModal._id,
          rating:     fbRating,
          comment:    fbComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setFbError(data.message);
      setFbSuccess("Thank you for your feedback! 🌿");
      setTimeout(() => { setFbModal(null); fetchData(); }, 1800);
    } catch { setFbError("Something went wrong."); }
    finally { setFbLoading(false); }
  };

  const renderOrderCard = (o) => {
    const sc          = STATUS_COLORS[o.orderStatus] || STATUS_COLORS.Confirmed;
    const isDelivered = o.orderStatus === "Delivered";
    const isConfirmed = o.customerConfirmed;
    const hasFeedback = feedbackMap[o._id];

    return (
      <div key={o._id} className="ord-card">
        <div className="ord-card-top">
          <div>
            <div className="ord-receipt-no">#{o.receiptNo}</div>
            <div className="ord-supplier">🏭 {o.supplierName}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <span className="ord-status-badge" style={{ background: sc.bg, color: sc.color }}>
              {o.orderStatus}{isConfirmed ? " ✅" : ""}
            </span>
            <div className="ord-date">{new Date(o.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="ord-items">
          {o.items.map((item, i) => (
            <div key={i} className="ord-item-row">
              <span>{item.name}</span>
              <span>{item.supplyQty} {item.unit}</span>
              <span>Rs {(item.price * item.supplyQty).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {isDelivered && !isConfirmed && (
          <div className="co-confirm-banner">
            <span>📬 Supplier marked this as Delivered. Did you receive your order?</span>
            <button className="co-confirm-btn" onClick={() => confirmDelivery(o._id)} disabled={confirmingId === o._id}>
              <CheckCircle2 size={15}/>
              {confirmingId === o._id ? "Confirming..." : "Confirm Receipt"}
            </button>
          </div>
        )}

        {isDelivered && isConfirmed && !hasFeedback && (
          <div className="co-feedback-banner">
            <span>⭐ Rate your experience with <strong>{o.supplierName}</strong></span>
            <button className="co-feedback-btn" onClick={() => openFeedback(o)}>
              <MessageSquare size={14}/> Write Review
            </button>
          </div>
        )}

        {isDelivered && isConfirmed && hasFeedback && (
          <div className="co-reviewed-banner">✅ You reviewed this order</div>
        )}

        <div className="ord-card-footer">
          <div className="ord-payment-info">
            <span className="ord-method">{o.paymentMethod}</span>
            <span className="ord-paid-badge">✅ {o.paymentStatus}</span>
          </div>
          <div className="ord-total">Rs {o.totalAmount.toLocaleString()}</div>
          <button className="ord-receipt-btn" onClick={() => setReceipt(o)}>
            <Printer size={14}/> Receipt
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="ord-page"><p className="ord-loading">Loading orders...</p></div>;

  // Group orders by listName
  const groups = {};
  orders.forEach(o => {
    const key = o.listName || "Other Orders";
    if (!groups[key]) groups[key] = [];
    groups[key].push(o);
  });

  return (
    <div className="ord-page">
      <div className="ord-header">
        <h2>📦 My Orders & Payments</h2>
        <span className="ord-count">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
      </div>

      {orders.length === 0 ? (
        <div className="ord-empty">No orders yet. Accept a supplier offer to place an order.</div>
      ) : (
        Object.entries(groups).map(([listName, groupOrders]) => {
          // Find the matching request for this listName
          const req = requests.find(r => r.listName === listName);
          const totalItems    = req ? req.materials.length : null;
          const coveredNames  = req ? (req.coveredItems || []).map(n => n.toLowerCase().trim()) : [];
          const orderedCount  = coveredNames.length;
          const isComplete    = req ? req.fullyCompleted : false;
          const remaining     = req ? req.materials.filter(m => !coveredNames.includes(m.name.toLowerCase().trim())) : [];
          const pct           = totalItems ? Math.round((orderedCount / totalItems) * 100) : null;

          return (
            <div key={listName} className="ord-group">
              <div className="ord-group-header">
                <ShoppingBag size={16}/>
                <span className="ord-group-name">{listName}</span>
                <span className="ord-group-badge">{groupOrders.length} order{groupOrders.length > 1 ? "s" : ""}</span>
                {isComplete
                  ? <span className="ord-group-complete"><CheckCircle2 size={13}/> Fully Completed</span>
                  : <span className="ord-group-total">Rs {groupOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</span>
                }
              </div>

              {/* Progress bar */}
              {totalItems !== null && (
                <div className="ord-progress-wrap">
                  <div className="ord-progress-bar">
                    <div className="ord-progress-fill" style={{ width: `${pct}%`, background: isComplete ? "#22c55e" : "#0ea5e9" }}/>
                  </div>
                  <span className="ord-progress-label">
                    {orderedCount}/{totalItems} items ordered ({pct}%)
                  </span>
                </div>
              )}

              {/* Remaining items that still need to be accepted & paid */}
              {!isComplete && remaining.length > 0 && (
                <div className="ord-remaining-banner">
                  <AlertCircle size={15}/>
                  <div>
                    <strong>{remaining.length} item{remaining.length > 1 ? "s" : ""} still need to be ordered:</strong>
                    <div className="ord-remaining-items">
                      {remaining.map((m, i) => (
                        <span key={i} className="ord-remaining-chip">
                          <List size={11}/> {m.name} — {m.quantity} {m.unit}
                        </span>
                      ))}
                    </div>
                    <p className="ord-remaining-hint">Go to <strong>Supplier Offers</strong> tab to accept &amp; pay for these items.</p>
                  </div>
                </div>
              )}

              <div className="ord-list">
                {groupOrders.map(o => renderOrderCard(o))}
              </div>
            </div>
          );
        })
      )}

      {receipt && <ReceiptModal order={receipt} onClose={() => setReceipt(null)}/>}

      {fbModal && (
        <div className="ord-overlay">
          <div className="co-fb-modal">
            <div className="co-fb-header">
              <h3><MessageSquare size={18}/> Rate Your Order</h3>
              <button className="ord-close-x" onClick={() => setFbModal(null)}><X size={16}/></button>
            </div>
            <p className="co-fb-supplier">🏭 {fbModal.supplierName}</p>
            {fbModal.listName && <p className="co-fb-list">📋 {fbModal.listName}</p>}
            <div className="co-fb-section">
              <label>Your Rating</label>
              <StarRating value={fbRating} onChange={setFbRating}/>
              {fbRating > 0 && (
                <span className="co-rating-label">
                  {["","Poor","Fair","Good","Very Good","Excellent"][fbRating]}
                </span>
              )}
            </div>
            <div className="co-fb-section">
              <label>Comment <span style={{color:"#9ca3af",fontWeight:400}}>(optional)</span></label>
              <textarea className="co-fb-textarea" placeholder="Share your experience with this supplier..."
                value={fbComment} onChange={e => setFbComment(e.target.value)} rows={3}/>
            </div>
            {fbError   && <div className="co-fb-error">⚠ {fbError}</div>}
            {fbSuccess && <div className="co-fb-success">{fbSuccess}</div>}
            <div className="co-fb-actions">
              <button className="co-fb-submit" onClick={submitFeedback} disabled={fbLoading || !fbRating}>
                {fbLoading ? "Submitting..." : "Submit Review"}
              </button>
              <button className="co-fb-skip" onClick={() => setFbModal(null)}>Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
