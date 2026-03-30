import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge } from "../reportUtils";
import "../Reports.css";

export default function SupplierRevenueReport() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/orders/supplier-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const delivered    = orders.filter(o => o.orderStatus === "Delivered").length;
  const processing   = orders.filter(o => o.orderStatus === "Processing").length;
  const confirmed    = orders.filter(o => o.orderStatus === "Confirmed").length;
  const cardPay      = orders.filter(o => o.paymentMethod === "Card").length;
  const codPay       = orders.filter(o => o.paymentMethod === "Cash on Delivery").length;

  // Revenue by month
  const byMonth = {};
  orders.forEach(o => {
    const m = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
    byMonth[m] = (byMonth[m] || 0) + o.totalAmount;
  });

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">💰 Revenue & Orders Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Revenue & Orders Report")}>⬇ Download PDF</button>
      </div>
      <div ref={ref}>
        <RptHeader title="Revenue & Orders Report" meta={`Supplier: ${user.name}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Orders",    value: orders.length },
            { label: "Total Revenue",   value: `Rs ${totalRevenue.toLocaleString()}` },
            { label: "Delivered",       value: delivered },
            { label: "Processing",      value: processing },
            { label: "Confirmed",       value: confirmed },
            { label: "Card Payments",   value: cardPay },
            { label: "COD Payments",    value: codPay },
            { label: "Avg Order Value", value: orders.length ? `Rs ${Math.round(totalRevenue / orders.length).toLocaleString()}` : "—" },
          ]}/>
        </RptSection>
        {Object.keys(byMonth).length > 0 && (
          <RptSection title="📅 Revenue by Month">
            <table>
              <thead><tr><th>Month</th><th>Revenue</th></tr></thead>
              <tbody>
                {Object.entries(byMonth).map(([m, rev]) => (
                  <tr key={m}><td>{m}</td><td>Rs {rev.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </RptSection>
        )}
        <RptSection title="📋 All Orders">
          <table>
            <thead><tr><th>#</th><th>Receipt</th><th>Customer</th><th>List</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o._id}>
                  <td>{i+1}</td><td>#{o.receiptNo}</td>
                  <td>{o.customerId?.firstName} {o.customerId?.lastName}</td>
                  <td>{o.listName || "—"}</td>
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
        <div className="rpt-footer">HerbAyur · Revenue & Orders Report · {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
