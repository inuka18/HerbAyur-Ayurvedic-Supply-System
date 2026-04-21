import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SupplierConfirmation.css";
import { User, Phone, MapPin, Calendar, CheckSquare, Square, Send, X, PackageOpen } from "lucide-react";
import API_BASE from "../../api";

function SupplierConfirmation() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const requestData = location.state || {};

  const [materials, setMaterials] = useState(
    (requestData.materials || []).map((m, index) => ({
      id:          index + 1,
      name:        m.name      || "—",
      category:    m.category  || "—",
      quantity:    m.quantity  || 0,
      unit:        m.unit      || "",
      condition:   m.condition || "—",
      part:        m.part      || "—",
      selected:    false,
      price:       "",
      inventoryId: "",
    }))
  );

  const [inventory, setInventory]           = useState([]);
  const [inventoryMatch, setInventoryMatch] = useState({});
  const [matchLoading, setMatchLoading]     = useState(true);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState("");

  const token = localStorage.getItem("token");

  // Convert inventory price to match the requested unit
  const convertPrice = (invPrice, invUnit, reqUnit) => {
    if (!invPrice || invUnit === reqUnit) return invPrice;
    if (invUnit === "kg" && reqUnit === "g")   return invPrice / 1000;
    if (invUnit === "g"  && reqUnit === "kg")  return invPrice * 1000;
    if (invUnit === "kg" && reqUnit === "mg")  return invPrice / 1000000;
    if (invUnit === "mg" && reqUnit === "kg")  return invPrice * 1000000;
    if (invUnit === "g"  && reqUnit === "mg")  return invPrice / 1000;
    if (invUnit === "mg" && reqUnit === "g")   return invPrice * 1000;
    if (invUnit === "L"  && reqUnit === "ml")  return invPrice / 1000;
    if (invUnit === "ml" && reqUnit === "L")   return invPrice * 1000;
    return invPrice;
  };

  useEffect(() => {
    if (!requestData.materials?.length) { setMatchLoading(false); return; }

    Promise.all([
      fetch(`${API_BASE}/inventory`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/inventory/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ materialNames: requestData.materials.map(m => m.name) }),
      }).then(r => r.json()),
    ]).then(([inv, matchData]) => {
      const invList = Array.isArray(inv) ? inv : [];
      setInventory(invList);
      setInventoryMatch(matchData);

      // Auto-select AI-matched inventory item and pre-fill price with unit conversion
      setMaterials(prev => prev.map(m => {
        const match   = matchData[m.name];
        const invItem = invList.find(i => i._id === match?.inventoryId);
        if (match && invItem) {
          const converted = invItem.price > 0
            ? convertPrice(invItem.price, invItem.unit, m.unit)
            : null;
          return {
            ...m,
            inventoryId: match.inventoryId || "",
            price: converted !== null ? String(Number(converted.toFixed(4))) : "",
          };
        }
        return m;
      }));
    }).catch(() => {}).finally(() => setMatchLoading(false));
  }, []);

  // Filter inventory dropdown options relevant to a material row
  // Show: AI-matched item first, then items with same category, then all others
  const getInventoryOptions = (m) => {
    const match = inventoryMatch[m.name];
    const matchedId = match?.inventoryId;

    const normalize = (s) => (s || "").toLowerCase().trim();
    const matCat  = normalize(m.category);

    // Sort: matched first, then same category, then rest
    return [...inventory].sort((a, b) => {
      const aMatch = a._id === matchedId ? 0 : normalize(a.category) === matCat ? 1 : 2;
      const bMatch = b._id === matchedId ? 0 : normalize(b.category) === matCat ? 1 : 2;
      return aMatch - bMatch;
    });
  };

  const toggleSelect = (id) =>
    setMaterials(materials.map(m => m.id === id ? { ...m, selected: !m.selected } : m));

  const canSelectAll = !matchLoading && materials.every(m => {
    const match = inventoryMatch[m.name];
    return match && match.quantity > 0;
  });

  const selectAll = () => {
    const all = materials.every(m => m.selected);
    setMaterials(materials.map(m => ({ ...m, selected: !all })));
  };

  const update = (id, field, value) =>
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));

  // When supplier picks an inventory item → auto-fill price with unit conversion
  const handleInventorySelect = (id, inventoryId) => {
    const invItem  = inventory.find(i => i._id === inventoryId);
    const material = materials.find(m => m.id === id);
    setMaterials(materials.map(m => {
      if (m.id !== id) return m;
      const converted = invItem?.price > 0
        ? convertPrice(invItem.price, invItem.unit, material.unit)
        : null;
      return {
        ...m,
        inventoryId,
        price: converted !== null ? String(Number(converted.toFixed(4))) : m.price,
      };
    }));
  };

  const getSupplyType = (sel) => {
    if (sel.length === materials.length) return "Whole";
    if (sel.length > 1)                  return "Partial";
    return "Item";
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    const selected = materials.filter(
      (m) => m.selected && m.inventoryId && m.price !== "" && Number(m.price) > 0
    );
    if (selected.length === 0) {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 5000);
      return;
    }
    if (!token) { navigate("/Login"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId:  requestData._id,
          supplyType: getSupplyType(selected),
          items: selected.map(m => ({
            name:      m.name,
            supplyQty: Number(m.quantity), // use requested quantity as supply quantity
            unit:      m.unit,
            price:     Number(m.price),
            inventoryId: m.inventoryId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setShowSuccess(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  const closeSuccess = () => { setShowSuccess(false); navigate("/SupplierMarketplace"); };

  const stockBadge = (match) => {
    if (!match) return null;
    const qty = match.quantity;
    const label = qty === 0 ? "Out of Stock" : qty <= 5 ? `Low: ${qty} ${match.unit}` : `In Stock: ${qty} ${match.unit}`;
    const cls   = qty === 0 ? "sc-stock-out" : qty <= 5 ? "sc-stock-low" : "sc-stock-ok";
    return (
      <span className={`sc-stock-badge ${cls}`}>
        <PackageOpen size={11}/> {label}
        {match.inventoryName && match.inventoryName !== match.requestedName && (
          <span className="sc-match-name"> ({match.inventoryName})</span>
        )}
      </span>
    );
  };

  return (
    <div className="supplier-page">
      <div className="sup-bg sup-bg1">🌿</div><div className="sup-bg sup-bg2">🌾</div>
      <div className="sup-bg sup-bg3">🫚</div><div className="sup-bg sup-bg4">🌸</div>
      <div className="sup-bg sup-bg5">🍃</div>

      <div className="supplier-container">
        {requestData.listName && <h2 className="list-name-title">{requestData.listName}</h2>}
        <h1 className="page-title">Supply Request Confirmation</h1>

        <div className="customer-card">
          <div className="customer-item"><User size={16}/> {requestData.customer?.name || "—"}</div>
          <div className="customer-item"><Phone size={16}/> {requestData.customer?.phone || "—"}</div>
          <div className="customer-item"><MapPin size={16}/> {requestData.customer?.location || "—"}</div>
          <div className="customer-item">
            <Calendar size={16}/> Required:{" "}
            {requestData.requiredDate ? new Date(requestData.requiredDate).toLocaleDateString() : "—"}
          </div>
        </div>

        {showSuccess ? (
          <div className="theme-success-overlay">
            <div className="theme-success-card">
              <button className="success-close-btn" onClick={closeSuccess}><X size={24}/></button>
              <div className="theme-success-icon">✓</div>
              <h2>Supply Confirmed!</h2>
              <p>Your supply offer has been submitted. The customer has been notified.</p>
              <button className="theme-success-return-btn" onClick={closeSuccess}>
                Return to Supplier Market
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="materials-header">
                <h2>Requested Raw Materials</h2>
                <button
                  type="button"
                  className="btn-select-all"
                  onClick={selectAll}
                  disabled={!canSelectAll}
                  title={!canSelectAll ? "Some materials are not available in your inventory" : ""}
                >
                  {materials.every(m => m.selected)
                    ? <><CheckSquare size={16}/> Deselect All</>
                    : <><Square size={16}/> Select All</>}
                </button>
              </div>

              {matchLoading && (
                <p className="sc-match-loading">🔍 Matching with your inventory...</p>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Material</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Part</th>
                      <th>Request Qty</th>
                      <th>Match Inventory</th>
                      <th>Stock</th>
                      <th>Price / Unit (Rs)</th>
                      <th>Total (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(m => {
                      const match   = inventoryMatch[m.name];
                      const options = getInventoryOptions(m);

                      return (
                        <tr key={m.id} className={m.selected ? "active-row" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={m.selected}
                              onChange={() => toggleSelect(m.id)}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>
                            {m.category !== "—"
                              ? <span className="cat-badge">{m.category}</span>
                              : <span className="sc-no-match">—</span>}
                          </td>
                          <td>
                            {m.condition !== "—"
                              ? <span className="cond-badge">{m.condition}</span>
                              : <span className="sc-no-match">—</span>}
                          </td>
                          <td>
                            {m.part !== "—"
                              ? <span className="sc-part-tag">{m.part}</span>
                              : <span className="sc-no-match">—</span>}
                          </td>
                          <td>{m.quantity} {m.unit}</td>

                          {/* INVENTORY DROPDOWN — sorted by relevance */}
                          <td>
                            <select
                              className="sc-inv-select"
                              value={m.inventoryId}
                              disabled={!m.selected}
                              onChange={e => handleInventorySelect(m.id, e.target.value)}
                            >
                              <option value="">— Select inventory item —</option>
                              {options.map(inv => {
                                const isAiMatch = inv._id === match?.inventoryId;
                                return (
                                  <option key={inv._id} value={inv._id}>
                                    {isAiMatch ? "✓ " : ""}{inv.name} ({inv.quantity} {inv.unit}){isAiMatch ? " — Best Match" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </td>

                          {/* STOCK from AI match */}
                          <td>
                            {matchLoading
                              ? <span className="sc-stock-loading">...</span>
                              : match
                                ? stockBadge(match)
                                : <span className="sc-no-match">Not in inventory</span>}
                          </td>

                          <td>
                            <input
                              type="number"
                              placeholder="Price per unit"
                              disabled={!m.selected}
                              value={m.price}
                              onChange={e => update(m.id, "price", e.target.value)}
                            />
                          </td>
                          <td style={{ fontWeight:700, color:"#1a3c34", whiteSpace:"nowrap" }}>
                            {m.selected && m.price && Number(m.price) > 0
                              ? `Rs ${(Number(m.price) * Number(m.quantity)).toLocaleString()}`
                              : <span style={{ color:"#9ca3af" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* GRAND TOTAL */}
              {materials.some(m => m.selected && m.price && Number(m.price) > 0) && (
                <div className="sc-grand-total">
                  Grand Total: Rs {materials
                    .filter(m => m.selected && m.price && Number(m.price) > 0)
                    .reduce((sum, m) => sum + Number(m.price) * Number(m.quantity), 0)
                    .toLocaleString()}
                </div>
              )}

              {error && (
                <div style={{ color: "#c62828", marginTop: "0.5rem" }}>⚠ {error}</div>
              )}

              <div className="form-action-group">
                <button
                  type="button"
                  className="btn-cancel-unique"
                  onClick={() => navigate("/SupplierMarketplace")}
                >
                  <X size={16}/> Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  <Send size={16}/> {submitting ? "Submitting..." : "Confirm Supply"}
                </button>
              </div>
            </form>

            {showValidation && (
              <div className="theme-validation-message">
                Please select at least one material, choose inventory, and enter a valid price.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SupplierConfirmation;
