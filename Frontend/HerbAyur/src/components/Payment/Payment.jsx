import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Truck, CheckCircle2, X, Printer, Lock, Eye, EyeOff } from "lucide-react";
import API_BASE from "../../api";
import "./Payment.css";

function Receipt({ order, onClose }) {
  const receiptRef = useRef();
  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Receipt - ${order.receiptNo}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a3c34}
      .logo{font-size:28px;font-weight:800;color:#15803d;margin-bottom:4px}
      .sub{color:#6b7280;font-size:13px;margin-bottom:24px}
      .divider{border:none;border-top:1px solid #e5e7eb;margin:16px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px}
      .label{color:#6b7280}.val{font-weight:600}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:#66bb6a;color:white;padding:10px;text-align:left;font-size:13px}
      td{padding:10px;border-bottom:1px solid #f0f0f0;font-size:13px}
      .total-row{font-weight:700;font-size:16px;color:#15803d}
      .badge{background:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
      .footer{text-align:center;margin-top:32px;color:#9ca3af;font-size:12px}
    </style></head><body>${receiptRef.current.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal">
        <div className="receipt-actions">
          <button className="receipt-print-btn" onClick={handlePrint}><Printer size={16}/> Print / Save PDF</button>
          <button className="receipt-close-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div ref={receiptRef}>
          <div className="logo">🌿 HerbAyur</div>
          <div className="sub">Sri Lanka's Ayurvedic Raw Material Platform</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:22,fontWeight:800,color:"#1a3c34"}}>RECEIPT</span>
            <span className="badge">✅ {order.paymentStatus}</span>
          </div>
          <hr className="divider"/>
          <div className="row"><span className="label">Receipt No</span><span className="val">#{order.receiptNo}</span></div>
          <div className="row"><span className="label">Date</span><span className="val">{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="row"><span className="label">Payment Method</span><span className="val">{order.paymentMethod === "Cash on Delivery" ? "COD" : order.paymentMethod}</span></div>
          <div className="row"><span className="label">Order Status</span><span className="val">{order.orderStatus}</span></div>
          <hr className="divider"/>
          <div className="row"><span className="label">Customer</span><span className="val">{order.customerName}</span></div>
          <div className="row"><span className="label">Supplier</span><span className="val">{order.supplierName}</span></div>
          {order.listName && <div className="row"><span className="label">List</span><span className="val">{order.listName}</span></div>}
          <hr className="divider"/>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td><td>{item.supplyQty} {item.unit}</td>
                  <td>Rs {item.price.toLocaleString()}</td>
                  <td>Rs {(item.price * item.supplyQty).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3} style={{textAlign:"right",paddingRight:16}}>Grand Total</td>
                <td>Rs {order.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div className="footer">Thank you for using HerbAyur 🌿 | support@herbayur.lk | +94 78 3730 114<br/>Computer-generated receipt. No signature required.</div>
        </div>
      </div>
    </div>
  );
}

function CardPortal({ total, onSuccess, onCancel }) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [showCvv, setShowCvv] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");

  const formatCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g,"").slice(0,4);
    return d.length > 2 ? d.slice(0,2) + "/" + d.slice(2) : d;
  };

  const handlePay = () => {
    setErr("");
    const num = card.number.replace(/\s/g,"");
    if (num.length < 16)       return setErr("Enter a valid 16-digit card number.");
    if (!card.name.trim())     return setErr("Enter the cardholder name.");
    if (card.expiry.length < 5) return setErr("Enter a valid expiry date (MM/YY).");
    if (card.cvv.length < 3)   return setErr("Enter a valid CVV.");
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onSuccess(); }, 2000);
  };

  return (
    <div className="card-portal">
      <div className="card-portal-header">
        <Lock size={16}/> Secure Card Payment
        <span className="card-total">Rs {total.toLocaleString()}</span>
      </div>

      <div className="card-preview">
        <div className="card-chip">💳</div>
        <div className="card-num-preview">{card.number || "•••• •••• •••• ••••"}</div>
        <div className="card-bottom-preview">
          <span>{card.name || "CARDHOLDER NAME"}</span>
          <span>{card.expiry || "MM/YY"}</span>
        </div>
      </div>

      <div className="card-fields">
        <div className="card-field">
          <label>Card Number</label>
          <input placeholder="1234 5678 9012 3456" maxLength={19}
            value={card.number} onChange={e => setCard(p => ({...p, number: formatCard(e.target.value)}))}/>
        </div>
        <div className="card-field">
          <label>Cardholder Name</label>
          <input placeholder="Name on card" value={card.name}
            onChange={e => setCard(p => ({...p, name: e.target.value.toUpperCase()}))}/>
        </div>
        <div className="card-row">
          <div className="card-field">
            <label>Expiry Date</label>
            <input placeholder="MM/YY" maxLength={5} value={card.expiry}
              onChange={e => setCard(p => ({...p, expiry: formatExpiry(e.target.value)}))}/>
          </div>
          <div className="card-field">
            <label>CVV</label>
            <div className="cvv-wrap">
              <input type={showCvv ? "text" : "password"} placeholder="•••" maxLength={4}
                value={card.cvv} onChange={e => setCard(p => ({...p, cvv: e.target.value.replace(/\D/g,"").slice(0,4)}))}/>
              <button type="button" className="cvv-eye" onClick={() => setShowCvv(p => !p)}>
                {showCvv ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {err && <div className="card-error">⚠ {err}</div>}

      {processing && (
        <div className="card-processing">
          <div className="card-spinner"/> Processing payment...
        </div>
      )}

      <div className="card-actions">
        <button className="card-pay-btn" onClick={handlePay} disabled={processing}>
          <Lock size={15}/> {processing ? "Processing..." : `Pay Rs ${total.toLocaleString()}`}
        </button>
        <button className="card-cancel-btn" onClick={onCancel} disabled={processing}>Cancel</button>
      </div>

      <div className="card-secure-note">🔒 256-bit SSL encrypted · Your card details are secure</div>
    </div>
  );
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bid, supplier, request } = location.state || {};

  const [method, setMethod]         = useState("Card");
  const [showCardPortal, setShowCardPortal] = useState(false);
  const [paying, setPaying]         = useState(false);
  const [order, setOrder]           = useState(null);
  const [error, setError]           = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const token = localStorage.getItem("token");
  const total = bid?.items?.reduce((s, i) => s + i.price * i.supplyQty, 0) || 0;

  const createOrder = async (paymentMethod) => {
    setPaying(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ offerId: bid._id, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setOrder(data);
      setShowReceipt(true);
    } catch { setError("Payment failed. Please try again."); }
    finally { setPaying(false); }
  };

  const handleConfirm = () => {
    if (method === "Card") {
      setShowCardPortal(true);
    } else {
      createOrder("Cash on Delivery");
    }
  };

  if (!bid) return (
    <div className="pay-page">
      <p style={{padding:"2rem",color:"#555"}}>No payment data found.</p>
      <button onClick={() => navigate(-1)} className="pay-back-btn">← Go Back</button>
    </div>
  );

  return (
    <div className="pay-page">
      <div className="pay-card">
        <div className="pay-header">
          <h2>🌿 Complete Payment</h2>
          <p>Review your order and choose a payment method</p>
        </div>

        {/* ORDER SUMMARY */}
        <div className="pay-summary">
          <h3>Order Summary</h3>
          {request?.listName && (
            <p className="pay-listname">📋 {request.listName}</p>
          )}
          <p className="pay-supplier">🏭 {supplier?.companyName || `${supplier?.firstName} ${supplier?.lastName}`}</p>

          {request?.listName ? (
            // Group: items from this list vs items from other orders
            (() => {
              const listItems  = bid.items.filter(i => i.listName === request.listName || !i.listName);
              const otherItems = bid.items.filter(i => i.listName && i.listName !== request.listName);
              const listTotal  = listItems.reduce((s, i) => s + i.price * i.supplyQty, 0);
              const otherTotal = otherItems.reduce((s, i) => s + i.price * i.supplyQty, 0);
              return (
                <>
                  <div className="pay-group-label">📋 {request.listName}</div>
                  <table className="pay-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody>
                      {listItems.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td><td>{item.supplyQty} {item.unit}</td>
                          <td>Rs {item.price.toLocaleString()}</td>
                          <td>Rs {(item.price * item.supplyQty).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {otherItems.length > 0 && (
                    <>
                      <div className="pay-group-label" style={{ marginTop:"1rem" }}>📦 Other Orders</div>
                      <table className="pay-table">
                        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                        <tbody>
                          {otherItems.map((item, i) => (
                            <tr key={i}>
                              <td>{item.name}</td><td>{item.supplyQty} {item.unit}</td>
                              <td>Rs {item.price.toLocaleString()}</td>
                              <td>Rs {(item.price * item.supplyQty).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              );
            })()
          ) : (
            <table className="pay-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                {bid.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td><td>{item.supplyQty} {item.unit}</td>
                    <td>Rs {item.price.toLocaleString()}</td>
                    <td>Rs {(item.price * item.supplyQty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pay-total">Grand Total: <span>Rs {total.toLocaleString()}</span></div>
        </div>

        {/* PAYMENT METHOD — only Card and COD */}
        {!showCardPortal && (
          <>
            <div className="pay-methods">
              <h3>Payment Method</h3>
              <div className="pay-method-grid">
                <button className={`pay-method-btn ${method === "Card" ? "active" : ""}`} onClick={() => setMethod("Card")}>
                  <CreditCard size={20}/> Credit / Debit Card
                </button>
                <button className={`pay-method-btn ${method === "Cash on Delivery" ? "active" : ""}`} onClick={() => setMethod("Cash on Delivery")}>
                  <Truck size={20}/> Cash on Delivery (COD)
                </button>
              </div>
            </div>

            {error && <div className="pay-error">⚠ {error}</div>}

            <div className="pay-actions">
              <button className="pay-back-btn" onClick={() => navigate(-1)}>← Back</button>
              <button className="pay-confirm-btn" onClick={handleConfirm} disabled={paying}>
                {paying ? "Processing..." : <><CheckCircle2 size={18}/> {method === "Card" ? "Proceed to Card Payment" : `Confirm COD · Rs ${total.toLocaleString()}`}</>}
              </button>
            </div>
          </>
        )}

        {/* CARD PORTAL */}
        {showCardPortal && (
          <CardPortal
            total={total}
            onSuccess={() => { setShowCardPortal(false); createOrder("Card"); }}
            onCancel={() => setShowCardPortal(false)}
          />
        )}
      </div>

      {showReceipt && order && (
        <Receipt order={order} onClose={() => { setShowReceipt(false); navigate("/customer-dashboard"); }}/>
      )}
    </div>
  );
}
