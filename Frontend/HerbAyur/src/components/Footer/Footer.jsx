import "./Footer.css";
import { Mail, Phone, MapPin } from "lucide-react";

function Footer() {
  return (
    <footer className="footer-sketch-real">

      {/* SHAPE */}
      <div className="footer-top-real">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
          <path
            d="
              M0,120 
              L500,120 
              C560,110 600,60 650,80 
              C700,100 720,140 760,120 
              C820,90 860,60 920,80 
              L1100,100 
              L1440,120 
              L1440,0 
              L0,0 Z
            "
            fill="#f6fbf6"
          />
        </svg>

        {/* ICONS AROUND CENTER (LIKE DRAWING) */}
        <div className="real-icons">
          <span className="ri ginger">🫚</span>
          <span className="ri leaf">🌿</span>
          <span className="ri flower">🌸</span>
           <span className="ri corn">🌾</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="footer-content">
        <div className="footer-col">
          <h2>HerbAyur 🌿</h2>
          <p>Connecting herbal suppliers and buyers in Sri Lanka.</p>

          <div className="footer-socials">
            <span style={{fontSize:"1.4rem",cursor:"pointer"}}>📘</span>
            <span style={{fontSize:"1.4rem",cursor:"pointer"}}>📸</span>
            <span style={{fontSize:"1.4rem",cursor:"pointer"}}>💼</span>
          </div>
        </div>

        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li>Home</li>
            <li>Post Requirement</li>
            <li>Browse</li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Contact</h3>
          <p><MapPin size={16}/> Malabe</p>
          <p><Phone size={16}/> +94 78 3730 114</p>
          <p><Mail size={16}/> support@herbayur.lk</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 HerbAyur
      </div>

    </footer>
  );
}

export default Footer;