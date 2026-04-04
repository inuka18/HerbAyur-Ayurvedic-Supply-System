import { useState, useEffect } from "react";
import "./SupplierOffers.css";
import "../SupplierMarketplace/SupplierMarketplace.css";
import { Eye, User, MapPin, Star, List, Phone, Package, Filter, Calendar, CreditCard, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE from "../../api";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-input">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={28}
          className={`star-icon ${s <= (hovered || value) ? "star-filled" : "star-empty"}`}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}/>
      ))}
    </div>
  );
}

function DisplayStars({ avg, count }) {
  const filled = Math.round(avg || 0);
  return (
    <div className="display-stars">
      {[1,2,3,4,5].map(s => <Star key={s} size={16} className={s <= filled ? "star-filled" : "star-empty"}/>)}
      <span className="star-label">{avg ? `${avg} (${count})` : "No ratings yet"}</span>
    </div>
  );
}

export default function SupplierOffers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests]               = useState([]);
  const [offersByRequest, setOffersByRequest] = useState({});
  const [ordersByOffer, setOrdersByOffer]     = useState({});
  const [allOrders, setAllOrders]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [profile, setProfile]                 = useState(null);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [expanded, setExpanded]               = useState({});
  const [visibleLists, setVisibleLists]       = useState({});
  const [reqSubTab, setReqSubTab]             = useState("active");
  const [soSearch, setSoSearch]               = useState("");
  const [soDate, setSoDate]                   = useState("");
  const [soStatus, setSoStatus]               = useState("All");

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const [allRequests, myOrders] = await Promise.all([
        fetch(`${API_BASE}/requests`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      const myRequests = (Array.isArray(allRequests) ? allRequests : []).filter(r => String(r.customerId) === String(user.id));
      setRequests(myRequests);

      const ordersArr = Array.isArray(myOrders) ? myOrders : [];
      setAllOrders(ordersArr);
      const ordMap = {};
      ordersArr.forEach(o => { ordMap[o.offerId] = o; });
      setOrdersByOffer(ordMap);

      const offersMap = {};
      await Promise.all(myRequests.map(async (req) => {
        const offers = await fetch(`${API_BASE}/offers/request/${req._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        offersMap[req._id] = Array.isArray(offers) ? offers : [];
      }));
      setOffersByRequest(offersMap);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [location.key]);

  const openProfile = async (supplier) => {
    setProfile(supplier); setProfileFeedback(null);
    try { const d = await fetch(`${API_BASE}/feedback/supplier/${supplier._id}`).then(r => r.json()); setProfileFeedback(d); } catch {}
  };

  const [cancellingId, setCancellingId] = useState(null);

  const cancelRequest = async (reqId) => {
    if (!window.confirm("Cancel this request? This cannot be undone.")) return;
    setCancellingId(reqId);
    try {
      const res  = await fetch(`${API_BASE}/requests/${reqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchData();
    } catch { alert("Something went wrong."); }
    finally { setCancellingId(null); }
  };

  const calcTotal = (items) => items.reduce((s, i) => s + i.price * i.supplyQty, 0);

  const activeRequests    = requests.filter(r => !r.fullyCompleted);
  const completedRequests = requests.filter(r => r.fullyCompleted);

  const applyFilters = (list) => list.filter(req => {
    const q = soSearch.toLowerCase();
    const matchSearch = !q || (req.listName || req.customer?.name || "").toLowerCase().includes(q) || req.customer?.location?.toLowerCase().includes(q);
    const reqDate = req.requiredDate ? req.requiredDate.slice(0, 10) : "";
    const matchDate = !soDate || reqDate === soDate;
    const covered = (req.coveredItems || []).length;
    const matchStatus =
      soStatus === "All"       ? true :
      soStatus === "Completed" ? req.fullyCompleted :
      soStatus === "Partial"   ? covered > 0 && !req.fullyCompleted :
      soStatus === "No Orders" ? covered === 0 : true;
    return matchSearch && matchDate && matchStatus;
  });

  const renderOfferCard = (bid, req) => {
    const showAll  = expanded[bid._id];
    const items    = showAll ? bid.items : bid.items.slice(0, 5);
    const supplier = bid.supplierId;
    const order    = ordersByOffer[bid._id];
    const isRejected = bid.status === "Rejected";

    // Disable Accept & Pay if items are already covered by another paid offer
    const coveredNames = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const hasWholeAccepted = (offersByRequest[req._id] || []).some(
      o => o._id !== bid._id && o.supplyType === "Whole" && o.status === "Accepted"
    );
    const bidItemNames = bid.items.map(i => i.name.toLowerCase().trim());
    const allItemsCovered = bidItemNames.every(n => coveredNames.includes(n));
    const isDisabled = isRejected || hasWholeAccepted || allItemsCovered;

    return (
      <div key={bid._id} className={`supplier-card ${bid.status}`}>
        <div className="supplier-header">
          <h3>{supplier?.companyName || `${supplier?.firstName} ${supplier?.lastName}`}</h3>
          <span className={`badge ${bid.supplyType.toLowerCase()}`}>
            <Package size={14}/> {bid.supplyType}
          </span>
        </div>

        {isRejected && (
          <div className="offer-rejected-banner">
            <div className="rej-title">✕ Rejected</div>
            <p>
              {(() => {
                const covered = (req.coveredItems || []).map(n => n.toLowerCase().trim());
                const overlapping = bid.items
                  .filter(i => covered.includes(i.name.toLowerCase().trim()))
                  .map(i => i.name);
                if (bid.supplyType === "Whole") {
                  return "Another supplier was accepted for the whole list.";
                } else if (overlapping.length > 0) {
                  return `Another supplier was accepted for: ${overlapping.join(", ")}.`;
                }
                return "This offer was rejected by the customer.";
              })()}
            </p>
          </div>
        )}

        <div className="items-container">
          {items.map((item, i) => (
            <div key={i} className="item-row">
              <span>{item.name}</span>
              <span>{item.supplyQty} {item.unit}</span>
              <span>Rs {item.price}</span>
              <span className="total">Rs {item.price * item.supplyQty}</span>
            </div>
          ))}
        </div>

        {bid.items.length > 5 && !showAll && !isRejected && (
          <button className="view-all" onClick={() => setExpanded({ ...expanded, [bid._id]: true })}>View All</button>
        )}

        <div className="total-price">Total: Rs {calcTotal(bid.items)}</div>

        {order && (
          <div className="order-placed-badge">
            <ShoppingBag size={14}/> Order #{order.receiptNo}
            <span className="order-status-tag">{order.orderStatus}</span>
          </div>
        )}

        <div className="card-buttons">
          <button className="profile-btn" onClick={() => openProfile(supplier)}>
            <User size={16}/> Supplier
          </button>

          {/* Only show action buttons for non-rejected/non-disabled offers */}
          {!isDisabled && bid.status === "Pending" && !order && (
            <button className="accept-btn" onClick={() => navigate("/payment", { state: { bid, supplier, request: req } })}>
              <CreditCard size={16}/> Accept & Pay
            </button>
          )}

          {!isRejected && bid.status === "Accepted" && (
            <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
              <span className="accepted">Accepted</span>
              {!order && (
                <button className="accept-btn" style={{ fontSize:"0.78rem", padding:"5px 10px" }}
                  onClick={() => navigate("/payment", { state: { bid, supplier, request: req } })}>
                  <CreditCard size={13}/> Pay Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // For completed requests — only show accepted offers that have orders
  const renderCompletedRequestSection = (req) => {
    const allBids      = (offersByRequest[req._id] || []);
    const acceptedBids = allBids.filter(b => b.status === "Accepted");
    const coveredNames = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const total   = req.materials.length;
    const ordered = coveredNames.length;

    return (
      <div key={req._id} className="list-section modern-list">
        <div className="list-header">
          <div>
            <h2 style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
              <List size={18}/> {req.listName || `${req.customer.name}'s Request`}
              <span className="count">{req.materials.length} items</span>
              <span className="completed-tag"><CheckCircle2 size={13}/> Fully Completed</span>
            </h2>
            <div style={{ display:"flex", gap:"0.5rem", fontSize:"0.82rem", color:"#6b7280", marginTop:"4px" }}>
              <span>📅 {new Date(req.requiredDate).toLocaleDateString()}</span>
              <span>📍 {req.customer.location}</span>
            </div>
          </div>
          <button className="view-btn" onClick={() => setVisibleLists(p => ({ ...p, [req._id]: !p[req._id] }))}>
            <Eye size={16}/> View List
          </button>
        </div>

        {/* PROGRESS BAR — always 100% */}
        <div className="so-progress-wrap">
          <div className="so-progress-bar">
            <div className="so-progress-fill" style={{ width: "100%", background: "#22c55e" }}/>
          </div>
          <span className="so-progress-label">{ordered}/{total} items ordered (100%)</span>
        </div>

        {visibleLists[req._id] && (
          <table className="items-table">
            <thead><tr><th>Item</th><th>Category</th><th>Condition</th><th>Part</th><th>Qty</th><th>Status</th></tr></thead>
            <tbody>
              {req.materials.map((m, i) => (
                <tr key={i}>
                  <td>{m.name}</td>
                  <td>{m.category ? <span className="cat-badge-sm">{m.category}</span> : "—"}</td>
                  <td><span className="cond-badge-sm">{m.condition}</span></td>
                  <td>{m.part}</td>
                  <td>{m.quantity} {m.unit}</td>
                  <td><span style={{ color:"#166534", fontWeight:600, fontSize:"0.78rem" }}>✅ Ordered</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Accepted suppliers only */}
        {acceptedBids.length === 0
          ? <p style={{ color:"#9ca3af", fontSize:"0.9rem", padding:"0.5rem 0" }}>No accepted offers found.</p>
          : (
            <div className="suppliers-grid">
              {acceptedBids.map(bid => {
                const supplier = bid.supplierId;
                const order    = ordersByOffer[bid._id];
                const hasFeedback = givenFeedbacks[bid._id];
                return (
                  <div key={bid._id} className="supplier-card Accepted">
                    <div className="supplier-header">
                      <h3>{supplier?.companyName || `${supplier?.firstName} ${supplier?.lastName}`}</h3>
                      <span className={`badge ${bid.supplyType.toLowerCase()}`}>
                        <Package size={14}/> {bid.supplyType}
                      </span>
                    </div>

                    <div className="items-container">
                      {bid.items.map((item, i) => (
                        <div key={i} className="item-row">
                          <span>{item.name}</span>
                          <span>{item.supplyQty} {item.unit}</span>
                          <span>Rs {item.price}</span>
                          <span className="total">Rs {item.price * item.supplyQty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="total-price">Total: Rs {calcTotal(bid.items)}</div>

                    {order && (
                      <div className="order-placed-badge">
                        <ShoppingBag size={14}/> Order #{order.receiptNo}
                        <span className="order-status-tag">{order.orderStatus}</span>
                        {order.paymentMethod && (
                          <span className="order-status-tag" style={{ background:"#f0fdf4", color:"#166534" }}>
                            {order.paymentMethod === "Cash on Delivery" ? "COD" : order.paymentMethod}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="card-buttons">
                      <button className="profile-btn" onClick={() => openProfile(supplier)}>
                        <User size={16}/> Supplier
                      </button>
                      <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
                        <span className="accepted">✅ Accepted</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    );
  };

  const renderRequestSection = (req) => {
    const allBids      = (offersByRequest[req._id] || []);
    const activeBids   = allBids.filter(b => b.status !== "Rejected");
    const coveredNames   = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const uncoveredItems = req.materials.filter(m => !coveredNames.includes(m.name.toLowerCase().trim()));
    const offeredItemNames = activeBids.flatMap(b => b.items.map(i => i.name.toLowerCase().trim()));
    const noSupplierItems = uncoveredItems.filter(m => !offeredItemNames.includes(m.name.toLowerCase().trim()));
    const total   = req.materials.length;
    const ordered = coveredNames.length;
    const pct     = total ? Math.round((ordered / total) * 100) : 0;
    const canCancel = (req.coveredItems || []).length === 0;

    return (
      <div key={req._id} className="list-section modern-list">
        <div className="list-header">
          <div>
            <h2 style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
              <List size={18}/> {req.listName || `${req.customer.name}'s Request`}
              <span className="count">{req.materials.length} items</span>
              {req.fullyCompleted && <span className="completed-tag"><CheckCircle2 size={13}/> Fully Completed</span>}
            </h2>
            <div style={{ display:"flex", gap:"0.5rem", fontSize:"0.82rem", color:"#6b7280", marginTop:"4px" }}>
              <span>📅 {new Date(req.requiredDate).toLocaleDateString()}</span>
              <span>📍 {req.customer.location}</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
            <button className="view-btn" onClick={() => setVisibleLists(p => ({ ...p, [req._id]: !p[req._id] }))}>
              <Eye size={16}/> View List
            </button>
            {canCancel && (
              <button
                className="cancel-request-btn"
                onClick={() => cancelRequest(req._id)}
                disabled={cancellingId === req._id}>
                {cancellingId === req._id ? "Cancelling..." : "✕ Cancel"}
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="so-progress-wrap">
          <div className="so-progress-bar">
            <div className="so-progress-fill" style={{ width: `${pct}%`, background: req.fullyCompleted ? "#22c55e" : "#2e7d32" }}/>
          </div>
          <span className="so-progress-label">{ordered}/{total} items ordered ({pct}%)</span>
        </div>

        {!req.fullyCompleted && noSupplierItems.length > 0 && (
          <div className="uncovered-banner">
            <AlertCircle size={16}/>
            <div>
              <strong>No supplier has offered {noSupplierItems.length} item{noSupplierItems.length > 1 ? "s" : ""} yet:</strong>
              <div className="banner-chips">
                {noSupplierItems.map((m, i) => (
                  <span key={i} className="banner-chip banner-chip-warn">{m.name} — {m.quantity} {m.unit}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!req.fullyCompleted && coveredNames.length > 0 && (
          <div className="covered-banner">
            <CheckCircle2 size={16}/>
            <div>
              <strong>{coveredNames.length} item{coveredNames.length > 1 ? "s" : ""} already ordered:</strong>
              <div className="banner-chips">
                {req.materials.filter(m => coveredNames.includes(m.name.toLowerCase().trim())).map((m, i) => (
                  <span key={i} className="banner-chip banner-chip-ok">{m.name} — {m.quantity} {m.unit}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT REMAINING ITEMS */}
        {!req.fullyCompleted && uncoveredItems.length > 0 && coveredNames.length > 0 && (
          <div className="remaining-submit-banner">
            <div>
              <strong>📋 {uncoveredItems.length} item{uncoveredItems.length > 1 ? "s" : ""} still not ordered — need more suppliers?</strong>
              <p style={{ fontSize:"0.8rem", color:"#92400e", marginTop:4 }}>Post the remaining items as a new request to get more supplier offers.</p>
            </div>
            <button
              className="remaining-submit-btn"
              onClick={() => navigate("/RequestForm", {
                state: {
                  prefill: {
                    listName: `${req.listName || req.customer.name} (Remaining)`,
                    materials: uncoveredItems,
                  }
                }
              })}>
              📤 Post Remaining Items
            </button>
          </div>
        )}

        {visibleLists[req._id] && (
          <table className="items-table">
            <thead><tr><th>Item</th><th>Category</th><th>Condition</th><th>Part</th><th>Qty</th><th>Status</th></tr></thead>
            <tbody>
              {req.materials.map((m, i) => {
                const covered = coveredNames.includes(m.name.toLowerCase().trim());
                return (
                  <tr key={i}>
                    <td>{m.name}</td>
                    <td>{m.category ? <span className="cat-badge-sm">{m.category}</span> : "—"}</td>
                    <td><span className="cond-badge-sm">{m.condition}</span></td>
                    <td>{m.part}</td>
                    <td>{m.quantity} {m.unit}</td>
                    <td>
                      {covered
                        ? <span style={{ color:"#166534", fontWeight:600, fontSize:"0.78rem" }}>✅ Ordered</span>
                        : offeredItemNames.includes(m.name.toLowerCase().trim())
                          ? <span style={{ color:"#d97706", fontWeight:600, fontSize:"0.78rem" }}>⏳ Offer Received</span>
                          : <span style={{ color:"#dc2626", fontWeight:600, fontSize:"0.78rem" }}>❌ No Offer Yet</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {allBids.length === 0
          ? <p style={{ color:"#9ca3af", fontSize:"0.9rem", padding:"0.5rem 0" }}>No offers yet for this request.</p>
          : <div className="suppliers-grid">{allBids.map(bid => renderOfferCard(bid, req))}</div>
        }
      </div>
    );
  };

  if (loading) return <div className="offers-page"><p style={{ padding:"2rem" }}>Loading offers...</p></div>;

  const filteredActive    = applyFilters(activeRequests);
  const filteredCompleted = applyFilters(completedRequests);

  return (
    <div className="offers-page">
      <h1 className="title">Supplier Offers</h1>

      {/* STATS BAR */}
      <div className="sm-stats-bar">
        <div className="sm-stat">
          <span className="sm-stat-num">{requests.length}</span>
          <span className="sm-stat-label">Total Requests</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num">{activeRequests.length}</span>
          <span className="sm-stat-label">Active</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num">{completedRequests.length}</span>
          <span className="sm-stat-label">Completed</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num">{allOrders.length}</span>
          <span className="sm-stat-label">Orders Placed</span>
        </div>
      </div>

      {/* FILTER BAR — same style as SupplierMarketplace */}
      <div className="sm-controls">
        <div className="sm-filter-box">
          <Filter size={16}/>
          <input placeholder="Search list or location..." value={soSearch} onChange={e => setSoSearch(e.target.value)} style={{ minWidth:160 }}/>
        </div>
        <div className="sm-filter-box">
          <Calendar size={15}/>
          <input type="date" value={soDate} onChange={e => setSoDate(e.target.value)} title="Filter by required date"/>
        </div>
        <div className="sm-sort-box">
          <select value={soStatus} onChange={e => setSoStatus(e.target.value)}>
            <option value="All">All Requests</option>
            <option value="No Orders">No Orders Yet</option>
            <option value="Partial">Partially Ordered</option>
          </select>
        </div>
      </div>

      {/* TABS */}
      <div className="so-tabs">
        <button className={reqSubTab === "active" ? "so-tab active" : "so-tab"} onClick={() => setReqSubTab("active")}>
          🔄 Active Requests <span className="so-tab-count">{filteredActive.length}</span>
        </button>
        <button className={reqSubTab === "completed" ? "so-tab active" : "so-tab"} onClick={() => setReqSubTab("completed")}>
          ✅ Fully Completed Lists <span className="so-tab-count">{filteredCompleted.length}</span>
        </button>
      </div>

      {reqSubTab === "active" && (
        filteredActive.length === 0
          ? <div style={{ padding:"2rem", color:"#166534", textAlign:"center", fontSize:"1.1rem" }}>🎉 No active requests match your filters.</div>
          : filteredActive.map(req => renderRequestSection(req))
      )}

      {reqSubTab === "completed" && (
        filteredCompleted.length === 0
          ? <div style={{ padding:"2rem", color:"#555", textAlign:"center" }}>No fully completed lists yet.</div>
          : filteredCompleted.map(req => renderRequestSection(req))
      )}

      {/* SUPPLIER PROFILE MODAL */}
      {profile && (
        <div className="modal">
          <div className="profile-card">
            <h3>Supplier Details</h3>
            <p><User size={16}/> {profile.firstName} {profile.lastName}</p>
            {profile.companyName && <p><Package size={16}/> {profile.companyName}</p>}
            <p><MapPin size={16}/> {profile.address}</p>
            <p><Phone size={16}/> {profile.phone}</p>
            <div className="profile-rating-section">
              <h4>Customer Ratings</h4>
              {profileFeedback === null
                ? <p style={{ color:"#9ca3af", fontSize:"0.85rem" }}>Loading...</p>
                : <>
                    <DisplayStars avg={profileFeedback.avg} count={profileFeedback.count}/>
                    {profileFeedback.feedbacks?.length > 0 && (
                      <div className="feedback-list">
                        {profileFeedback.feedbacks.slice(0,3).map((f,i) => (
                          <div key={i} className="feedback-item">
                            <div className="feedback-item-stars">
                              {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s<=f.rating?"star-filled":"star-empty"}/>)}
                            </div>
                            {f.comment && <p className="feedback-comment">"{f.comment}"</p>}
                            <span className="feedback-author">— {f.customerId?.firstName} {f.customerId?.lastName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
              }
            </div>
            <button className="close-btn" onClick={() => { setProfile(null); setProfileFeedback(null); }}>Close</button>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL removed — reviews handled in My Orders */}
    </div>
  );
}
