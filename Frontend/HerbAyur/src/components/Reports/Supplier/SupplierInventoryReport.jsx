import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function SupplierInventoryReport() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockFilter, setStockFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setInventory(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const stockStatus = (qty) => qty === 0 ? "Out of Stock" : qty <= 10 ? "Low Stock" : "In Stock";
  const filteredInventory = inventory.filter((item) => {
    const status = stockStatus(item.quantity);
    const matchesStock = stockFilter === "all" || status === stockFilter;
    const dateValue = item.updatedAt || item.createdAt;
    const matchesDate = (!fromDate && !toDate) || inDateRange(dateValue, fromDate, toDate);
    return matchesStock && matchesDate;
  });

  const inStock = filteredInventory.filter((i) => i.quantity > 10).length;
  const lowStock = filteredInventory.filter((i) => i.quantity > 0 && i.quantity <= 10).length;
  const outStock = filteredInventory.filter((i) => i.quantity === 0).length;
  const totalVal = filteredInventory.reduce((s, i) => s + (i.quantity * (i.price || 0)), 0);

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">📦 Inventory Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Inventory Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Stock Status</label>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
        <div className="rpt-filter-field">
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="rpt-filter-field">
          <label>To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button className="rpt-filter-reset" onClick={() => { setStockFilter("all"); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Inventory Report" meta={`Supplier: ${user.name} · Stock: ${stockFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Items", value: filteredInventory.length },
            { label: "In Stock", value: inStock },
            { label: "Low Stock", value: lowStock },
            { label: "Out of Stock", value: outStock },
            { label: "Total Value", value: `Rs ${totalVal.toLocaleString()}` },
          ]}/>
        </RptSection>
        <RptSection title="📦 Inventory Items">
          <table>
            <thead><tr><th>#</th><th>Item</th><th>Aliases</th><th>Quantity</th><th>Unit</th><th>Price/Unit</th><th>Total Value</th><th>Status</th></tr></thead>
            <tbody>
              {filteredInventory.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
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
