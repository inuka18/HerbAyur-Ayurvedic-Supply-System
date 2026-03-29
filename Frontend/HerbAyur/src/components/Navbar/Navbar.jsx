import "./Navbar.css";
import { LogIn, UserPlus, Send, Home, Info, Phone, LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Notifications from "../Notifications/Notifications";

function Navbar() {
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState(0);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const dashPath = user?.role === "admin" ? "/admin" : user?.role === "supplier" ? "/supplier-dashboard" : "/customer-dashboard";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/Login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="pro-navbar">

        {/* LOGO */}
        <div className="pro-nav-left">
          <img src="/images/HerbAyurLogo.png" alt="logo" className="pro-logo"/>
          <h5 style={{ fontSize:"20px", fontWeight:"600", fontFamily:"Poppins, sans-serif", margin:0, display:"flex", alignItems:"center" }}>
            <span style={{ color:"#1b5e20" }}>Herb</span>
            <span style={{ color:"#66bb6a" }}>Ayur</span>
          </h5>
        </div>

        {/* NAV LINKS */}
        <nav className="pro-nav-links">
          {[
            { to:"/",       label:"Home",    icon:<Home size={16}/>,  idx:0 },
            { to:"/About",  label:"About",   icon:<Info size={16}/>,  idx:1 },
            { to:"/Contact",label:"Contact", icon:<Phone size={16}/>, idx:2 },
          ].map(link => (
            <NavLink key={link.to} to={link.to} end={link.to==="/"} onMouseEnter={() => setHoverIndex(link.idx)}
              className={({ isActive }) => isActive ? "pro-nav-item active" : "pro-nav-item"}>
              {link.icon} {link.label}
            </NavLink>
          ))}
          <div className="pro-floating-cluster" style={{ transform:`translateX(${hoverIndex * 120}px)` }}>
            <span className="pro-cluster pro-corn">🌾</span>
            <span className="pro-cluster pro-leaf">🌿</span>
            <span className="pro-cluster pro-ginger">🫚</span>
            <span className="pro-cluster pro-flower">🌸</span>
          </div>
        </nav>

        {/* RIGHT */}
        <div className="pro-nav-right">
          {user ? (
            <>
              <Notifications/>

              {user.role === "customer" && (
                <NavLink to="/RequestForm" className="pro-btn pro-btn-accent">
                  <Send size={16}/> Post Requirement
                </NavLink>
              )}

              {/* PROFILE DROPDOWN */}
              <div className="pro-profile-wrap" ref={dropRef}>
                <button className="pro-profile-btn" onClick={() => setDropOpen(p => !p)}>
                  <div className="pro-avatar">{user.name?.[0]}</div>
                  <span className="pro-user-label">{user.name}</span>
                  <ChevronDown size={14} className={`pro-chevron ${dropOpen ? "open" : ""}`}/>
                </button>

                {dropOpen && (
                  <div className="pro-dropdown">
                    <div className="pro-dropdown-header">
                      <div className="pro-drop-avatar">{user.name?.[0]}</div>
                      <div>
                        <div className="pro-drop-name">{user.name}</div>
                        <div className="pro-drop-role">{user.role}</div>
                      </div>
                    </div>
                    <div className="pro-dropdown-divider"/>
                    <button className="pro-drop-item" onClick={() => { setDropOpen(false); navigate("/profile"); }}>
                      <User size={15}/> My Profile
                    </button>
                    <button className="pro-drop-item" onClick={() => { setDropOpen(false); navigate(dashPath); }}>
                      <LayoutDashboard size={15}/> Dashboard
                    </button>
                    <div className="pro-dropdown-divider"/>
                    <button className="pro-drop-item pro-drop-logout" onClick={handleLogout}>
                      <LogOut size={15}/> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/Login"  className="pro-btn pro-btn-outline"><LogIn size={16}/> Login</NavLink>
              <NavLink to="/Signup" className="pro-btn pro-btn-primary"><UserPlus size={16}/> Sign Up</NavLink>
              <NavLink to="/RequestForm" className="pro-btn pro-btn-accent"><Send size={16}/> Post Requirement</NavLink>
            </>
          )}
        </div>
      </header>

      <div className="pro-navbar-shape">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,40 C200,100 400,0 720,50 C1000,90 1200,20 1440,60 L1440,0 L0,0 Z" className="pro-wave-path"/>
        </svg>
      </div>
    </>
  );
}

export default Navbar;
