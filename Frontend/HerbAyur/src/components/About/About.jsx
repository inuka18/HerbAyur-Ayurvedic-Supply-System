import "./About.css";
import {
  Leaf,
  Users,
  ShieldCheck,
  Globe
} from "lucide-react";

function About() {
  return (
    <div className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <img src="/images/HerbAyurLogo_transparent.png" alt="logo" className="about-logo" />
        <h1>About HerbAyur 🌿</h1>
        <p>Connecting Sri Lankan herbal suppliers and buyers with trust and efficiency.</p>
      </section>

      {/* CONTENT */}
      <section className="about-container">

        {/* LEFT TEXT */}
        <div className="about-text">
          <h2>Who We Are</h2>
          <p>
            HerbAyur is a digital platform designed to bridge the gap between 
            herbal raw material suppliers and buyers across Sri Lanka. We aim to 
            simplify sourcing, ensure quality, and build trust in the herbal industry.
          </p>

          <h2>Our Mission</h2>
          <p>
            To create a reliable and transparent marketplace where herbal products 
            can be exchanged efficiently, empowering local farmers and businesses.
          </p>
        </div>

        {/* RIGHT FEATURES */}
        <div className="about-features">

          <div className="about-card">
            <Leaf size={28}/>
            <h3>Natural & Authentic</h3>
            <p>We promote genuine herbal materials sourced responsibly.</p>
          </div>

          <div className="about-card">
            <Users size={28}/>
            <h3>Trusted Network</h3>
            <p>Connecting verified buyers and suppliers across Sri Lanka.</p>
          </div>

          <div className="about-card">
            <ShieldCheck size={28}/>
            <h3>Secure Platform</h3>
            <p>Your data and transactions are safe and protected.</p>
          </div>

          <div className="about-card">
            <Globe size={28}/>
            <h3>Growing Community</h3>
            <p>Expanding herbal trade opportunities globally.</p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default About;