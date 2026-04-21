import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API_BASE from "../../api";
import "./AdminDashboard.css";
import { AdminReport } from "../Reports/Reports";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const token = () => localStorage.getItem("token");

const COLORS = ["#22c55e","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#06b6d4"];

function StarDisplay({ avg, count }) {
  const filled = Math.round(avg || 0);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s<=filled?"#f59e0b":"#d1d5db", fontSize:"14px" }}>★</span>)}
      <span style={{ fontSize:"0.78rem", color:"#6b7280", marginLeft:"4px" }}>{avg ? `${avg} (${count})` : "No ratings"}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="adm-stat-card" style={{ borderLeft:`4px solid ${color}` }}>
      <div className="adm-stat-icon" style={{ background: color+"22", color }}>{icon}</div>
      <div>
        <div className="adm-stat-val">{value}</div>
        <div className="adm-stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const [tab, setTab]               = useState(location.state?.tab || "overview");

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);
  const [suppliers, setSuppliers]   = useState([]);
  const [ratings, setRatings]       = useState({});
  const [messages, setMessages]     = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [stats, setStats]           = useState(null);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ordSearch, setOrdSearch]     = useState("");
  const [ordStatus, setOrdStatus]     = useState("All");
  const [ordPayment, setOrdPayment]   = useState("All");
  const [ordDate, setOrdDate]         = useState("");
  const [supSearch, setSupSearch]     = useState("");
  const [supStatus, setSupStatus]     = useState("All");

  const [warnModal, setWarnModal]   = useState(null); // { supplierId, name }
  const [warnMsg, setWarnMsg]       = useState("");
  const [warnLoading, setWarnLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [sRes, oRes, rRes, stRes] = await Promise.all([
        fetch(`${API_BASE}/auth/users`,  { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
        fetch(`${API_BASE}/orders/all`,  { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
        fetch(`${API_BASE}/requests`).then(r=>r.json()),
        fetch(`${API_BASE}/auth/stats`,  { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      ]);
      setSuppliers(Array.isArray(sRes) ? sRes.filter(u=>u.role==="supplier") : []);
      setAdminOrders(Array.isArray(oRes) ? oRes : []);
      setRequests(Array.isArray(rRes) ? rRes : []);
      setStats(stRes);
    } catch {}
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/users`, { headers:{ Authorization:`Bearer ${token()}` } });
      const data = await res.json();
      const list = Array.isArray(data) ? data.filter(u=>u.role==="supplier") : [];
      setSuppliers(list);
      const rm = {};
      await Promise.all(list.map(async s => { const r=await fetch(`${API_BASE}/feedback/supplier/${s._id}`); const d=await r.json(); rm[s._id]={avg:d.avg,count:d.count}; }));
      setRatings(rm);
    } catch {}
    setLoading(false);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/contact`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    fetch(`${API_BASE}/orders/all`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>setAdminOrders(Array.isArray(d)?d:[])).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (tab==="overview")   fetchOverview();
    else if (tab==="suppliers") fetchSuppliers();
    else if (tab==="messages")  fetchMessages();
    else if (tab==="orders")    fetchOrders();
  }, [tab]);

  const sendWarning = async () => {
    if (!warnMsg.trim()) return;
    setWarnLoading(true);
    await fetch(`${API_BASE}/auth/warn/${warnModal.supplierId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ message: warnMsg }),
    });
    setWarnLoading(false);
    setWarnModal(null);
    setWarnMsg("");
    fetchSuppliers();
  };

  const removeUser = async (userId, name) => {
    if (!window.confirm(`Remove "${name}" from the system? This cannot be undone.`)) return;
    await fetch(`${API_BASE}/auth/remove/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    fetchSuppliers();
  };

  const supplierAction = async (supplierId, action) => {
    await fetch(`${API_BASE}/notifications/supplier-action`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify({supplierId,action})});
    fetchSuppliers();
  };

  const approveRejectChanges = async (supplierId, action) => {
    await fetch(`${API_BASE}/auth/profile-changes/${supplierId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
    });
    fetchSuppliers();
  };

  const removeWarning = async (supplierId, warningIndex) => {
    await fetch(`${API_BASE}/auth/warn/${supplierId}/${warningIndex}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    fetchSuppliers();
  };

  const pendingCount = suppliers.filter(s=>s.status==="pending").length;

  // Chart data
  const supplierStatusData = stats ? [
    { name:"Approved", value: stats.approvedSuppliers },
    { name:"Pending",  value: stats.pendingSuppliers  },
    { name:"Rejected", value: stats.rejectedSuppliers },
  ] : [];

  const orderStatusData = ["Confirmed","Processing","Shipped","Delivered","Cancelled"].map(s => ({
    name: s, value: adminOrders.filter(o=>o.orderStatus===s).length,
  })).filter(d=>d.value>0);

  const paymentMethodData = ["Card","Bank Transfer","Cash on Delivery"].map(m=>({
    name:m, value: adminOrders.filter(o=>o.paymentMethod===m).length,
  })).filter(d=>d.value>0);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="sd-header-left">
          <span className="sd-header-icon">🌿</span>
          <div>
            <h2 className="sd-header-title">Admin Dashboard</h2>
            <p className="sd-header-sub">Platform management & overview</p>
          </div>
        </div>
        <div className="admin-tabs">
          {[
            { id:"overview",   label:"📊 Overview" },
            { id:"suppliers",  label:"🏭 Suppliers", badge: pendingCount>0 ? pendingCount : null },
            { id:"messages",   label:"✉️ Messages",  count: messages.length },
            { id:"orders",     label:"🛒 Orders",    count: adminOrders.length },
            { id:"reports",    label:"📋 Reports" },
          ].map(t => (
            <button key={t.id} className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}>
              {t.label}
              {t.badge && <span className="tab-badge">{t.badge}</span>}
              {t.count>0 && tab!==t.id && <span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="admin-state" style={{margin:"2rem"}}>Loading...</div> : (

        /* ── OVERVIEW ── */
        tab==="overview" ? (
          <div className="adm-overview">
            {/* STAT CARDS */}
            <div className="adm-stats-grid">
              <StatCard icon="🏭" label="Total Suppliers"  value={stats?.totalSuppliers||0}  color="#22c55e"/>
              <StatCard icon="👤" label="Total Customers"  value={stats?.totalCustomers||0}  color="#3b82f6"/>
              <StatCard icon="📋" label="Total Requests"   value={requests.length}            color="#f59e0b"/>
              <StatCard icon="🛒" label="Total Orders"     value={adminOrders.length}         color="#8b5cf6"/>
              <StatCard icon="⏳" label="Pending Suppliers" value={stats?.pendingSuppliers||0} color="#ef4444"/>
            </div>

            <div className="adm-charts-grid">
              {/* Supplier Status Pie */}
              <div className="adm-chart-card">
                <h3>Supplier Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={supplierStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {supplierStatusData.map((_,i)=><Cell key={i} fill={["#22c55e","#f59e0b","#ef4444"][i]}/>)}
                    </Pie>
                    <Tooltip/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status Pie */}
              <div className="adm-chart-card">
                <h3>Order Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {orderStatusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Method Pie */}
              <div className="adm-chart-card">
                <h3>Payment Methods</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {paymentMethodData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Requests vs Orders Line */}
              <div className="adm-chart-card adm-chart-wide">
                <h3>Platform Activity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name:"Requests", value: requests.length },
                    { name:"Orders",   value: adminOrders.length },
                    { name:"Suppliers",value: stats?.totalSuppliers||0 },
                    { name:"Customers",value: stats?.totalCustomers||0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="name" tick={{fontSize:12}}/>
                    <YAxis tick={{fontSize:12}}/>
                    <Tooltip/>
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {["#22c55e","#8b5cf6","#f59e0b","#3b82f6"].map((c,i)=><Cell key={i} fill={c}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        /* ── SUPPLIERS ── */
        ) : tab==="suppliers" ? (
          suppliers.length===0 ? <div className="admin-state">No suppliers registered.</div> : (
            <>
              {/* PENDING PROFILE CHANGES */}
              {suppliers.some(s => s.pendingChanges?.submittedAt) && (
                <div className="adm-changes-section">
                  <h3 className="adm-changes-title">⚠ Pending Profile Changes</h3>
                  {suppliers.filter(s => s.pendingChanges?.submittedAt).map(s => (
                    <div key={s._id} className="adm-change-card">
                      <div className="adm-change-header">
                        <strong>{s.firstName} {s.lastName}</strong>
                        <span style={{color:"#6b7280",fontSize:"0.8rem"}}>{s.email}</span>
                        <span style={{color:"#9ca3af",fontSize:"0.75rem"}}>Submitted: {new Date(s.pendingChanges.submittedAt).toLocaleString()}</span>
                      </div>
                      <div className="adm-change-fields">
                        {s.pendingChanges.firstName    && <div className="adm-change-row"><span>First Name</span><span>{s.firstName} → <strong>{s.pendingChanges.firstName}</strong></span></div>}
                        {s.pendingChanges.lastName     && <div className="adm-change-row"><span>Last Name</span><span>{s.lastName} → <strong>{s.pendingChanges.lastName}</strong></span></div>}
                        {s.pendingChanges.phone        && <div className="adm-change-row"><span>Phone</span><span>{s.phone} → <strong>{s.pendingChanges.phone}</strong></span></div>}
                        {s.pendingChanges.address      && <div className="adm-change-row"><span>Address</span><span>{s.address} → <strong>{s.pendingChanges.address}</strong></span></div>}
                        {s.pendingChanges.companyName  && <div className="adm-change-row"><span>Company</span><span>{s.companyName} → <strong>{s.pendingChanges.companyName}</strong></span></div>}
                        {s.pendingChanges.certificationUrl && <div className="adm-change-row"><span>Certification</span><a href={`http://localhost:5000${s.pendingChanges.certificationUrl}`} target="_blank" rel="noreferrer" className="cert-link">📄 View New File</a></div>}
                      </div>
                      <div className="adm-change-actions">
                        <button className="btn-approve" onClick={() => approveRejectChanges(s._id, "approve")}>✅ Approve Changes</button>
                        <button className="btn-reject"  onClick={() => approveRejectChanges(s._id, "reject")}>❌ Reject Changes</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-table-wrap">
                <div className="adm-filter-bar">
                  <input className="adm-search" placeholder="🔍 Search by name, company or email..." value={supSearch} onChange={e => setSupSearch(e.target.value)}/>
                  <select className="adm-filter-select" value={supStatus} onChange={e => setSupStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>Certification</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {suppliers
                      .filter(s => {
                        const matchStatus = supStatus === "All" || s.status === supStatus;
                        const q = supSearch.toLowerCase();
                        const matchSearch = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.companyName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                        return matchStatus && matchSearch;
                      })
                      .map((s,i)=>(
                      <tr key={s._id}>
                        <td>{i+1}</td>
                        <td>
                          <div className="supplier-name-cell">
                            <span className="supplier-name">{s.firstName} {s.lastName}</span>
                            <div className="supplier-tags">
                              {s.pendingChanges?.submittedAt && <span className="pending-edit-tag">✏ Edit Pending</span>}
                            {s.warnings?.length > 0 && (
                                s.warnings.map((w, wi) => (
                                  <span key={wi} className="warn-count-tag">
                                    <span className="warn-tag-icon">⚠️</span>
                                    Warning {wi + 1}
                                    <button
                                      className="warn-tag-remove"
                                      title={w.message}
                                      onClick={() => removeWarning(s._id, wi)}
                                    >×</button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{s.companyName||"—"}</td>
                        <td>{s.email}</td><td>{s.phone}</td><td>{s.address}</td>
                        <td>{s.certificationUrl?<a href={`http://localhost:5000${s.certificationUrl}`} target="_blank" rel="noreferrer" className="cert-link">📄 View</a>:"—"}</td>
                        <td><StarDisplay avg={ratings[s._id]?.avg} count={ratings[s._id]?.count}/></td>
                        <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                        <td className="action-btns">
                          {s.status==="pending"&&<><button className="btn-approve" onClick={()=>supplierAction(s._id,"approved")}>✅ Approve</button><button className="btn-reject" onClick={()=>supplierAction(s._id,"rejected")}>❌ Reject</button></>}
                          <button className="btn-warn" onClick={() => { setWarnModal({ supplierId: s._id, name: `${s.firstName} ${s.lastName}` }); setWarnMsg(""); }}>⚠️ Warn</button>
                          <button className="btn-remove" onClick={() => removeUser(s._id, `${s.firstName} ${s.lastName}`)}>🗑 Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )

        /* ── MESSAGES ── */
        ) : tab==="messages" ? (
          messages.length===0 ? <div className="admin-state">No messages yet.</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Message</th><th>Received</th></tr></thead>
                <tbody>
                  {messages.map((m,i)=>(
                    <tr key={m._id}>
                      <td>{i+1}</td><td>{m.name}</td>
                      <td><span className={`status-badge status-${m.role==="customer"?"approved":m.role==="supplier"?"pending":"rejected"}`} style={{textTransform:"capitalize"}}>
                        {m.role==="customer"?"👤 Customer":m.role==="supplier"?"🏭 Supplier":"🌐 Guest"}
                      </span></td>
                      <td>{m.email}</td>
                      <td style={{maxWidth:"400px",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.message}</td>
                      <td style={{whiteSpace:"nowrap"}}>{new Date(m.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )

        /* ── ORDERS ── */
        ) : tab==="orders" ? (
          adminOrders.length===0 ? <div className="admin-state">No orders yet.</div> : (
            <div className="admin-table-wrap">
              {/* ORDER SUMMARY STATS */}
              <div className="adm-order-stats">
                <div className="adm-ostat adm-ostat-total">
                  <span className="adm-ostat-num">{adminOrders.length}</span>
                  <span className="adm-ostat-label">Total Orders</span>
                </div>
                <div className="adm-ostat adm-ostat-confirmed">
                  <span className="adm-ostat-num">{adminOrders.filter(o=>o.orderStatus==="Confirmed").length}</span>
                  <span className="adm-ostat-label">Confirmed</span>
                </div>
                <div className="adm-ostat adm-ostat-processing">
                  <span className="adm-ostat-num">{adminOrders.filter(o=>o.orderStatus==="Processing").length}</span>
                  <span className="adm-ostat-label">Processing</span>
                </div>
                <div className="adm-ostat adm-ostat-delivered">
                  <span className="adm-ostat-num">{adminOrders.filter(o=>o.orderStatus==="Delivered").length}</span>
                  <span className="adm-ostat-label">Delivered</span>
                </div>
                <div className="adm-ostat adm-ostat-card">
                  <span className="adm-ostat-num">{adminOrders.filter(o=>o.paymentMethod==="Card").length}</span>
                  <span className="adm-ostat-label">Card Payments</span>
                </div>
                <div className="adm-ostat adm-ostat-cod">
                  <span className="adm-ostat-num">{adminOrders.filter(o=>o.paymentMethod==="Cash on Delivery").length}</span>
                  <span className="adm-ostat-label">COD Payments</span>
                </div>
              </div>
              <div className="adm-filter-bar">
                <input className="adm-search" placeholder="🔍 Search by customer, supplier, list or receipt..." value={ordSearch} onChange={e => setOrdSearch(e.target.value)}/>
                <select className="adm-filter-select" value={ordStatus} onChange={e => setOrdStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <select className="adm-filter-select" value={ordPayment} onChange={e => setOrdPayment(e.target.value)}>
                  <option value="All">All Payments</option>
                  <option value="Card">Card</option>
                  <option value="Cash on Delivery">COD</option>
                </select>
                <input className="adm-filter-select" type="date" value={ordDate} onChange={e => setOrdDate(e.target.value)} title="Filter by date"/>
              </div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Receipt</th><th>Customer</th><th>Supplier</th><th>List</th><th>Items</th><th>Amount</th><th>Payment</th><th>Payment Status</th><th>Order Status</th><th>Date</th></tr></thead>
                <tbody>
                  {adminOrders
                    .filter(o => {
                      const matchStatus  = ordStatus  === "All" || o.orderStatus   === ordStatus;
                      const matchPayment = ordPayment === "All" || o.paymentMethod === ordPayment;
                      const q = ordSearch.toLowerCase();
                      const matchSearch  = !q ||
                        `${o.customerId?.firstName} ${o.customerId?.lastName}`.toLowerCase().includes(q) ||
                        (o.supplierId?.companyName || `${o.supplierId?.firstName} ${o.supplierId?.lastName}`).toLowerCase().includes(q) ||
                        o.listName?.toLowerCase().includes(q) ||
                        o.receiptNo?.toLowerCase().includes(q);
                      const d = o.createdAt ? o.createdAt.slice(0, 10) : "";
                      const matchDate = !ordDate || d === ordDate;
                      return matchStatus && matchPayment && matchSearch && matchDate;
                    })
                    .map((o,i)=>(
                    <tr key={o._id}>
                      <td>{i+1}</td>
                      <td style={{fontFamily:"monospace",fontSize:"0.78rem",color:"#6b7280"}}>#{o.receiptNo}</td>
                      <td><div style={{fontWeight:600}}>{o.customerId?.firstName} {o.customerId?.lastName}</div><div style={{fontSize:"0.75rem",color:"#6b7280"}}>{o.customerId?.phone}</div><div style={{fontSize:"0.75rem",color:"#6b7280"}}>{o.customerId?.address}</div></td>
                      <td><div style={{fontWeight:600}}>{o.supplierId?.companyName||`${o.supplierId?.firstName} ${o.supplierId?.lastName}`}</div><div style={{fontSize:"0.75rem",color:"#6b7280"}}>{o.supplierId?.phone}</div></td>
                      <td>{o.listName||"—"}</td>
                      <td style={{fontSize:"0.78rem"}}>{o.items.map((item,j)=><div key={j}>{item.name} × {item.supplyQty} {item.unit}</div>)}</td>
                      <td style={{fontWeight:700,color:"#15803d"}}>Rs {o.totalAmount.toLocaleString()}</td>
                      <td><span className="status-badge status-approved">{o.paymentMethod}</span></td>
                      <td><span className={`status-badge ${
                        o.paymentStatus === "COD Confirmed" ? "status-approved" :
                        o.paymentStatus === "Paid"          ? "status-approved" :
                        "status-pending"
                      }`}>{o.paymentStatus}</span></td>
                      <td><span className={`status-badge status-${o.orderStatus==="Delivered"?"approved":o.orderStatus==="Cancelled"?"rejected":"pending"}`}>{o.orderStatus}</span></td>
                      <td style={{whiteSpace:"nowrap",fontSize:"0.78rem"}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : <AdminReport />
      )}

      {/* WARNING MODAL */}
      {warnModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, padding:"2rem", width:"100%", maxWidth:460, boxShadow:"0 20px 50px rgba(0,0,0,0.2)" }}>
            <h3 style={{ color:"#d97706", marginBottom:"0.5rem", display:"flex", alignItems:"center", gap:8, margin:"0 0 0.5rem" }}>⚠️ Send Warning</h3>
            <p style={{ color:"#6b7280", fontSize:"0.85rem", marginBottom:"1rem" }}>To: <strong>{warnModal.name}</strong></p>
            <textarea
              rows={4}
              placeholder="Enter warning message for this supplier..."
              value={warnMsg}
              onChange={e => setWarnMsg(e.target.value)}
              style={{ width:"100%", padding:"0.7rem", border:"1.5px solid #fde68a", borderRadius:10, fontSize:"0.9rem", outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit", background:"#fffbeb" }}
            />
            <div style={{ display:"flex", gap:"0.6rem", justifyContent:"flex-end", marginTop:"1rem" }}>
              <button onClick={() => { setWarnModal(null); setWarnMsg(""); }} style={{ background:"#f3f4f6", border:"none", padding:"0.6rem 1.2rem", borderRadius:8, cursor:"pointer", fontSize:"0.9rem" }}>Cancel</button>
              <button onClick={sendWarning} disabled={warnLoading || !warnMsg.trim()}
                style={{ background: warnMsg.trim() ? "linear-gradient(135deg,#d97706,#f59e0b)" : "#e5e7eb", color: warnMsg.trim() ? "white" : "#9ca3af", border:"none", padding:"0.6rem 1.4rem", borderRadius:8, cursor: warnMsg.trim() ? "pointer" : "not-allowed", fontWeight:700, fontSize:"0.9rem" }}>
                {warnLoading ? "Sending..." : "⚠️ Send Warning"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
