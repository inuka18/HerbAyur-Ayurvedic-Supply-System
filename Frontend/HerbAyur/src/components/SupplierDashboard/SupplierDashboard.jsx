import { useState } from "react";
import SupplierMarketplace from "../SupplierMarketplace/SupplierMarketplace";
import Inventory from "../Inventory/Inventory";
import SupplierOrders from "../Orders/SupplierOrders";
import SupplierFeedbacks from "../Orders/SupplierFeedbacks";
import { SupplierReport } from "../Reports/Reports";
import { SupplierPayment } from "../PaymentDashboard/PaymentDashboard";
import "./SupplierDashboard.css";

const TABS = [
  { id: "marketplace", label: "🛒 Marketplace" },
  { id: "inventory",   label: "📦 My Inventory" },
  { id: "orders",      label: "💰 Revenue & Orders" },
  { id: "payments",    label: "💳 Payments" },
  { id: "feedbacks",   label: "⭐ Feedbacks" },
  { id: "reports",     label: "📊 Reports" },
];

function SupplierDashboard() {
  const [tab, setTab] = useState("marketplace");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div>
      <div className="sd-header">
        <div className="sd-header-left">
          <span className="sd-header-icon">🏭</span>
          <div>
            <h2 className="sd-header-title">Supplier Dashboard</h2>
            <p className="sd-header-sub">Welcome back, {user.name || "Supplier"}</p>
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

      {tab === "marketplace" && <SupplierMarketplace />}
      {tab === "inventory"   && <Inventory />}
      {tab === "orders"      && <SupplierOrders />}
      {tab === "payments"    && <SupplierPayment />}
      {tab === "feedbacks"   && <SupplierFeedbacks />}
      {tab === "reports"     && <SupplierReport />}
    </div>
  );
}

export default SupplierDashboard;
