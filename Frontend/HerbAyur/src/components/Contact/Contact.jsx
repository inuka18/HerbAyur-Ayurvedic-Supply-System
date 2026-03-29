import { useState, useEffect } from "react";
import "./Contact.css";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import API_BASE from "../../api";

function Contact() {
  const [form, setForm]     = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Auto-fill name & email for logged-in users
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data._id) {
          setForm(prev => ({
            ...prev,
            name:  `${data.firstName} ${data.lastName}`,
            email: data.email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm(prev => ({ ...prev, message: "" }));
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="contact-page">

      {/* HERO */}
      <div className="contact-hero">
        <h1>Contact Us 🌿</h1>
        <p>We’d love to hear from you. Get in touch with HerbAyur.</p>
      </div>

      <div className="contact-container">

        {/* LEFT INFO */}
        <div className="contact-info">

          <h2>Get In Touch</h2>
          <p>Connecting Sri Lankan herbal suppliers and buyers with trust.</p>

          <div className="contact-item">
            <MapPin size={18}/>
            <span>Malabe, Sri Lanka</span>
          </div>

          <div className="contact-item">
            <Phone size={18}/>
            <span>+94 78 3730 114</span>
          </div>

          <div className="contact-item">
            <Mail size={18}/>
            <span>support@herbayur.lk</span>
          </div>

        </div>

        {/* RIGHT FORM */}
        <form className="contact-form" onSubmit={handleSubmit}>

          <h2>Send Message</h2>

          <div className="contact-group">
            <label>Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your Name" required />
          </div>

          <div className="contact-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Your Email" required />
          </div>

          <div className="contact-group">
            <label>Message</label>
            <textarea rows="5" name="message" value={form.message} onChange={handleChange} placeholder="Write your message..." required />
          </div>

          <button className="contact-btn" disabled={status === "sending"}>
            <Send size={16}/> {status === "sending" ? "Sending..." : "Send Message"}
          </button>

          {status === "success" && <p className="contact-success">✅ Message sent successfully!</p>}
          {status === "error"   && <p className="contact-error">❌ Failed to send. Please try again.</p>}

        </form>

      </div>

    </div>
  );
}

export default Contact;