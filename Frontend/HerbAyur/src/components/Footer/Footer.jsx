import "./Footer.css";
import { Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();
  const goToTop = (path) => {
    navigate(path);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  };

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
            <span className="footer-social-icon" aria-label="Facebook">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5.03 3.66 9.2 8.44 9.93v-7.03H7.9V12.1h2.54V9.91c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.24 0-1.63.78-1.63 1.57v1.86h2.78l-.45 2.87h-2.33V22c4.78-.73 8.43-4.9 8.43-9.93z"/>
              </svg>
            </span>
            <span className="footer-social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.9A3.85 3.85 0 0 0 3.9 7.75v8.5a3.85 3.85 0 0 0 3.85 3.85h8.5a3.85 3.85 0 0 0 3.85-3.85v-8.5a3.85 3.85 0 0 0-3.85-3.85h-8.5zm8.9 1.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.9A3.1 3.1 0 1 0 12 15.1 3.1 3.1 0 0 0 12 8.9z"/>
              </svg>
            </span>
            <span className="footer-social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3a1.97 1.97 0 1 0 0 3.94A1.97 1.97 0 0 0 5.25 3zM20.44 13.57c0-3.37-1.8-4.94-4.2-4.94-1.93 0-2.8 1.06-3.28 1.81V8.5H9.58V20h3.38v-5.7c0-1.5.28-2.94 2.14-2.94 1.84 0 1.87 1.72 1.87 3.03V20h3.37v-6.43z"/>
              </svg>
            </span>
          </div>
        </div>

        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li onClick={() => goToTop("/")}>Home</li>
            <li onClick={() => goToTop("/RequestForm")}>Post Requirement</li>
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
