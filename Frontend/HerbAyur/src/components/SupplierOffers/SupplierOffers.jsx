import { useState, useEffect } from "react";
import "./SupplierOffers.css";
import { Eye, User, MapPin, Star, List, Phone, Package, Filter, MessageSquare, CreditCard, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [requests, setRequests]               = useState([]);
  const [offersByRequest, setOffersByRequest] = useState({});
  const [ordersByOffer, setOrdersByOffer]     = useState({});
  const [allOrders, setAllOrders]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [profile, setProfile]                 = useState(null);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [expanded, setExpanded]               = useState({});
  const [filterType, setFilterType]           = useState({});
  const [visibleLists, setVisibleLists]       = useState({});
  const [activeTab, setActiveTab]             = useState("active");
  const [reqSubTab, setReqSubTab]             = useState("active");
  const [feedbackModal, setFeedbackModal]     = useState(null);
  const [fbRating, setFbRating]               = useState(0);
  const [fbComment, setFbComment]             = useState("");
  const [fbError, setFbError]                 = useState("");
  const [fbSuccess, setFbSuccess]             = useState("");
  const [fbLoading, setFbLoading]             = useState(false);
  const [givenFeedbacks, setGivenFeedbacks]   = useState({});

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const [allRequests, myOrders] = await Promise.all([
        fetch(`${API_BASE}/requests`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      const myRequests = (Array.isArray(allRequests) ? allRequests : []).filter(r => r.customerId === user.id);
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

      const allOffers = Object.values(offersMap).flat();
      const fbMap = {};
      await Promise.all(
        allOffers.filter(o => o.status === "Accepted").map(async (o) => {
          const d = await fetch(`${API_BASE}/feedback/check/${o._id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
          fbMap[o._id] = d.given;
        })
      );
      setGivenFeedbacks(fbMap);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openProfile = async (supplier) => {
    setProfile(supplier); setProfileFeedback(null);
    try { const d = await fetch(`${API_BASE}/feedback/supplier/${supplier._id}`).then(r => r.json()); setProfileFeedback(d); } catch {}
  };

  const openFeedback = (offerId, supplierId, supplierName) => {
    setFeedbackModal({ offerId, supplierId, supplierName });
    setFbRating(0); setFbComment(""); setFbError(""); setFbSuccess("");
  };

  const submitFeedback = async () => {
    if (!fbRating) return setFbError("Please select a star rating.");
    setFbLoading(true); setFbError("");
    try {
      const res  = await fetch(`${API_BASE}/feedback`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supplierId: feedbackModal.supplierId, offerId: feedbackModal.offerId, rating: fbRating, comment: fbComment }),
      });
      const data = await res.json();
      if (!res.ok) return setFbError(data.message);
      setFbSuccess("Feedback submitted!");
      setTimeout(() => { setFeedbackModal(null); fetchData(); }, 1500);
    } catch { setFbError("Something went wrong."); }
    finally { setFbLoading(false); }
  };

  const calcTotal = (items) => items.reduce((s, i) => s + i.price * i.supplyQty, 0);

  const activeRequests    = requests.filter(r => !r.fullyCompleted);
  const completedRequests = requests.filter(r => r.fullyCompleted);

  const renderOfferCard = (bid, req) => {
    const showAll  = expanded[bid._id];
    const items    = showAll ? bid.items : bid.items.slice(0, 5);
    const supplier = bid.supplierId;
    const order    = ordersByOffer[bid._id];

    return (
      <div key={bid._id} className={`supplier-card ${bid.status}`}>
        <div className="supplier-header">
          <h3>{supplier?.companyName || `${supplier?.firstName} ${supplier?.lastName}`}</h3>
          <span className={`badge ${bid.supplyType.toLowerCase()}`}>
            <Package size={14}/> {bid.supplyType}
          </span>
        </div>

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

        {bid.items.length > 5 && !showAll && (
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

          {bid.status === "Pending" && !order && (
            <button className="accept-btn" onClick={() => navigate("/payment", { state: { bid, supplier, request: req } })}>
              <CreditCard size={16}/> Accept & Pay
            </button>
          )}

          {bid.status === "Accepted" && (
            <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
              <span className="accepted">Accepted</span>
              {!order && (
                <button className="accept-btn" style={{ fontSize:"0.78rem", padding:"5px 10px" }}
                  onClick={() => navigate("/payment", { state: { bid, supplier, request: req } })}>
                  <CreditCard size={13}/> Pay Now
                </button>
              )}
              {order && (givenFeedbacks[bid._id]
                ? <span className="fb-given">✅ Reviewed</span>
                : <button className="feedback-btn" onClick={() => openFeedback(bid._id, supplier?._id, supplier?.companyName || `${supplier?.firstName} ${supplier?.lastName}`)}>
                    <MessageSquare size={14}/> Review
                  </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRequestSection = (req) => {
    const currentFilter  = filterType[req._id] || "All";
    let bids = (offersByRequest[req._id] || []).filter(b => b.status !== "Rejected");
    if (currentFilter !== "All") bids = bids.filter(b => b.supplyType === currentFilter);

    const coveredNames   = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const uncoveredItems = req.materials.filter(m => !coveredNames.includes(m.name.toLowerCase().trim()));
    const offeredItemNames = (offersByRequest[req._id] || [])
      .filter(b => b.status !== "Rejected")
      .flatMap(b => b.items.map(i => i.name.toLowerCase().trim()));
    const noSupplierItems = uncoveredItems.filter(m => !offeredItemNames.includes(m.name.toLowerCase().trim()));

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
          <button className="view-btn" onClick={() => setVisibleLists(p => ({ ...p, [req._id]: !p[req._id] }))}>
            <Eye size={16}/> View List
          </button>
        </div>

        {/* PROGRESS BAR */}
        {(() => {
          const total   = req.materials.length;
          const ordered = coveredNames.length;
          const pct     = total ? Math.round((ordered / total) * 100) : 0;
          return (
            <div className="so-progress-wrap">
              <div className="so-progress-bar">
                <div className="so-progress-fill" style={{ width: `${pct}%`, background: req.fullyCompleted ? "#22c55e" : "#2e7d32" }}/>
              </div>
              <span className="so-progress-label">{ordered}/{total} items ordered ({pct}%)</span>
            </div>
          );
        })()}

        {!req.fullyCompleted && noSupplierItems.length > 0 && (
          <div className="uncovered-banner">
            <AlertCircle size={16}/>
            <div>
              <strong>No supplier has offered these {noSupplierItems.length} item{noSupplierItems.length > 1 ? "s" : ""} yet:</strong>
              <span style={{ marginLeft:"6px" }}>{noSupplierItems.map(m => m.name).join(", ")}</span>
            </div>
          </div>
        )}

        {!req.fullyCompleted && coveredNames.length > 0 && (
          <div className="covered-banner">
            <CheckCircle2 size={16}/>
            <span>{coveredNames.length} item{coveredNames.length > 1 ? "s" : ""} already ordered: {coveredNames.join(", ")}</span>
          </div>
        )}

        <div className="filter-box">
          <Filter size={16}/>
          <select value={currentFilter} onChange={e => setFilterType(p => ({ ...p, [req._id]: e.target.value }))}>
            <option value="All">All Suppliers</option>
            <option value="Whole">Whole List</option>
            <option value="Partial">Partial Supply</option>
            <option value="Item">Item by Item</option>
          </select>
        </div>

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

        {bids.length === 0
          ? <p style={{ color:"#9ca3af", fontSize:"0.9rem", padding:"0.5rem 0" }}>No offers yet for this request.</p>
          : <div className="suppliers-grid">{bids.map(bid => renderOfferCard(bid, req))}</div>
        }
      </div>
    );
  };

  if (loading) return <div className="offers-page"><p style={{ padding:"2rem" }}>Loading offers...</p></div>;

  return (
    <div className="offers-page">
      <h1 className="title">Supplier Offers</h1>

      <div className="so-tabs">
        <button className={reqSubTab === "active" ? "so-tab active" : "so-tab"} onClick={() => setReqSubTab("active")}>
          🔄 Active Requests <span className="so-tab-count">{activeRequests.length}</span>
        </button>
        <button className={reqSubTab === "completed" ? "so-tab active" : "so-tab"} onClick={() => setReqSubTab("completed")}>
          ✅ Fully Completed Lists <span className="so-tab-count">{completedRequests.length}</span>
        </button>
      </div>

      {reqSubTab === "active" && (
        activeRequests.length === 0
          ? <div style={{ padding:"2rem", color:"#166534", textAlign:"center", fontSize:"1.1rem" }}>🎉 All your request lists are fully completed!</div>
          : activeRequests.map(req => renderRequestSection(req))
      )}

      {reqSubTab === "completed" && (
        completedRequests.length === 0
          ? <div style={{ padding:"2rem", color:"#555", textAlign:"center" }}>No fully completed lists yet.</div>
          : completedRequests.map(req => renderRequestSection(req))
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

      {/* FEEDBACK MODAL */}
      {feedbackModal && (
        <div className="modal">
          <div className="profile-card feedback-modal-card">
            <h3><MessageSquare size={18}/> Rate Supplier</h3>
            <p style={{ color:"#6b7280", fontSize:"0.9rem", marginBottom:"1rem" }}>{feedbackModal.supplierName}</p>
            <StarRating value={fbRating} onChange={setFbRating}/>
            <textarea className="fb-textarea" placeholder="Write a comment (optional)..." value={fbComment} onChange={e => setFbComment(e.target.value)} rows={3}/>
            {fbError   && <div className="fb-error">⚠ {fbError}</div>}
            {fbSuccess && <div className="fb-success">✅ {fbSuccess}</div>}
            <div className="fb-actions">
              <button className="accept-btn" onClick={submitFeedback} disabled={fbLoading}>{fbLoading ? "Submitting..." : "Submit"}</button>
              <button className="close-btn" onClick={() => setFeedbackModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
