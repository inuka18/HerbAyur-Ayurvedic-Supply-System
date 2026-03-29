import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./components/Home/Home";
import RequestForm from "./components/RequestForm/RequestForm";
import Contact from "./components/Contact/Contact";
import About from "./components/About/About";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import SupplierMarketplace from "./components/SupplierMarketplace/SupplierMarketplace";
import SupplierConfirmation from "./components/SupplierConfirmation/SupplierConfirmation";
import SupplierOffers from "./components/SupplierOffers/SupplierOffers";
import CustomerDashboard from "./components/CustomerDashboard/CustomerDashboard";
import SupplierDashboard from "./components/SupplierDashboard/SupplierDashboard";
import Inventory from "./components/Inventory/Inventory";
import Payment from "./components/Payment/Payment";
import Profile from "./components/Profile/Profile";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/RequestForm" element={<RequestForm />} />
        <Route path="/Contact"     element={<Contact />} />
        <Route path="/About"       element={<About />} />
        <Route path="/admin"       element={<AdminDashboard />} />
        <Route path="/Login"       element={<Login />} />
        <Route path="/Signup"      element={<Signup />} />
        <Route path="/reset-password"        element={<ResetPassword />} />
        <Route path="/SupplierMarketplace"    element={<SupplierMarketplace />} />
        <Route path="/SupplierConfirmation"   element={<SupplierConfirmation />} />
        <Route path="/SupplierOffers"         element={<SupplierOffers />} />
        <Route path="/customer-dashboard"     element={<CustomerDashboard />} />
        <Route path="/supplier-dashboard"     element={<SupplierDashboard />} />
        <Route path="/inventory"              element={<Inventory />} />
        <Route path="/payment"                element={<Payment />} />
        <Route path="/profile"                element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
