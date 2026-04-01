import { useState } from "react";
import "./Reports.css";

// Admin reports
import AdminSupplierReport from "./Admin/AdminSupplierReport";
import AdminCustomerReport from "./Admin/AdminCustomerReport";
import AdminRequestReport  from "./Admin/AdminRequestReport";
import AdminMessageReport  from "./Admin/AdminMessageReport";

// Supplier reports
import SupplierRevenueReport   from "./Supplier/SupplierRevenueReport";
import SupplierFeedbackReport  from "./Supplier/SupplierFeedbackReport";
import SupplierInventoryReport from "./Supplier/SupplierInventoryReport";
import SupplierOfferReport     from "./Supplier/SupplierOfferReport";

// Customer reports
import CustomerOrderReport   from "./Customer/CustomerOrderReport";
import CustomerRequestReport from "./Customer/CustomerRequestReport";

// ── ADMIN ─────────────────────────────────────────────────────
const ADMIN_TABS = [
  { id: "suppliers", label: "🏭 Supplier Management",     component: <AdminSupplierReport/> },
  { id: "customers", label: "👤 Customer Management",     component: <AdminCustomerReport/> },
  { id: "requests",  label: "📋 Requirement Requests",    component: <AdminRequestReport/> },
  { id: "messages",  label: "✉️ Messages",                component: <AdminMessageReport/> },
];

export function AdminReport() {
  const [tab, setTab] = useState("suppliers");
  const active = ADMIN_TABS.find(t => t.id === tab);
  return (
    <div className="rpt-hub">
      <h2 className="rpt-hub-title">📊 Reports</h2>
      <div className="rpt-sub-tabs">
        {ADMIN_TABS.map(t => (
          <button key={t.id} className={`rpt-sub-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="rpt-tab-content">{active?.component}</div>
    </div>
  );
}

// ── SUPPLIER ──────────────────────────────────────────────────
const SUPPLIER_TABS = [
  { id: "revenue",   label: "💰 Revenue & Orders", component: <SupplierRevenueReport/> },
  { id: "offers",    label: "📨 Offers",            component: <SupplierOfferReport/> },
  { id: "inventory", label: "📦 Inventory",         component: <SupplierInventoryReport/> },
  { id: "feedback",  label: "⭐ Feedback",           component: <SupplierFeedbackReport/> },
];

export function SupplierReport() {
  const [tab, setTab] = useState("revenue");
  const active = SUPPLIER_TABS.find(t => t.id === tab);
  return (
    <div className="rpt-hub">
      <h2 className="rpt-hub-title">📊 Reports</h2>
      <div className="rpt-sub-tabs">
        {SUPPLIER_TABS.map(t => (
          <button key={t.id} className={`rpt-sub-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="rpt-tab-content">{active?.component}</div>
    </div>
  );
}

// ── CUSTOMER ──────────────────────────────────────────────────
const CUSTOMER_TABS = [
  { id: "orders",   label: "🛒 Orders & Payments",     component: <CustomerOrderReport/> },
  { id: "requests", label: "📋 Requirement Requests",  component: <CustomerRequestReport/> },
];

export function CustomerReport() {
  const [tab, setTab] = useState("orders");
  const active = CUSTOMER_TABS.find(t => t.id === tab);
  return (
    <div className="rpt-hub">
      <h2 className="rpt-hub-title">📊 Reports</h2>
      <div className="rpt-sub-tabs">
        {CUSTOMER_TABS.map(t => (
          <button key={t.id} className={`rpt-sub-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="rpt-tab-content">{active?.component}</div>
    </div>
  );
}
