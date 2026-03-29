import { useState } from "react";
import SupplierOffers from "../SupplierOffers/SupplierOffers";
import CustomerOrders from "../Orders/CustomerOrders";
import "../SupplierDashboard/SupplierDashboard.css";

function CustomerDashboard() {
  const [tab, setTab] = useState("offers");
  return (
    <div>
      <div className="sd-tabs">
        <button className={tab === "offers" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("offers")}>
          🤝 Supplier Offers
        </button>
        <button className={tab === "orders" ? "sd-tab active" : "sd-tab"} onClick={() => setTab("orders")}>
          📦 My Orders
        </button>
      </div>
      {tab === "offers" ? <SupplierOffers /> : <CustomerOrders />}
    </div>
  );
}

export default CustomerDashboard;
