import { useState, useEffect, useRef } from "react";
import { Printer, CreditCard, Truck, CheckCircle2, Clock, TrendingUp, ShoppingBag, Calendar, Filter } from "lucide-react";
import API_BASE from "../../api";
import "./PaymentDashboard.css";

function ReceiptPrint({ order, onClose }) {
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
      th{background:#2e7d32;color:white;padding:9px;text-align:left;font-size:13px}
      td{padding:9px;border-bottom:1px solid #f0f0f0;font-size:13px}
      .grand{font-weight:700;font-size:15px;color:#15803d}
      .badge{background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
      .footer{text-align:center;margin-top:28px;color:#9ca3af;font-size:11px;line-height:1.6}
    </style></head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };
  return (
    <div className="pd-receipt-overlay">
      <div className="pd-receipt-modal">
        <div className="pd-receipt-actions">
          <button className="pd-print-btn" onClick={handlePrint}><Printer size={15}/> Print / Save PDF</button>
          <button className="pd-close-btn" onClick={onClose}>✕</button>
        </div>
        <div ref={ref}>
          <div className="logo">🌿 HerbAyur</div>
          <div className="sub">Sri Lanka's Ayurvedic Raw Material Platform</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:20,fontWeight:800}}>PAYMENT RECEIPT</span>
            <span className="badge">✅ {order.paymentStatus}</span>
          </div>
          <hr/>
          <div className="row"><span className="label">Receipt No</span><span className="val">#{order.receiptNo}</span></div>
          <div className="row"><span className="label">Date</span><span className="val">{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="row"><span className="label">Payment Method</span><span className="val">{order.paymentMethod}</span></div>
          <div className="row"><span className="label">Order Status</span><span className="val">{order.orderStatus}</span></div>
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
                  <td>{item.name}</td><td>{item.supplyQty} {item.unit}</td>
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

export function CustomerPayment() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [receipt, setReceipt]     = useState(null);
  const [search, setSearch]       = useState("");
  const [filterMethod, setFilterMethod] = useState("All");
  const [filterDate, setFilterDate]     = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSpent   = orders.reduce((s, o) => s + o.totalAmount, 0);
  const cardPayments = orders.filter(o => o.paymentMethod === "Card");
  const codPayments  = orders.filter(o => o.paymentMethod === "Cash on Delivery");
  const paidOrders   = orders.filter(o => o.paymentStatus === "Paid");

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.receiptNo?.toLowerCase().includes(q) || o.supplierName?.toLowerCase().includes(q) || o.listName?.toLowerCase().includes(q);
    const matchMethod = filterMethod === "All" || o.paymentMethod === filterMethod;
    const d = o.createdAt ? o.createdAt.slice(0, 10) : "";
    const matchDate = !filterDate || d === filterDate;
    return matchSearch && matchMethod && matchDate;
  });

  if (loading) return <div className="pd-loading">Loading payment history...</div>;

  return (
    <div className="pd-page">
      {/* STATS */}
      <div className="pd-stats">
        <div className="pd-stat pd-stat-1">
          <TrendingUp size={22}/>
          <div>
            <div className="pd-stat-num">Rs {totalSpent.toLocaleString()}</div>
            <div className="pd-stat-label">Total Spent</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-2">
          <ShoppingBag size={22}/>
          <div>
            <div className="pd-stat-num">{orders.length}</div>
            <div className="pd-stat-label">Total Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-3">
          <CreditCard size={22}/>
          <div>
            <div className="pd-stat-num">{cardPayments.length}</div>
            <div className="pd-stat-label">Card Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-4">
          <Truck size={22}/>
          <div>
            <div className="pd-stat-num">{codPayments.length}</div>
            <div className="pd-stat-label">COD Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-5">
          <CheckCircle2 size={22}/>
          <div>
            <div className="pd-stat-num">{paidOrders.length}</div>
            <div className="pd-stat-label">Paid Orders</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="pd-filters">
        <div className="pd-filter-box">
          <Filter size={15}/>
          <input placeholder="Search receipt, supplier or list..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="pd-filter-box">
          <Calendar size={15}/>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}/>
        </div>
        <div className="pd-filter-box">
          <CreditCard size={15}/>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
            <option value="All">All Methods</option>
            <option value="Card">Card</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
          </select>
        </div>
      </div>

      {/* PAYMENT TABLE */}
      {filtered.length === 0 ? (
        <div className="pd-empty">No payment records found.</div>
      ) : (
        <div className="pd-table-wrap">
          <table className="pd-table">
            <thead>
              <tr>
                <th>#</th><th>Receipt No</th><th>Date</th><th>Supplier</th>
                <th>List</th><th>Items</th><th>Amount</th><th>Method</th>
                <th>Status</th><th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o._id}>
                  <td>{i + 1}</td>
                  <td className="pd-mono">#{o.receiptNo}</td>
                  <td style={{whiteSpace:"nowrap"}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td><div style={{fontWeight:600}}>{o.supplierName}</div></td>
                  <td>{o.listName || "—"}</td>
                  <td style={{fontSize:"0.78rem"}}>{o.items.map(it => `${it.name} ×${it.supplyQty}${it.unit}`).join(", ")}</td>
                  <td style={{fontWeight:700,color:"#15803d"}}>Rs {o.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`pd-method-badge ${o.paymentMethod === "Card" ? "pd-card" : "pd-cod"}`}>
                      {o.paymentMethod === "Cash on Delivery" ? "COD" : o.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`pd-status-badge ${o.paymentStatus === "Paid" ? "pd-paid" : "pd-pending"}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <button className="pd-receipt-btn" onClick={() => setReceipt(o)}>
                      <Printer size={13}/> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {receipt && <ReceiptPrint order={receipt} onClose={() => setReceipt(null)}/>}
    </div>
  );
}

export function SupplierPayment() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch]   = useState("");
  const [filterMethod, setFilterMethod] = useState("All");
  const [filterDate, setFilterDate]     = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/orders/supplier-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const cardPayments = orders.filter(o => o.paymentMethod === "Card");
  const codPayments  = orders.filter(o => o.paymentMethod === "Cash on Delivery");
  const delivered    = orders.filter(o => o.orderStatus === "Delivered");

  // Revenue by month
  const byMonth = {};
  orders.forEach(o => {
    const m = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
    byMonth[m] = (byMonth[m] || 0) + o.totalAmount;
  });

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.receiptNo?.toLowerCase().includes(q) ||
      `${o.customerId?.firstName} ${o.customerId?.lastName}`.toLowerCase().includes(q) ||
      o.listName?.toLowerCase().includes(q);
    const matchMethod = filterMethod === "All" || o.paymentMethod === filterMethod;
    const d = o.createdAt ? o.createdAt.slice(0, 10) : "";
    const matchDate = !filterDate || d === filterDate;
    return matchSearch && matchMethod && matchDate;
  });

  if (loading) return <div className="pd-loading">Loading payment history...</div>;

  return (
    <div className="pd-page">
      {/* STATS */}
      <div className="pd-stats">
        <div className="pd-stat pd-stat-1">
          <TrendingUp size={22}/>
          <div>
            <div className="pd-stat-num">Rs {totalRevenue.toLocaleString()}</div>
            <div className="pd-stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-2">
          <ShoppingBag size={22}/>
          <div>
            <div className="pd-stat-num">{orders.length}</div>
            <div className="pd-stat-label">Total Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-3">
          <CreditCard size={22}/>
          <div>
            <div className="pd-stat-num">{cardPayments.length}</div>
            <div className="pd-stat-label">Card Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-4">
          <Truck size={22}/>
          <div>
            <div className="pd-stat-num">{codPayments.length}</div>
            <div className="pd-stat-label">COD Payments</div>
          </div>
        </div>
        <div className="pd-stat pd-stat-5">
          <CheckCircle2 size={22}/>
          <div>
            <div className="pd-stat-num">{delivered.length}</div>
            <div className="pd-stat-label">Delivered</div>
          </div>
        </div>
      </div>

      {/* MONTHLY REVENUE */}
      {Object.keys(byMonth).length > 0 && (
        <div className="pd-monthly">
          <h3 className="pd-section-title">📅 Monthly Revenue</h3>
          <div className="pd-monthly-grid">
            {Object.entries(byMonth).map(([month, rev]) => (
              <div key={month} className="pd-monthly-card">
                <div className="pd-monthly-month">{month}</div>
                <div className="pd-monthly-rev">Rs {rev.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="pd-filters">
        <div className="pd-filter-box">
          <Filter size={15}/>
          <input placeholder="Search receipt, customer or list..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="pd-filter-box">
          <Calendar size={15}/>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}/>
        </div>
        <div className="pd-filter-box">
          <CreditCard size={15}/>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
            <option value="All">All Methods</option>
            <option value="Card">Card</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
          </select>
        </div>
      </div>

      {/* PAYMENT TABLE */}
      {filtered.length === 0 ? (
        <div className="pd-empty">No payment records found.</div>
      ) : (
        <div className="pd-table-wrap">
          <table className="pd-table">
            <thead>
              <tr>
                <th>#</th><th>Receipt No</th><th>Date</th><th>Customer</th>
                <th>List</th><th>Items</th><th>Amount</th><th>Method</th>
                <th>Order Status</th><th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o._id}>
                  <td>{i + 1}</td>
                  <td className="pd-mono">#{o.receiptNo}</td>
                  <td style={{whiteSpace:"nowrap"}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{fontWeight:600}}>{o.customerId?.firstName} {o.customerId?.lastName}</div>
                    <div style={{fontSize:"0.75rem",color:"#6b7280"}}>{o.customerId?.phone}</div>
                  </td>
                  <td>{o.listName || "—"}</td>
                  <td style={{fontSize:"0.78rem"}}>{o.items.map(it => `${it.name} ×${it.supplyQty}${it.unit}`).join(", ")}</td>
                  <td style={{fontWeight:700,color:"#15803d"}}>Rs {o.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`pd-method-badge ${o.paymentMethod === "Card" ? "pd-card" : "pd-cod"}`}>
                      {o.paymentMethod === "Cash on Delivery" ? "COD" : o.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`pd-status-badge ${
                      o.orderStatus === "Delivered" ? "pd-delivered" :
                      o.orderStatus === "Processing" ? "pd-processing" : "pd-confirmed"
                    }`}>{o.orderStatus}</span>
                  </td>
                  <td>
                    <button className="pd-receipt-btn" onClick={() => setReceipt(o)}>
                      <Printer size={13}/> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {receipt && <ReceiptPrint order={receipt} onClose={() => setReceipt(null)}/>}
    </div>
  );
}
