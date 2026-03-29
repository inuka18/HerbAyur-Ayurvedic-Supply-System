import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, PackageOpen, X, Check, Edit2 } from "lucide-react";
import API_BASE from "../../api";
import "./Inventory.css";
import { CATEGORIES, ALL_UNITS } from "../../materialOptions";

const token = () => localStorage.getItem("token");

function Inventory() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [form, setForm] = useState({ name: "", category: "Roots", quantity: "", unit: "kg", price: "", aliases: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/inventory`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Unit conversion pairs for price auto-calculation
  const UNIT_CONVERSIONS = {
    L:   { smaller: "ml",  factor: 1000 },
    kg:  { smaller: "g",   factor: 1000 },
    g:   { larger:  "kg",  factor: 1000 },
    ml:  { larger:  "L",   factor: 1000 },
  };

  // Get converted price hint
  const getConvertedPrice = (unit, price) => {
    const p = Number(price);
    if (!p || !unit) return null;
    const conv = UNIT_CONVERSIONS[unit];
    if (!conv) return null;
    if (conv.smaller) {
      // e.g. L → ml: Rs 1000/L means Rs 1/ml
      return `Rs ${(p / conv.factor).toFixed(p / conv.factor < 1 ? 4 : 2)} per ${conv.smaller}`;
    }
    if (conv.larger) {
      // e.g. ml → L: Rs 1/ml means Rs 1000/L
      return `Rs ${(p * conv.factor).toLocaleString()} per ${conv.larger}`;
    }
    return null;
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", category: "Roots", quantity: "", unit: "kg", price: "", aliases: "" });
    setError(""); setSuccess(""); setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category || "Roots", quantity: item.quantity, unit: item.unit, price: item.price || "", aliases: item.aliases.join(", ") });
    setError(""); setSuccess(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    const payload = {
      name:     form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity),
      unit:     form.unit,
      price:    Number(form.price) || 0,
      aliases:  form.aliases.split(",").map(a => a.trim()).filter(Boolean),
    };
    try {
      const url    = editItem ? `${API_BASE}/inventory/${editItem._id}` : `${API_BASE}/inventory`;
      const method = editItem ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setSuccess(editItem ? "Item updated!" : "Item added!");
      setShowForm(false); fetchItems();
    } catch { setError("Something went wrong."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    await fetch(`${API_BASE}/inventory/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    fetchItems();
  };

  const handleRestock = async (id) => {
    if (!restockQty || Number(restockQty) <= 0) return;
    const item = items.find(i => i._id === id);
    await fetch(`${API_BASE}/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ quantity: item.quantity + Number(restockQty) }),
    });
    setRestockId(null); setRestockQty(""); fetchItems();
  };

  const stockLevel = (qty) => qty === 0 ? "out" : qty <= 5 ? "low" : qty <= 20 ? "medium" : "good";

  return (
    <div className="inv-page">
      <div className="inv-header">
        <div>
          <h2><PackageOpen size={22}/> My Inventory</h2>
          <p className="inv-sub">Manage your stock. Items auto-decrease when offers are accepted.</p>
        </div>
        <button className="inv-add-btn" onClick={openAdd}><Plus size={16}/> Add Item</button>
      </div>

      {success && <div className="inv-success">✅ {success}</div>}

      {loading ? <p className="inv-loading">Loading inventory...</p> : items.length === 0 ? (
        <div className="inv-empty"><PackageOpen size={48} color="#d1d5db"/><p>No inventory items yet. Add your first item!</p></div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>#</th><th>Item Name</th><th>Category</th><th>Also Known As</th>
                <th>Price/Unit</th><th>Stock</th><th>Unit</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td className="inv-name">{item.name}</td>
                  <td><span className="alias-tag" style={{background:"#f0fdf4",color:"#166534"}}>{item.category || "—"}</span></td>
                  <td className="inv-aliases">
                    {item.aliases.length > 0
                      ? item.aliases.map((a, j) => <span key={j} className="alias-tag">{a}</span>)
                      : <span style={{ color:"#9ca3af" }}>—</span>}
                  </td>
                  <td style={{ fontWeight:600, color:"#15803d" }}>
                    {item.price > 0 ? (
                      <div>
                        <div>Rs {item.price.toLocaleString()} / {item.unit}</div>
                        {getConvertedPrice(item.unit, item.price) && (
                          <div style={{ fontSize:"0.72rem", color:"#6b7280", fontWeight:400 }}>
                            ≈ {getConvertedPrice(item.unit, item.price)}
                          </div>
                        )}
                      </div>
                    ) : <span style={{color:"#9ca3af"}}>—</span>}
                  </td>
                  <td>
                    {restockId === item._id ? (
                      <div className="restock-inline">
                        <input type="number" min="1" placeholder="Add qty" value={restockQty} onChange={e => setRestockQty(e.target.value)}/>
                        <button className="inv-icon-btn green" onClick={() => handleRestock(item._id)}><Check size={14}/></button>
                        <button className="inv-icon-btn grey"  onClick={() => { setRestockId(null); setRestockQty(""); }}><X size={14}/></button>
                      </div>
                    ) : (
                      <span className={`stock-qty stock-${stockLevel(item.quantity)}`}>{item.quantity}</span>
                    )}
                  </td>
                  <td>{item.unit}</td>
                  <td><span className={`stock-badge stock-badge-${stockLevel(item.quantity)}`}>
                    {item.quantity === 0 ? "Out of Stock" : item.quantity <= 5 ? "Low Stock" : item.quantity <= 20 ? "Medium" : "In Stock"}
                  </span></td>
                  <td className="inv-actions">
                    <button className="inv-icon-btn blue"  onClick={() => openEdit(item)}><Edit2 size={14}/></button>
                    <button className="inv-icon-btn green" onClick={() => { setRestockId(item._id); setRestockQty(""); }} title="Restock"><RefreshCw size={14}/></button>
                    <button className="inv-icon-btn red"   onClick={() => handleDelete(item._id)}><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="inv-overlay">
          <div className="inv-modal">
            <h3>{editItem ? "Edit Item" : "Add Inventory Item"}</h3>
            <form onSubmit={handleSubmit} className="inv-form">
              <div className="inv-field">
                <label>Item Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ginger, Turmeric, Neem" required/>
              </div>
              <div className="inv-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="inv-field">
                <label>Also Known As <span className="inv-hint">(comma separated)</span></label>
                <input name="aliases" value={form.aliases} onChange={handleChange} placeholder="Iguru, Inji, Zanjabil"/>
              </div>
              <div className="inv-row">
                <div className="inv-field">
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" required/>
                </div>
                <div className="inv-field">
                  <label>Unit</label>
                  <select name="unit" value={form.unit} onChange={handleChange}>
                    {ALL_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="inv-field">
                <label>Price per Unit (Rs)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} min="0" placeholder="e.g. 450"/>
                {getConvertedPrice(form.unit, form.price) && (
                  <span className="inv-price-hint">
                    ≈ {getConvertedPrice(form.unit, form.price)}
                  </span>
                )}
              </div>
              {error && <div className="inv-error">⚠ {error}</div>}
              <div className="inv-modal-actions">
                <button type="submit" className="inv-save-btn"><Check size={15}/> {editItem ? "Update" : "Add"}</button>
                <button type="button" className="inv-cancel-btn" onClick={() => setShowForm(false)}><X size={15}/> Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
