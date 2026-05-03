import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE from "../../api";
import "./RequestForm.css";
import { User, Phone, MapPin, Calendar, Plus, Trash2, Send, Edit, Check, X, AlertCircle, CheckCircle2, Loader2, FileText, BookOpen, Pencil, Tag, Thermometer, Leaf, Weight, ChevronRight, Sprout, FlaskConical, Droplets, Pill, Layers, Apple, Flower2, TreeDeciduous, AlertTriangle, Lightbulb, Scale } from "lucide-react";
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
  const [showGuide, setShowGuide]         = useState(false);

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
    if (!/^0\d{9}$/.test(customer.phone)) { setValidationMsg("Phone number must be 10 digits and start with 0."); return false; }
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
          <button type="button" className="btn-quick-guide" onClick={() => setShowGuide(true)}>
            <BookOpen size={16}/> Quick Guide
          </button>
        </div>

        {showGuide && (
          <div className="guide-overlay" onClick={() => setShowGuide(false)}>
            <div className="guide-modal" onClick={e => e.stopPropagation()}>

              {/* HEADER */}
              <div className="guide-header">
                <div className="guide-header-left">
                  <div className="guide-header-icon"><BookOpen size={22}/></div>
                  <div>
                    <h2>How to Add a Material</h2>
                    <p>Follow these 5 steps to fill the form correctly</p>
                  </div>
                </div>
                <button className="guide-close" onClick={() => setShowGuide(false)} aria-label="Close guide">
                  <X size={18}/>
                </button>
              </div>

              {/* BODY */}
              <div className="guide-body">

                {/* STEP 1 */}
                <div className="guide-step">
                  <div className="guide-step-badge"><Pencil size={12}/> Step 1</div>
                  <h4>Enter Material Name</h4>
                  <p>Type the exact name of the herb or herbal product you need.</p>
                  <div className="guide-tip"><ChevronRight size={13}/> e.g. Ginger, Neem Leaves, Cinnamon Bark</div>
                </div>

                {/* STEP 2 */}
                <div className="guide-step">
                  <div className="guide-step-badge"><Tag size={12}/> Step 2</div>
                  <h4>Select Category <span className="guide-sub">— final form of the product</span></h4>
                  <p>This shows the final form of the herbal product — how it is prepared or used.</p>
                  <div className="guide-option-list">
                    <div className="gopt"><span className="gchip gchip-green"><Sprout size={11}/> Raw Herb</span><span>Natural, fresh plant (no processing) — e.g. Fresh ginger, fresh leaves</span></div>
                    <div className="gopt"><span className="gchip gchip-green"><Leaf size={11}/> Dried Herb</span><span>Plant that has been dried — e.g. Dried neem leaves</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><Layers size={11}/> Powder</span><span>Ground into fine form — e.g. Herbal powder</span></div>
                    <div className="gopt"><span className="gchip gchip-yellow"><Droplets size={11}/> Oil</span><span>Liquid extracted from plant — e.g. Coconut oil</span></div>
                    <div className="gopt"><span className="gchip gchip-teal"><FlaskConical size={11}/> Extract</span><span>Concentrated form of herb — e.g. Herbal extract</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><FlaskConical size={11}/> Paste</span><span>Thick, semi-solid form — e.g. Herbal paste</span></div>
                    <div className="gopt"><span className="gchip gchip-yellow"><Droplets size={11}/> Juice</span><span>Liquid squeezed from plant — e.g. Aloe vera juice</span></div>
                    <div className="gopt"><span className="gchip gchip-blue"><Pill size={11}/> Capsule / Tablet</span><span>Ready-made medicine — e.g. Herbal capsules</span></div>
                    <div className="gopt"><span className="gchip gchip-blue"><FlaskConical size={11}/> Syrup / Decoction</span><span>Liquid medicine — e.g. Herbal syrup</span></div>
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="guide-step">
                  <div className="guide-step-badge"><Thermometer size={12}/> Step 3</div>
                  <h4>Select Condition <span className="guide-sub">— physical state of the material</span></h4>
                  <p>This shows the physical condition or state of the material.</p>
                  <div className="guide-option-list">
                    <div className="gopt"><span className="gchip gchip-green"><Sprout size={11}/> Fresh</span><span>Just harvested</span></div>
                    <div className="gopt"><span className="gchip gchip-green"><Leaf size={11}/> Cleaned</span><span>Washed or cleaned</span></div>
                    <div className="gopt"><span className="gchip gchip-teal"><Layers size={11}/> Whole</span><span>Not cut or broken</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><Layers size={11}/> Cut / Sliced</span><span>Cut into pieces</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><Layers size={11}/> Crushed</span><span>Roughly broken</span></div>
                    <div className="gopt"><span className="gchip gchip-yellow"><Lightbulb size={11}/> Dried – Sun Dried</span><span>Dried under sunlight</span></div>
                    <div className="gopt"><span className="gchip gchip-teal"><Lightbulb size={11}/> Dried – Shade Dried</span><span>Dried in shade</span></div>
                    <div className="gopt"><span className="gchip gchip-blue"><Lightbulb size={11}/> Dried – Oven Dried</span><span>Dried using machine</span></div>
                  </div>
                </div>

                {/* STEP 4 */}
                <div className="guide-step">
                  <div className="guide-step-badge"><Leaf size={12}/> Step 4</div>
                  <h4>Select Plant Part <span className="guide-sub">— which part of the plant is used</span></h4>
                  <p>This shows which part of the plant is used.</p>
                  <div className="guide-option-list">
                    <div className="gopt"><span className="gchip gchip-brown"><TreeDeciduous size={11}/> Root</span><span>Underground part — e.g. Ginger</span></div>
                    <div className="gopt"><span className="gchip gchip-green"><Leaf size={11}/> Leaf</span><span>Leaves of plant — e.g. Neem</span></div>
                    <div className="gopt"><span className="gchip gchip-teal"><Layers size={11}/> Stem</span><span>Main body of plant</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><TreeDeciduous size={11}/> Bark</span><span>Outer layer of tree — e.g. Cinnamon</span></div>
                    <div className="gopt"><span className="gchip gchip-yellow"><Flower2 size={11}/> Flower</span><span>Flower part — e.g. Clove</span></div>
                    <div className="gopt"><span className="gchip gchip-yellow"><Apple size={11}/> Fruit</span><span>Fruit part</span></div>
                    <div className="gopt"><span className="gchip gchip-brown"><Layers size={11}/> Seed</span><span>Seeds — e.g. Sesame</span></div>
                    <div className="gopt"><span className="gchip gchip-green"><Sprout size={11}/> Whole Plant</span><span>Entire plant used</span></div>
                    <div className="gopt"><span className="gchip gchip-teal"><Droplets size={11}/> Latex / Sap</span><span>Liquid from plant — e.g. Rubber sap</span></div>
                  </div>
                </div>

                {/* STEP 5 */}
                <div className="guide-step">
                  <div className="guide-step-badge"><Scale size={12}/> Step 5</div>
                  <h4>Enter Quantity &amp; Unit</h4>
                  <p>Type the quantity (number) then select the correct unit. Units depend on Category:</p>
                  <div className="guide-unit-table">
                    <div className="gut-row gut-head"><span>Category</span><span>Allowed Units</span></div>
                    <div className="gut-row"><span><Sprout size={12}/> Raw Herb</span><span>kg, g, bundles, pieces</span></div>
                    <div className="gut-row"><span><Layers size={12}/> Powder</span><span>g, kg, mg</span></div>
                    <div className="gut-row"><span><Droplets size={12}/> Oil / Juice</span><span>ml, L</span></div>
                    <div className="gut-row"><span><Pill size={12}/> Capsules / Tablets</span><span>pieces, bottles</span></div>
                  </div>
                  <div className="guide-tip" style={{marginTop:"0.6rem"}}><ChevronRight size={13}/> 2 kg ginger → Qty: 2, Unit: kg &nbsp;|&nbsp; 500 ml oil → Qty: 500, Unit: ml</div>
                </div>

                {/* EXAMPLES */}
                <div className="guide-section-label"><Lightbulb size={14}/> Quick Examples</div>
                <div className="guide-ex-grid">
                  <div className="guide-ex-card">
                    <div className="gex-name">🫚 Ginger</div>
                    <div className="gex-row"><Tag size={11}/> Raw Herb</div>
                    <div className="gex-row"><TreeDeciduous size={11}/> Root</div>
                    <div className="gex-row"><Thermometer size={11}/> Fresh</div>
                    <div className="gex-row"><Scale size={11}/> 5 kg</div>
                  </div>
                  <div className="guide-ex-card">
                    <div className="gex-name">🌿 Neem Powder</div>
                    <div className="gex-row"><Tag size={11}/> Powder</div>
                    <div className="gex-row"><Leaf size={11}/> Leaf</div>
                    <div className="gex-row"><Thermometer size={11}/> Dried – Shade</div>
                    <div className="gex-row"><Scale size={11}/> 500 g</div>
                  </div>
                  <div className="guide-ex-card">
                    <div className="gex-name">🌻 Sesame Oil</div>
                    <div className="gex-row"><Tag size={11}/> Oil</div>
                    <div className="gex-row"><Layers size={11}/> Seed</div>
                    <div className="gex-row"><Thermometer size={11}/> Dried – Sun</div>
                    <div className="gex-row"><Scale size={11}/> 1 L</div>
                  </div>
                </div>

                {/* MISTAKES */}
                <div className="guide-mistakes">
                  <div className="guide-section-label guide-section-warn"><AlertTriangle size={14}/> Common Mistakes to Avoid</div>
                  <div className="guide-mistake-list">
                    <div className="gmistake"><X size={13}/> Selecting Oil with &quot;Fresh&quot; condition</div>
                    <div className="gmistake"><X size={13}/> Selecting Root as a Product Category</div>
                    <div className="gmistake"><X size={13}/> Using wrong units (e.g. kg for capsules)</div>
                  </div>
                </div>

                {/* QUICK RULES */}
                <div className="guide-rules">
                  <div className="grule"><Tag size={13}/><span><strong>Category</strong> = What it becomes</span></div>
                  <div className="grule"><Leaf size={13}/><span><strong>Part</strong> = Where it comes from</span></div>
                  <div className="grule"><Thermometer size={13}/><span><strong>Condition</strong> = Physical state</span></div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="guide-footer">
                <button className="guide-footer-close" onClick={() => setShowGuide(false)}>
                  <X size={15}/> Close Guide
                </button>
              </div>

            </div>
          </div>
        )}

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
                        ? <input
                            name={f.name}
                            value={customer[f.name]}
                            maxLength={f.name === "phone" ? 10 : undefined}
                            inputMode={f.name === "phone" ? "numeric" : undefined}
                            placeholder={f.name === "phone" ? "07XXXXXXXX" : undefined}
                            onKeyDown={e => {
                              const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab'];
                              if (f.name === "name" && !/[a-zA-Z\s]/.test(e.key) && !nav.includes(e.key)) e.preventDefault();
                              if (f.name === "phone" && !/[0-9]/.test(e.key) && !nav.includes(e.key)) e.preventDefault();
                            }}
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
