import { useState } from "react";
import SupplierMarketplace from "../SupplierMarketplace/SupplierMarketplace";
import Inventory from "../Inventory/Inventory";
import SupplierOrders from "../Orders/SupplierOrders";
import SupplierFeedbacks from "../Orders/SupplierFeedbacks";
import "./SupplierDashboard.css";

function SupplierDashboard() {
  const [tab, setTab] = useState("marketplace");
  return (
    <div>
      <div className="sd-tabs">
        <button className={tab === "marketplace" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("marketplace")}>
          🛒 Marketplace
        </button>
        <button className={tab === "inventory" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("inventory")}>
          📦 My Inventory
        </button>
        <button className={tab === "orders" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("orders")}>
          💰 Revenue & Orders
        </button>
        <button className={tab === "feedbacks" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("feedbacks")}>
          ⭐ Feedbacks
        </button>
      </div>
      {tab === "marketplace" && <SupplierMarketplace />}
      {tab === "inventory"   && <Inventory />}
      {tab === "orders"      && <SupplierOrders />}
      {tab === "feedbacks"   && <SupplierFeedbacks />}
    </div>
  );
}

export default SupplierDashboard;
