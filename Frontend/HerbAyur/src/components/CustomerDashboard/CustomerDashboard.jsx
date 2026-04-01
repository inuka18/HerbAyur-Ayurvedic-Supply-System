import { useState } from "react";
import SupplierOffers from "../SupplierOffers/SupplierOffers";
import CustomerOrders from "../Orders/CustomerOrders";
import { CustomerReport } from "../Reports/Reports";
import { CustomerPayment } from "../PaymentDashboard/PaymentDashboard";
import "../SupplierDashboard/SupplierDashboard.css";

const TABS = [
  { id: "offers",   label: "🤝 Supplier Offers" },
  { id: "orders",   label: "📦 My Orders" },
  { id: "payments", label: "💳 Payments" },
  { id: "reports",  label: "📊 Reports" },
];

function CustomerDashboard() {
  const [tab, setTab] = useState("offers");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div>
      <div className="sd-header">
        <div className="sd-header-left">
          <span className="sd-header-icon">👤</span>
          <div>
            <h2 className="sd-header-title">Customer Dashboard</h2>
            <p className="sd-header-sub">Welcome back, {user.name || "Customer"}</p>
          </div>
        </div>
        <div className="sd-tabs">
          {TABS.map(t => (
            <button key={t.id} className={tab === t.id ? "sd-tab active" : "sd-tab"} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "offers"   && <SupplierOffers />}
      {tab === "orders"   && <CustomerOrders />}
      {tab === "payments" && <CustomerPayment />}
      {tab === "reports"  && <CustomerReport />}
    </div>
  );
}

export default CustomerDashboard;
