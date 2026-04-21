import { useEffect, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine,
} from "recharts";
import API_BASE from "../../api";
import "./DemandPredictions.css";

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#14b8a6"];

// Fixed-width line chart — avoids ResponsiveContainer issues
function TrendChart({ data, color, unit, predMonth, predQty }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width || 800);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <LineChart width={width} height={240} data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={2} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v, name) => [
            v != null ? `${Number(v).toFixed(2)} ${unit}` : "—",
            name === "actual" ? "Actual Demand" : "Predicted"
          ]}
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "0.82rem" }}
        />
        <Legend formatter={v => v === "actual" ? "Actual Demand" : "Predicted"} />
        {predMonth && (
          <ReferenceLine x={predMonth} stroke="#f59e0b" strokeDasharray="4 4"
            label={{ value: "Forecast", position: "insideTopRight", fontSize: 11, fill: "#f59e0b" }}
          />
        )}
        <Line type="monotone" dataKey="actual" stroke={color} strokeWidth={2.5}
          dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} connectNulls />
        <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2.5}
          strokeDasharray="6 3" dot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
          connectNulls />
      </LineChart>
    </div>
  );
}

export default function DemandPredictions({ supplierId = null }) {
  const [predictions, setPredictions] = useState([]);
  const [trendData, setTrendData]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterMat, setFilterMat]     = useState("All");
  const [view, setView]               = useState("chart");

  const fetchPredictions = () => {
    if (supplierId === undefined) return;
    setLoading(true);
    const url = supplierId
      ? `${API_BASE}/predictions?supplierId=${supplierId}`
      : `${API_BASE}/predictions`;
    fetch(url)
      .then(r => r.json())
      .then(data => setPredictions(Array.isArray(data) ? data : []))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  };

  const fetchTrend = () => {
    if (!supplierId) return;
    fetch(`${API_BASE}/predictions/trend?supplierId=${supplierId}`)
      .then(r => r.json())
      .then(data => setTrendData(Array.isArray(data) ? data : []))
      .catch(() => setTrendData([]));
  };

  useEffect(() => {
    fetchPredictions();
    fetchTrend();
  }, [supplierId]);

  const materials = ["All", ...Array.from(new Set(predictions.map(p => p.material_name))).sort()];

  const filtered = predictions.filter(p => {
    const matchMat    = filterMat === "All" || p.material_name === filterMat;
    const matchSearch = !search ||
      p.material_name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_id.toLowerCase().includes(search.toLowerCase());
    return matchMat && matchSearch;
  });

  const totalQty  = filtered.reduce((s, p) => s + p.predicted_quantity, 0);
  const topMat    = filtered.length > 0
    ? filtered.reduce((a, b) => a.predicted_quantity > b.predicted_quantity ? a : b).material_name
    : "—";
  const predMonth = predictions[0]?.prediction_month || "—";
  const updatedAt = predictions[0]?.created_at
    ? new Date(predictions[0].created_at).toLocaleString() : "—";
  const maxQty = filtered.length > 0
    ? Math.max(...filtered.map(p => p.predicted_quantity)) : 1;

  if (loading) return <div className="pred-state">Loading predictions...</div>;
  if (!predictions.length) return (
    <div className="pred-state">
      No predictions available yet.<br />
      <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Run the ML pipeline first: <code>python pipeline.py</code>
      </span>
    </div>
  );

  return (
    <div className="pred-wrap">

      {/* STAT CARDS */}
      <div className="pred-stats">
        <div className="pred-stat-card" style={{ borderLeftColor: "#22c55e" }}>
          <div className="pred-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>📅</div>
          <div>
            <div className="pred-stat-val">{predMonth}</div>
            <div className="pred-stat-label">Prediction Month</div>
          </div>
        </div>
        <div className="pred-stat-card" style={{ borderLeftColor: "#3b82f6" }}>
          <div className="pred-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>📦</div>
          <div>
            <div className="pred-stat-val">{filtered.length}</div>
            <div className="pred-stat-label">Materials Predicted</div>
          </div>
        </div>
        <div className="pred-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="pred-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>⚖️</div>
          <div>
            <div className="pred-stat-val">{totalQty.toFixed(1)}</div>
            <div className="pred-stat-label">Total Predicted Demand</div>
          </div>
        </div>
        <div className="pred-stat-card" style={{ borderLeftColor: "#8b5cf6" }}>
          <div className="pred-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>🌿</div>
          <div>
            <div className="pred-stat-val">{topMat}</div>
            <div className="pred-stat-label">Highest Demand Material</div>
          </div>
        </div>
      </div>

      {/* LAST UPDATED */}
      <div className="pred-updated">
        Last updated: {updatedAt}
      </div>

      {/* TOOLBAR */}
      <div className="pred-toolbar">
        <input className="pred-search" placeholder="Search material..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="pred-select" value={filterMat} onChange={e => setFilterMat(e.target.value)}>
          {materials.map(m => <option key={m}>{m}</option>)}
        </select>
        <div className="pred-view-toggle">
          <button className={view === "chart" ? "active" : ""} onClick={() => setView("chart")}>📊 Chart</button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>📋 Table</button>
        </div>
        <a className="pred-download-btn"
          href={`${API_BASE}/predictions/dataset/download`}
          download="herbayur_raw_dataset.csv">
          ⬇ Download Dataset
        </a>
      </div>

      {/* CHART VIEW */}
      {view === "chart" && (
        <>
          {trendData.length === 0 && (
            <div className="pred-state" style={{ margin: "1rem 0", fontSize: "0.85rem", color: "#9ca3af" }}>
              📊 Historical trend data not available. Showing prediction summary only.
            </div>
          )}
          {trendData
            .filter(mat => filterMat === "All" || mat.material === filterMat)
            .map((mat, idx) => {
              const predRow = predictions.find(
                p => p.material_name === mat.material &&
                     p.category      === mat.category &&
                     p.condition     === mat.condition &&
                     p.parts         === mat.parts
              );
              const chartRows = mat.data.map(d => ({ month: d.month, actual: d.qty }));
              if (predRow) {
                chartRows.push({ month: predRow.prediction_month, predicted: predRow.predicted_quantity });
              }
              const color = COLORS[idx % COLORS.length];
              const unit  = predRow?.unit || "kg";

              return (
                <div key={idx} className="pred-chart-card" style={{ marginBottom: "1.2rem" }}>
                  <div className="pred-chart-card-header">
                    <div className="pred-chart-dot" style={{ background: color }} />
                    <h3>{mat.label}</h3>
                    <span className="pred-chart-unit-tag">{unit}</span>
                    {predRow && (
                      <span className="pred-chart-pred-tag">
                        Next month: <strong>{predRow.predicted_quantity.toFixed(2)} {unit}</strong>
                      </span>
                    )}
                  </div>
                  <TrendChart
                    data={chartRows}
                    color={color}
                    unit={unit}
                    predMonth={predRow?.prediction_month}
                    predQty={predRow?.predicted_quantity}
                  />
                </div>
              );
            })}

          {/* Material Summary Cards */}
          <div className="pred-cards-grid">
            {filtered
              .sort((a, b) => b.predicted_quantity - a.predicted_quantity)
              .map((p, i) => (
              <div key={p._id || i} className="pred-material-card">
                <div className="pred-card-header">
                  <span className="pred-card-icon" style={{ background: COLORS[i % COLORS.length] + "22", color: COLORS[i % COLORS.length] }}>
                    🌿
                  </span>
                  <div className="pred-card-title">{p.material_name}</div>
                </div>
                <div className="pred-card-body">
                  <div className="pred-card-qty">
                    <span className="pred-card-qty-val">{p.predicted_quantity.toFixed(2)}</span>
                    <span className="pred-card-qty-unit">{p.unit || "kg"}</span>
                  </div>
                  <div className="pred-card-meta">
                    <div className="pred-card-meta-row">
                      <span className="pred-card-meta-label">Category:</span>
                      <span className="pred-card-meta-val">{p.category || "—"}</span>
                    </div>
                    <div className="pred-card-meta-row">
                      <span className="pred-card-meta-label">Condition:</span>
                      <span className="pred-card-meta-val">{p.condition || "—"}</span>
                    </div>
                    <div className="pred-card-meta-row">
                      <span className="pred-card-meta-label">Parts:</span>
                      <span className="pred-card-meta-val">{p.parts || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="pred-card-footer">
                  <div className="pred-card-progress">
                    <div className="pred-card-progress-bar"
                      style={{ width: `${(p.predicted_quantity / maxQty) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="pred-card-percent">{((p.predicted_quantity / totalQty) * 100).toFixed(1)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="pred-table-wrap">
          <table className="pred-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Parts</th>
                <th>Predicted Qty</th>
                <th>Unit</th>
                <th>Prediction Month</th>
                <th>Generated At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No results.</td></tr>
              ) : filtered
                  .sort((a, b) => b.predicted_quantity - a.predicted_quantity)
                  .map((p, i) => (
                <tr key={p._id || i}>
                  <td>{i + 1}</td>
                  <td><span className="pred-mat-badge">{p.material_name}</span></td>
                  <td><span className="pred-cat-badge">{p.category || "—"}</span></td>
                  <td>{p.condition || "—"}</td>
                  <td>{p.parts || "—"}</td>
                  <td>
                    <div className="pred-qty-bar-wrap">
                      <div className="pred-qty-bar"
                        style={{ width: `${Math.min((p.predicted_quantity / maxQty) * 100, 100)}%` }} />
                      <span>{p.predicted_quantity.toFixed(2)}</span>
                    </div>
                  </td>
                  <td><span className="pred-unit-badge">{p.unit || "kg"}</span></td>
                  <td>{p.prediction_month}</td>
                  <td style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                    {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
