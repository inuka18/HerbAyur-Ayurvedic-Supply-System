import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import API_BASE from "../../api";
import "../Login/Login.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.newPassword.length < 8 || !/[A-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword))
      return setError("Password must be at least 8 characters, include an uppercase letter and a number.");

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setSuccess("Password updated successfully!");
      setForm({ email: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => navigate("/Login"), 1500);
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
          <div className="auth-logo">🔒</div>
          <h2>Reset Password</h2>
          <p>Enter your email and a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label><Mail size={14}/> Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="auth-group">
            <label><ShieldCheck size={14}/> New Password</label>
            <input type="password" name="newPassword" value={form.newPassword}
              onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
          </div>

          <div className="auth-group">
            <label><ShieldCheck size={14}/> Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handleChange} placeholder="••••••••" required />
          </div>

          {error   && <div className="auth-error">⚠ {error}</div>}
          {success && <div className="auth-success">✅ {success}</div>}

          <button className="auth-btn" disabled={loading}>
            <ShieldCheck size={16}/> {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-switch">
          <span style={{ cursor: "pointer", color: "#15803d", fontWeight: 600 }}
            onClick={() => navigate("/Login")}>← Back to Login</span>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
