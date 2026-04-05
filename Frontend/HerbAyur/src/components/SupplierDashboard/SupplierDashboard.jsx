import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SupplierMarketplace from "../SupplierMarketplace/SupplierMarketplace";
import Inventory from "../Inventory/Inventory";
import SupplierOrders from "../Orders/SupplierOrders";
import SupplierFeedbacks from "../Orders/SupplierFeedbacks";
import { SupplierReport } from "../Reports/Reports";
import { SupplierPayment } from "../PaymentDashboard/PaymentDashboard";
import API_BASE from "../../api";
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
  const location = useLocation();
  const [tab, setTab]         = useState(location.state?.tab || "marketplace");

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);
  const [profile, setProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setProfile(d))
      .catch(() => {});
  }, []);

  const isPending = profile?.status === "pending";

  if (isPending) {
    return (
      <div className="sd-locked-wrap">
        <div className="sd-locked-card">
          <div className="sd-locked-icon">⏳</div>
          <h2>Account Pending Approval</h2>
          <p>Your company name change is awaiting admin review. You cannot access the supplier dashboard until your changes are approved.</p>
          <p className="sd-locked-sub">You will be notified once the admin reviews your submission.</p>
        </div>
      </div>
    );
  }

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
