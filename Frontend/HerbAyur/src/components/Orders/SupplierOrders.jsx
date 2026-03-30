import { useState, useEffect } from "react";
import API_BASE from "../../api";
import "./Orders.css";

const STATUS_OPTIONS = ["Confirmed", "Processing", "Delivered"];
const STATUS_COLORS  = {
  Confirmed:  { bg: "#dbeafe", color: "#1d4ed8" },
  Processing: { bg: "#fef3c7", color: "#d97706" },
  Delivered:  { bg: "#dcfce7", color: "#166534" },
};

export default function SupplierOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate]     = useState("");

  const fetchOrders = () => {
    fetch(`${API_BASE}/orders/supplier-orders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API_BASE}/orders/${id}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body:    JSON.stringify({ orderStatus: status }),
    });
    fetchOrders();
  };

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const delivered    = orders.filter(o => o.orderStatus === "Delivered").length;
  const inProgress   = orders.filter(o => ["Confirmed","Processing"].includes(o.orderStatus)).length;

  if (loading) return <div className="ord-page"><p className="ord-loading">Loading orders...</p></div>;

  return (
    <div className="ord-page">
      <div className="ord-header">
        <h2>💰 Revenue & Orders</h2>
        <span className="ord-count">{orders.length} orders</span>
      </div>

      <div className="sup-stats-grid">
        <div className="sup-stat-card green">
          <div className="sup-stat-num">Rs {totalRevenue.toLocaleString()}</div>
          <div className="sup-stat-label">Total Revenue</div>
        </div>
        <div className="sup-stat-card blue">
          <div className="sup-stat-num">{orders.length}</div>
          <div className="sup-stat-label">Total Orders</div>
        </div>
        <div className="sup-stat-card teal">
          <div className="sup-stat-num">{delivered}</div>
          <div className="sup-stat-label">Delivered</div>
        </div>
        <div className="sup-stat-card amber">
          <div className="sup-stat-num">{inProgress}</div>
          <div className="sup-stat-label">In Progress</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="ord-empty">No orders yet. Customers will appear here after accepting your offers.</div>
      ) : (
        <>
          <div className="ord-filter-bar">
            <input className="ord-search" placeholder="🔍 Search by customer, list or receipt..." value={search} onChange={e => setSearch(e.target.value)}/>
            <select className="ord-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <input className="ord-filter-select" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} title="Filter by date"/>
          </div>
          <div className="ord-table-wrap">
            <table className="ord-table">
              <thead>
                <tr>
                  <th>#</th><th>Receipt</th><th>Customer</th><th>List</th>
                  <th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(o => {
                    const matchStatus = filterStatus === "All" || o.orderStatus === filterStatus;
                    const q = search.toLowerCase();
                    const matchSearch = !q ||
                      `${o.customerId?.firstName} ${o.customerId?.lastName}`.toLowerCase().includes(q) ||
                      o.listName?.toLowerCase().includes(q) ||
                      o.receiptNo?.toLowerCase().includes(q);
                    const d = o.createdAt ? o.createdAt.slice(0, 10) : "";
                    const matchDate = !filterDate || d === filterDate;
                    return matchStatus && matchSearch && matchDate;
                  })
                  .map((o, i) => {
                    const sc = STATUS_COLORS[o.orderStatus] || STATUS_COLORS.Confirmed;
                    return (
                      <tr key={o._id}>
                        <td>{i + 1}</td>
                        <td className="ord-mono">#{o.receiptNo}</td>
                        <td>
                          <div style={{ fontWeight:600 }}>{o.customerId?.firstName} {o.customerId?.lastName}</div>
                          <div style={{ fontSize:"0.78rem", color:"#6b7280" }}>{o.customerId?.phone}</div>
                        </td>
                        <td>{o.listName || "—"}</td>
                        <td>
                          {o.items.map((item, j) => (
                            <div key={j} style={{ fontSize:"0.78rem", color:"#374151" }}>{item.name} × {item.supplyQty} {item.unit}</div>
                          ))}
                        </td>
                        <td style={{ fontWeight:700, color:"#15803d" }}>Rs {o.totalAmount.toLocaleString()}</td>
                        <td><span className="ord-paid-badge">✅ {o.paymentMethod}</span></td>
                        <td>
                          <select
                            className="ord-status-select"
                            style={{ background: sc.bg, color: sc.color }}
                            value={o.orderStatus}
                            onChange={e => updateStatus(o._id, e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{ whiteSpace:"nowrap", fontSize:"0.8rem" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
