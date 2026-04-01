import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function CustomerOrderReport() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const totalSpent = orders.reduce((s, o) => s + o.totalAmount, 0);
  const delivered  = orders.filter(o => o.orderStatus === "Delivered").length;
  const processing = orders.filter(o => o.orderStatus === "Processing").length;
  const confirmed  = orders.filter(o => o.orderStatus === "Confirmed").length;
  const cardPay    = orders.filter(o => o.paymentMethod === "Card").length;
  const codPay     = orders.filter(o => o.paymentMethod === "Cash on Delivery").length;

  // Group by list
  const groups = {};
  orders.forEach(o => {
    const k = o.listName || "Other Orders";
    if (!groups[k]) groups[k] = [];
    groups[k].push(o);
  });

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">🛒 Order & Payment Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Order & Payment Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Order & Payment Report" meta={`Customer: ${user.name}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Orders",   value: orders.length },
            { label: "Total Spent",    value: `Rs ${totalSpent.toLocaleString()}` },
            { label: "Delivered",      value: delivered },
            { label: "Processing",     value: processing },
            { label: "Confirmed",      value: confirmed },
            { label: "Card Payments",  value: cardPay },
            { label: "COD Payments",   value: codPay },
          ]}/>
        </RptSection>
        {Object.entries(groups).map(([listName, listOrders]) => (
          <RptSection key={listName} title={`📋 ${listName} (${listOrders.length} order${listOrders.length > 1 ? "s" : ""})`}>
            <table>
              <thead><tr><th>#</th><th>Receipt</th><th>Supplier</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {listOrders.map((o, i) => (
                  <tr key={o._id}>
                    <td>{i+1}</td><td>#{o.receiptNo}</td>
                    <td>{o.supplierName}</td>
                    <td>{o.items.map(it => `${it.name} ×${it.supplyQty}${it.unit}`).join(", ")}</td>
                    <td>Rs {o.totalAmount.toLocaleString()}</td>
                    <td>{o.paymentMethod === "Cash on Delivery" ? "COD" : o.paymentMethod}</td>
                    <td><span className={`badge ${badge(o.orderStatus)}`}>{o.orderStatus}</span></td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RptSection>
        ))}
        <div className="rpt-footer">HerbAyur · Order & Payment Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
