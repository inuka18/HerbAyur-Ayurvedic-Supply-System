import { useState } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { LogIn, Mail, Lock } from "lucide-react";
import API_BASE from "../../api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));

      if (data.user.role === "admin")         navigate("/admin");
      else if (data.user.role === "supplier")  navigate("/supplier-dashboard");
      else                                     navigate("/customer-dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-icons">
        <span>🌿</span><span>🌸</span><span>🌾</span><span>🫚</span>
      </div>

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🌿</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your HerbAyur account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label><Mail size={14}/> Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="auth-group">
            <label><Lock size={14}/> Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required />
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button className="auth-btn" disabled={loading}>
            <LogIn size={16}/> {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <NavLink to="/Signup">Sign Up</NavLink>
        </p>
        <p className="auth-switch">
          <Link to="/reset-password">Reset Password</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
