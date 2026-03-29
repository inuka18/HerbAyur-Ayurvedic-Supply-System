import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { UserPlus, User, Phone, MapPin, Mail, Lock, Building2, FileText } from "lucide-react";
import API_BASE from "../../api";
import "../Login/Login.css";

function Signup() {
  const navigate = useNavigate();
  const [role, setRole]       = useState("customer");
  const [certFile, setCertFile] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    phone: "", address: "", companyName: "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append("role", role);
    if (role === "supplier" && certFile) data.append("certification", certFile);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-bg-icons">
        <span>🌿</span><span>🌸</span><span>🌾</span><span>🫚</span>
      </div>
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ color: "#166534", marginBottom: "0.5rem" }}>
          {role === "supplier" ? "Registration Submitted!" : "Account Created!"}
        </h2>
        {role === "supplier"
          ? <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Your supplier account is pending admin approval. You'll be notified once reviewed.</p>
          : <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Your account is ready. You can now log in.</p>
        }
        <button className="auth-btn" onClick={() => navigate("/Login")}>
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-bg-icons">
        <span>🌿</span><span>🌸</span><span>🌾</span><span>🫚</span>
      </div>

      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-card-header">
          <div className="auth-logo">🌱</div>
          <h2>Create Account</h2>
          <p>Join the HerbAyur community</p>
        </div>

        {/* ROLE SELECTOR */}
        <div className="auth-group" style={{ marginBottom: "1.2rem" }}>
          <label>Register as</label>
          <div className="role-options">
            <label className={`role-option ${role === "customer" ? "selected" : ""}`}>
              <input type="radio" value="customer" checked={role === "customer"} onChange={() => setRole("customer")} />
              👤 Customer
            </label>
            <label className={`role-option ${role === "supplier" ? "selected" : ""}`}>
              <input type="radio" value="supplier" checked={role === "supplier"} onChange={() => setRole("supplier")} />
              🏭 Supplier
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* NAME ROW */}
          <div className="auth-row">
            <div className="auth-group">
              <label><User size={14}/> First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Renuka" required />
            </div>
            <div className="auth-group">
              <label><User size={14}/> Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Jeevani" required />
            </div>
          </div>

          <div className="auth-group">
            <label><Mail size={14}/> Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="auth-group">
            <label><Lock size={14}/> Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required minLength={6} />
          </div>

          <div className="auth-group">
            <label><Phone size={14}/> Contact Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+94 77 XXX XXXX" required />
          </div>

          <div className="auth-group">
            <label><MapPin size={14}/> Address</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Galkanda, Sri Lanka" required />
          </div>

          {/* SUPPLIER EXTRA FIELDS */}
          {role === "supplier" && (
            <div className="supplier-extra">
              <div className="auth-group">
                <label><Building2 size={14}/> Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Your Company Pvt Ltd" required />
              </div>

              <div className="file-upload-label">
                <span><FileText size={14}/> Business Certification (PDF, JPEG, PNG, DOC)</span>
                <label className="file-upload-box">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setCertFile(e.target.files[0])} />
                  {certFile
                    ? <span className="file-name">📄 {certFile.name}</span>
                    : <span>Click to upload PDF, JPEG, PNG or DOC</span>
                  }
                </label>
              </div>

              <div className="pending-note">
                ⏳ Supplier accounts require admin approval before login.
              </div>
            </div>
          )}

          {error && <div className="auth-error">⚠ {error}</div>}

          <button className="auth-btn" disabled={loading}>
            <UserPlus size={16}/> {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <NavLink to="/Login">Sign In</NavLink>
        </p>
      </div>
    </div>
  );
}

export default Signup;
