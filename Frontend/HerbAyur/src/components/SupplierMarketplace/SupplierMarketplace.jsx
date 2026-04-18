import { useState, useEffect } from "react";
import "./SupplierMarketplace.css";
import { MapPin, Package, Calendar, Eye, X, Filter, AlertTriangle, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../api";

function SupplierMarketplace() {
  const navigate = useNavigate();
  const getRequestId = (value) => String(value?._id || value || "");

  const [requests, setRequests]           = useState([]);
  const [myOfferRequestIds, setMyOfferRequestIds] = useState(new Set());
  const [myOffers, setMyOffers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDate, setSelectedDate]   = useState("");
  const [sortType, setSortType]           = useState("latest"); // "latest" | "urgent"
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [view, setView]                   = useState("new"); // "new" | "confirmed"
  const [confirmedFilter, setConfirmedFilter] = useState("All"); // "All" | "Pending" | "Accepted" | "Rejected"

  const token = localStorage.getItem("token");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/requests`).then(r => r.json()),
      fetch(`${API_BASE}/offers/my-offers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([reqs, myOffersData]) => {
      setRequests(Array.isArray(reqs) ? reqs : []);
      const offList = Array.isArray(myOffersData) ? myOffersData : [];
      setMyOffers(offList);
      const ids = new Set(offList.map(o => getRequestId(o.requestId)).filter(Boolean));
      setMyOfferRequestIds(ids);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const applyFiltersSort = (list) => {
    let filtered = selectedDate
      ? list.filter(r => new Date(r.requiredDate).toISOString().slice(0, 10) === selectedDate)
      : list;
    if (sortType === "urgent") {
      filtered = filtered.filter(r => (new Date(r.requiredDate) - new Date()) <= 24 * 60 * 60 * 1000);
      return [...filtered].sort((a, b) => new Date(a.requiredDate) - new Date(b.requiredDate));
    }
    return [...filtered].sort((a, b) => new Date(b.createdAt || b.requiredDate) - new Date(a.createdAt || a.requiredDate));
  };

  const getOffersForRequest = (requestId) =>
    myOffers.filter(o => getRequestId(o.requestId) === getRequestId(requestId));

  const pickLatestOffer = (offers) =>
    [...offers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

  const getOfferForDisplay = (requestId, statusFilter = "All") => {
    const offers = getOffersForRequest(requestId);
    if (offers.length === 0) return null;
    if (statusFilter === "All") return pickLatestOffer(offers);
    const matched = offers.filter(o => o.status === statusFilter);
    if (matched.length === 0) return null;
    return pickLatestOffer(matched);
  };

  const activeRequests = requests.filter(r => !r.fullyCompleted);
  const newRequests = applyFiltersSort(activeRequests.filter(r => !myOfferRequestIds.has(getRequestId(r._id))));

  const confirmedRequests = applyFiltersSort(
    requests.filter(r => {
      const offers = getOffersForRequest(r._id);
      if (offers.length === 0) return false;
      if (confirmedFilter === "All") return true;
      return offers.some(o => o.status === confirmedFilter);
    })
  );

  const isUrgent = (date) => (new Date(date) - new Date()) <= 24 * 60 * 60 * 1000;

  const renderConfirmedCard = (req) => {
    const myOffer = getOfferForDisplay(req._id, confirmedFilter);
    const offeredItemNames = myOffer
      ? new Set(myOffer.items.map(i => i.name.toLowerCase().trim()))
      : new Set();
    const coveredNames = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const isUrgentReq  = isUrgent(req.requiredDate);

    return (
      <div className="sm-card" key={req._id}>
        <div className="sm-card-top">
          <h3>{req.listName || req.customer.name}</h3>
          <div className="sm-top-right">
            {isUrgentReq && <AlertTriangle size={16} color="#f67105"/>}
            <span className={`sm-confirmed-tag sm-offer-status-${(myOffer?.status || "pending").toLowerCase()}`}>
              <CheckCircle size={12}/> {myOffer?.status || "Offered"}
            </span>
          </div>
        </div>
        <div className="sm-card-details">
          <div className="sm-meta"><User size={14}/> {req.customer.name}</div>
          <div className="sm-meta"><MapPin size={14}/> {req.customer.location}</div>
          <div className="sm-meta"><Calendar size={14}/> {new Date(req.requiredDate).toLocaleDateString()}</div>
        </div>
        {/* FULL LIST WITH HIGHLIGHTS */}
        <div className="sm-offer-list">
          <div className="sm-offer-list-title">📋 Full Request List</div>
          {req.materials.map((m, i) => {
            const key      = m.name.toLowerCase().trim();
            const iMine    = offeredItemNames.has(key);
            const iOrdered = coveredNames.includes(key);
            return (
              <div key={i} className={`sm-offer-item ${iMine ? "sm-item-mine" : ""} ${iOrdered ? "sm-item-ordered" : ""}`}>
                <span className="sm-item-name">{m.name}</span>
                <span className="sm-item-qty">{m.quantity} {m.unit}</span>
                <span className="sm-item-status">
                  {iOrdered ? "✅ Ordered" : iMine ? "🟢 My Offer" : "⬜ Not Offered"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCard = (req) => {
    // Items not yet covered by paid orders
    const coveredNames   = (req.coveredItems || []).map(n => n.toLowerCase().trim());
    const uncoveredItems = req.materials.filter(m => !coveredNames.includes(m.name.toLowerCase().trim()));
    const isPartial      = coveredNames.length > 0 && uncoveredItems.length > 0;

    return (
    <div className="sm-card" key={req._id}>
      <div className="sm-card-top">
        <h3>{req.listName || req.customer.name}</h3>
        <div className="sm-top-right">
          {isUrgent(req.requiredDate) && <AlertTriangle size={16} color="#f67105"/>}
          {myOfferRequestIds.has(getRequestId(req._id)) && <span className="sm-confirmed-tag"><CheckCircle size={12}/> Offered</span>}
          {isPartial && <span className="sm-partial-tag">⚡ Partial</span>}
          <span className="sm-badge"><Package size={14}/> {uncoveredItems.length}/{req.materials.length} items</span>
        </div>
      </div>
      <div className="sm-card-details">
        <div className="sm-meta"><User size={14}/> {req.customer.name}</div>
        <div className="sm-meta"><MapPin size={14}/> {req.customer.location}</div>
        <div className="sm-meta"><Calendar size={14}/> {new Date(req.requiredDate).toLocaleDateString()}</div>
        {isPartial && (
          <div className="sm-meta" style={{ color:"#d97706", fontSize:"0.78rem" }}>
            ⏳ Still needed: {uncoveredItems.map(m => m.name).join(", ")}
          </div>
        )}
      </div>
      <div className="sm-card-actions">
        <button className="sm-view-btn" onClick={() => setSelectedRequest(req)}><Eye size={16}/> View</button>
        {!myOfferRequestIds.has(getRequestId(req._id)) && (
          <button className="sm-supply-btn" onClick={() => navigate("/SupplierConfirmation", { state: req })}>Supply Now</button>
        )}
      </div>
    </div>
    );
  };

  if (loading) return <div className="sm-page"><p style={{padding:"2rem"}}>Loading requests...</p></div>;

  // Stats
  const totalRequests  = activeRequests.length;
  const totalOffers    = myOffers.length;
  const pendingOffers  = myOffers.filter(o => o.status === "Pending").length;
  const acceptedOffers = myOffers.filter(o => o.status === "Accepted").length;
  const rejectedOffers = myOffers.filter(o => o.status === "Rejected").length;

  return (
    <div className="sm-page">
      <div className="sm-header">
        <h1 className="sm-title">Supplier Marketplace</h1>
        <div className="sm-controls">
          <div className="sm-filter-box">
            <Filter size={16}/>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/>
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS */}
      <div className="sm-stats-bar">
        <div className="sm-stat">
          <span className="sm-stat-num">{totalRequests}</span>
          <span className="sm-stat-label">Available Requests</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num">{totalOffers}</span>
          <span className="sm-stat-label">My Total Offers</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num sm-stat-pending">{pendingOffers}</span>
          <span className="sm-stat-label">Pending Offers</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num sm-stat-accepted">{acceptedOffers}</span>
          <span className="sm-stat-label">Accepted Offers</span>
        </div>
        <div className="sm-stat-divider"/>
        <div className="sm-stat">
          <span className="sm-stat-num sm-stat-rejected">{rejectedOffers}</span>
          <span className="sm-stat-label">Rejected Offers</span>
        </div>
      </div>

      {/* MAIN VIEW TABS */}
      <div className="sm-view-tabs">
        <button className={view === "new" ? "sm-view-tab active" : "sm-view-tab"} onClick={() => setView("new")}>
          🆕 New Requests <span className="sm-tab-count">{newRequests.length}</span>
        </button>
        <button className={view === "confirmed" ? "sm-view-tab active" : "sm-view-tab"} onClick={() => setView("confirmed")}>
          ✅ My Confirmed Supplies <span className="sm-tab-count">{requests.filter(r => getOffersForRequest(r._id).length > 0).length}</span>
        </button>
      </div>

      {/* SUB-FILTER PILLS — row below the tabs */}
      {view === "new" && (
        <div className="sm-sub-filters">
          <span className="sm-sub-label">Sort:</span>
          {[{ key: "latest", label: "🕒 Latest" }, { key: "urgent", label: "⚡ Urgent" }].map(s => (
            <button key={s.key} className={sortType === s.key ? "sm-sub-pill active" : "sm-sub-pill"} onClick={() => setSortType(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {view === "confirmed" && (
        <div className="sm-sub-filters">
          <span className="sm-sub-label">Status:</span>
          {["All", "Pending", "Accepted", "Rejected"].map(f => {
            const count = f === "All"
              ? requests.filter(r => getOffersForRequest(r._id).length > 0).length
              : requests.filter(r => {
                  const offers = getOffersForRequest(r._id);
                  if (offers.length === 0) return false;
                  return offers.some(o => o.status === f);
                }).length;
            const colors = { All: "sm-sub-pill", Pending: "sm-sub-pill amber", Accepted: "sm-sub-pill green", Rejected: "sm-sub-pill red" };
            return (
              <button key={f} className={confirmedFilter === f ? `${colors[f]} active` : colors[f]} onClick={() => setConfirmedFilter(f)}>
                {f === "All" ? "All" : f === "Pending" ? "⏳ Pending" : f === "Accepted" ? "✅ Accepted" : "✕ Rejected"}
                <span className="sm-sub-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="sm-content">
        {view === "new" ? (
          newRequests.length === 0
            ? <p style={{padding:"2rem",color:"#555"}}>No new requests available.</p>
            : <div className="sm-grid">{newRequests.map(renderCard)}</div>
        ) : (
          confirmedRequests.length === 0
            ? <p style={{padding:"2rem",color:"#555"}}>You haven't submitted any offers yet.</p>
            : <div className="sm-grid">{confirmedRequests.map(renderConfirmedCard)}</div>
        )}
      </div>

      {selectedRequest && (
        <div className="sm-popup-overlay">
          <div className="sm-popup-card">
            <div className="sm-popup-header">
              <h2>Material Request List</h2>
              <X size={20} className="sm-close-icon" onClick={() => setSelectedRequest(null)}/>
            </div>
            <p className="sm-popup-customer">
              {selectedRequest.listName && <strong>{selectedRequest.listName} — </strong>}
              {selectedRequest.customer.name} • {selectedRequest.customer.location}
            </p>
            <div className="sm-popup-materials">
              {selectedRequest.materials.map((m, i) => (
                <div className="sm-popup-item" key={i}>
                  <Package size={16}/>
                  <span>{m.name}</span>
                  {m.category && <span className="sm-cat-tag">{m.category}</span>}
                  <p>{m.quantity} {m.unit}</p>
                </div>
              ))}
            </div>
            <div className="sm-popup-footer">
              {!myOfferRequestIds.has(getRequestId(selectedRequest._id)) && (
                <button className="sm-supply-btn" onClick={() => navigate("/SupplierConfirmation", { state: selectedRequest })}>
                  Proceed to Supply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierMarketplace;
