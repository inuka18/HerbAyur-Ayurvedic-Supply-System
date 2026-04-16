import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE from "../../api";
import "./RequestForm.css";
import { User, Phone, MapPin, Calendar, Plus, Trash2, Send, Edit, Check, X, AlertCircle, CheckCircle2, Loader2, FileText } from "lucide-react";
import {
  CATEGORIES,
  CONDITIONS,
  PARTS,
  getUnits,
  isValidUnit,
  DEFAULT_MATERIAL,
  normalizeCategory,
  normalizeCondition,
  normalizePart,
} from "../../materialOptions";

function RequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill  = location.state?.prefill;
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [loadingUser, setLoadingUser]   = useState(true);
  const [customer, setCustomer]         = useState({ name: "", phone: "", location: "" });
  const [requiredDate, setRequiredDate] = useState("");
  const [listName, setListName]         = useState(prefill?.listName || "");
  const [materials, setMaterials]       = useState(
    prefill?.materials?.length
      ? prefill.materials.map((m, i) => ({
          ...DEFAULT_MATERIAL,
          ...m,
          category: normalizeCategory(m.category),
          condition: normalizeCondition(m.condition),
          part: normalizePart(m.part),
          id: i + 1,
        }))
      : [{ ...DEFAULT_MATERIAL, id: 1 }]
  );
  const [formStatus, setFormStatus]     = useState("idle");
  const [validationMsg, setValidationMsg] = useState("");

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data._id) setCustomer({ name: `${data.firstName} ${data.lastName}`, phone: data.phone, location: data.address });
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id), 0) + 1;
    setMaterials([...materials, { ...DEFAULT_MATERIAL, id: newId }]);
  };

  const removeMaterial = (id) => {
    if (materials.length === 1) return;
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id, field, value) => {
    setMaterials(materials.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      // Auto-reset unit when category changes and current unit becomes invalid
      if (field === "category") {
        const units = getUnits(updated.category);
        if (!units.includes(updated.unit)) updated.unit = units[0];
      }
      return updated;
    }));
  };

  const handleQuantityChange = (id, value) => {
    if (value === "") {
      updateMaterial(id, "quantity", value);
      return;
    }
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (Number(value) < 0) return;
    updateMaterial(id, "quantity", value);
  };

  const validate = () => {
    if (!listName.trim()) { setValidationMsg("Please enter a list name."); return false; }
    if (!requiredDate)    { setValidationMsg("Please select a required date."); return false; }
    if (requiredDate <= new Date().toISOString().split("T")[0]) { setValidationMsg("Required date must be at least tomorrow."); return false; }
    for (const m of materials) {
      if (!m.name.trim())                    { setValidationMsg("All materials must have a name."); return false; }
      if (!m.quantity || Number(m.quantity) <= 0) { setValidationMsg("All materials must have a valid quantity (> 0)."); return false; }
      if (!isValidUnit(m.category, m.unit)) { setValidationMsg(`Invalid unit "${m.unit}" for "${m.name}". Please select a valid unit.`); return false; }
    }
    setValidationMsg(""); return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { setTimeout(() => setValidationMsg(""), 6000); return; }
    setFormStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ customer, listName, requiredDate, materials }),
      });
      if (!res.ok) throw new Error();
      setFormStatus("success");
    } catch { setFormStatus("error"); }
  };

  return (
    <div className="app-container">
      <div className="bg bg1">🌾</div><div className="bg bg2">🫚</div>
      <div className="bg bg3">🌸</div><div className="bg bg4">🌿</div><div className="bg bg5">🪨</div>

      <main className="main-content">
        <div className="hero">
          <h1>Post Your Raw Material Requirement</h1>
          <p>Connect directly with verified Sri Lankan suppliers</p>
        </div>

        {loadingUser ? (
          <div className="req-loading"><Loader2 size={32} className="req-spinner"/><p>Loading your details...</p></div>
        ) : (
          <>
            <form className="form-card" onSubmit={handleSubmit}>

              {/* CUSTOMER SECTION */}
              <section className="customer-section">
                <div className="section-header">
                  <h3>Customer Details</h3>
                  <button type="button" className={`btn-edit ${isEditingCustomer ? "active" : ""}`}
                    onClick={() => setIsEditingCustomer(p => !p)}>
                    {isEditingCustomer ? <><Check size={16}/> Done</> : <><Edit size={16}/> Edit</>}
                  </button>
                </div>
                <div className="grid-4">
                  {[
                    { label: "Name",     icon: <User size={14}/>,   name: "name"     },
                    { label: "Phone",    icon: <Phone size={14}/>,  name: "phone"    },
                    { label: "Location", icon: <MapPin size={14}/>, name: "location" },
                  ].map(f => (
                    <div className="form-group" key={f.name}>
                      <label>{f.icon} {f.label}</label>
                      {isEditingCustomer
                        ? <input name={f.name} value={customer[f.name]}
                            onChange={e => setCustomer(p => ({ ...p, [f.name]: e.target.value }))}/>
                        : <div className="readonly-value">{customer[f.name]}</div>}
                    </div>
                  ))}
                  <div className="form-group">
                    <label><Calendar size={14}/> Required Date</label>
                    <input type="date" value={requiredDate} min={minDate} onChange={e => setRequiredDate(e.target.value)} required/>
                  </div>
                </div>
              </section>

              {/* MATERIALS SECTION */}
              <section className="materials-section">
                <h3>Materials Needed</h3>

                <div className="form-group" style={{ marginBottom: "1rem", maxWidth: 400 }}>
                  <label><FileText size={14}/> List Name</label>
                  <input placeholder="e.g. Ayurvedic Batch #1" value={listName}
                    onChange={e => setListName(e.target.value)} required/>
                </div>

                <div className="table-container-req">
                  <table className="req-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Raw Material</th>
                        <th>Category</th>
                        <th>Condition</th>
                        <th>Part</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m, idx) => {
                        const units   = getUnits(m.category);
                        const invalid = m.unit && !units.includes(m.unit);
                        return (
                          <tr key={m.id} className="req-row">
                            <td className="req-no">{idx + 1}</td>
                            <td>
                              <input placeholder="Enter Raw Material"
                                value={m.name} onChange={e => updateMaterial(m.id, "name", e.target.value)} required/>
                            </td>
                            <td>
                              <select value={m.category} onChange={e => updateMaterial(m.id, "category", e.target.value)}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={m.condition} onChange={e => updateMaterial(m.id, "condition", e.target.value)}>
                                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </td>
                            <td>
                              <select value={m.part} onChange={e => updateMaterial(m.id, "part", e.target.value)}>
                                {PARTS.map(p => <option key={p}>{p}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="number" min="0.01" step="0.01" placeholder="Qty"
                                value={m.quantity}
                                onChange={e => handleQuantityChange(m.id, e.target.value)}
                                onKeyDown={e => {
                                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                                }}
                                onPaste={e => {
                                  const pasted = e.clipboardData.getData("text");
                                  if (!/^\d*\.?\d*$/.test(pasted) || Number(pasted) < 0) e.preventDefault();
                                }}
                                required/>
                            </td>
                            <td>
                              <select value={m.unit}
                                onChange={e => updateMaterial(m.id, "unit", e.target.value)}
                                className={invalid ? "unit-invalid" : ""}>
                                {units.map(u => <option key={u}>{u}</option>)}
                              </select>
                              {invalid && <span className="unit-warn">⚠ Invalid for this category</span>}
                            </td>
                            <td>
                              <button type="button" className="btn-remove" onClick={() => removeMaterial(m.id)}
                                disabled={materials.length === 1}>
                                <Trash2 size={18}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button type="button" className="btn btn-outline add-btn" onClick={addMaterial}>
                  <Plus size={16}/> Add Another Item
                </button>

                <div className="actions">
                  <button type="button" className="btn btn-outline cancel-btn-themed" onClick={() => navigate("/")}>
                    <X size={16}/> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary submit-btn"
                    disabled={formStatus === "submitting" || materials.some(m => !isValidUnit(m.category, m.unit))}>
                    {formStatus === "submitting" ? "Submitting..." : <><Send size={16}/> Submit Requirement</>}
                  </button>
                </div>

                {validationMsg && (
                  <div className="form-alert warning-alert"><AlertCircle size={20}/><span>{validationMsg}</span></div>
                )}
                {formStatus === "error" && (
                  <div className="form-alert error-alert"><AlertCircle size={20}/><span>Something went wrong. Please try again later.</span></div>
                )}
              </section>
            </form>

            {formStatus === "success" && (
              <div className="success-popup-overlay">
                <div className="success-popup">
                  <button className="popup-close-btn" onClick={() => { setFormStatus("idle"); navigate("/customer-dashboard"); }}><X size={24}/></button>
                  <CheckCircle2 size={64} className="success-popup-icon"/>
                  <h2>Success!</h2>
                  <p>Your raw material requirement has been posted successfully.</p>
                  <p className="success-subtitle">Suppliers will contact you soon.</p>
                  <button className="success-popup-btn" onClick={() => { setFormStatus("idle"); navigate("/customer-dashboard"); }}>View Supplier Offers</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default RequestForm;
