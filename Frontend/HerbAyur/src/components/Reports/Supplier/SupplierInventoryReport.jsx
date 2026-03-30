import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function SupplierInventoryReport() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setInventory(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const inStock  = inventory.filter(i => i.quantity > 10).length;
  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= 10).length;
  const outStock = inventory.filter(i => i.quantity === 0).length;
  const totalVal = inventory.reduce((s, i) => s + (i.quantity * (i.price || 0)), 0);

  const stockStatus = (qty) => qty === 0 ? "Out of Stock" : qty <= 10 ? "Low Stock" : "In Stock";

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">📦 Inventory Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Inventory Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Inventory Report" meta={`Supplier: ${user.name}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Items",    value: inventory.length },
            { label: "In Stock",       value: inStock },
            { label: "Low Stock",      value: lowStock },
            { label: "Out of Stock",   value: outStock },
            { label: "Total Value",    value: `Rs ${totalVal.toLocaleString()}` },
          ]}/>
        </RptSection>
        <RptSection title="📦 Inventory Items">
          <table>
            <thead><tr><th>#</th><th>Item</th><th>Aliases</th><th>Quantity</th><th>Unit</th><th>Price/Unit</th><th>Total Value</th><th>Status</th></tr></thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={item._id}>
                  <td>{i+1}</td>
                  <td>{item.name}</td>
                  <td>{(item.aliases || []).join(", ") || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>Rs {item.price || 0}</td>
                  <td>Rs {((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
                  <td><span className={`badge ${badge(stockStatus(item.quantity))}`}>{stockStatus(item.quantity)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </RptSection>
        <div className="rpt-footer">HerbAyur · Inventory Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
