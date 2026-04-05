import { useState, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { UserPlus, User, Phone, MapPin, Mail, Lock, Building2, FileText } from "lucide-react";
import API_BASE from "../../api";
import "../Login/Login.css";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole]       = useState("customer");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("role") === "supplier") setRole("supplier");
  }, [location.search]);
  const [certFile, setCertFile] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    phone: "", address: "", companyName: "",
  });

  const [fieldErrors, setFieldErrors] = useState({ email: "", companyName: "" });

  const checkAvailability = async (field, value) => {
    if (!value) return;
    const res = await fetch(`${API_BASE}/auth/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).then(r => r.json()).catch(() => ({ available: true }));
    setFieldErrors(prev => ({
      ...prev,
      [field]: res.available ? "" : field === "email" ? "Email is already registered." : "Company name is already taken.",
    }));
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    if (fieldErrors.email || fieldErrors.companyName) {
      setError("Please fix the errors above before submitting.");
      return false;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      setError("Contact number must be 10 digits and start with 0.");
      return false;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError("Password must be at least 8 characters, include an uppercase letter and a number.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter first name" required onKeyDown={e => { if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }} />
            </div>
            <div className="auth-group">
              <label><User size={14}/> Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter last name" required onKeyDown={e => { if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }} />
            </div>
          </div>

          <div className="auth-group">
            <label><Mail size={14}/> Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={e => checkAvailability("email", e.target.value)} placeholder="you@example.com" required />
            {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-group">
            <label><Lock size={14}/> Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number" required minLength={8} />
          </div>

          <div className="auth-group">
            <label><Phone size={14}/> Contact Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="07XXXXXXXX" required maxLength={10} inputMode="numeric" onKeyDown={e => { if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }} />
          </div>

          <div className="auth-group">
            <label><MapPin size={14}/> Address</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address" required />
          </div>

          {/* SUPPLIER EXTRA FIELDS */}
          {role === "supplier" && (
            <div className="supplier-extra">
              <div className="auth-group">
                <label><Building2 size={14}/> Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} onBlur={e => checkAvailability("companyName", e.target.value)} placeholder="Your Company Pvt Ltd" required />
                {fieldErrors.companyName && <span className="auth-field-error">{fieldErrors.companyName}</span>}
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
