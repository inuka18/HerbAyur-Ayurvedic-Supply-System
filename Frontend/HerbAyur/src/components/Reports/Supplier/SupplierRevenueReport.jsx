import { useState, useEffect, useRef } from "react";
import API_BASE from "../../../api";
import { printReport, RptHeader, RptSection, RptStats, badge, inDateRange, getDateRangeLabel } from "../reportUtils";
import "../Reports.css";

export default function SupplierRevenueReport() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ref = useRef();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`${API_BASE}/orders/supplier-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rpt-loading">Loading...</div>;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    const normalizedPayment = o.paymentMethod === "Cash on Delivery" ? "COD" : o.paymentMethod;
    const matchesPayment = paymentFilter === "all" || normalizedPayment === paymentFilter;
    const matchesDate = (!fromDate && !toDate) || inDateRange(o.createdAt, fromDate, toDate);
    return matchesStatus && matchesPayment && matchesDate;
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const delivered    = filteredOrders.filter(o => o.orderStatus === "Delivered").length;
  const processing   = filteredOrders.filter(o => o.orderStatus === "Processing").length;
  const confirmed    = filteredOrders.filter(o => o.orderStatus === "Confirmed").length;
  const cardPay      = filteredOrders.filter(o => o.paymentMethod === "Card").length;
  const codPay       = filteredOrders.filter(o => o.paymentMethod === "Cash on Delivery").length;

  // Revenue by month
  const byMonth = {};
  filteredOrders.forEach(o => {
    const m = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
    byMonth[m] = (byMonth[m] || 0) + o.totalAmount;
  });

  return (
    <div className="rpt-page">
      <div className="rpt-actions">
        <h2 className="rpt-page-title">💰 Revenue & Orders Report</h2>
        <button className="rpt-download-btn" onClick={() => printReport(ref, "Revenue & Orders Report")}>⬇ Download PDF</button>
      </div>
      <div className="rpt-filters">
        <div className="rpt-filter-field">
          <label>Order Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="rpt-filter-field">
          <label>Payment</label>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Card">Card</option>
            <option value="COD">COD</option>
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
        <button className="rpt-filter-reset" onClick={() => { setStatusFilter("all"); setPaymentFilter("all"); setFromDate(""); setToDate(""); }}>
          Reset
        </button>
      </div>
      <div ref={ref}>
        <RptHeader title="Revenue & Orders Report" meta={`Supplier: ${user.name} · Status: ${statusFilter} · Payment: ${paymentFilter} · Date: ${getDateRangeLabel(fromDate, toDate)}`}/>
        <RptSection title="📊 Summary">
          <RptStats stats={[
            { label: "Total Orders",    value: filteredOrders.length },
            { label: "Total Revenue",   value: `Rs ${totalRevenue.toLocaleString()}` },
            { label: "Delivered",       value: delivered },
            { label: "Processing",      value: processing },
            { label: "Confirmed",       value: confirmed },
            { label: "Card Payments",   value: cardPay },
            { label: "COD Payments",    value: codPay },
            { label: "Avg Order Value", value: filteredOrders.length ? `Rs ${Math.round(totalRevenue / filteredOrders.length).toLocaleString()}` : "—" },
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
              {filteredOrders.map((o, i) => (
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
