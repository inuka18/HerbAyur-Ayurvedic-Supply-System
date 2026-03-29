import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Mail, Building2, Edit2, Trash2, Check, X, FileText } from "lucide-react";
import API_BASE from "../../api";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [certFile, setCertFile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProfile(data); setForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone, address: data.address, companyName: data.companyName || "" }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (certFile) fd.append("certification", certFile);

      const res  = await fetch(`${API_BASE}/auth/profile`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setProfile(data);
      setEditing(false);
      setSuccess(data.role === "supplier"
        ? "Profile changes submitted! Awaiting admin approval."
        : "Profile updated successfully!");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE}/auth/profile`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch { setError("Failed to delete account."); }
  };

  if (loading) return <div className="prof-page"><p className="prof-loading">Loading profile...</p></div>;
  if (!profile) return <div className="prof-page"><p>Profile not found.</p></div>;

  return (
    <div className="prof-page">
      <div className="prof-card">
        <div className="prof-avatar">{profile.firstName?.[0]}{profile.lastName?.[0]}</div>
        <div className="prof-role-badge">
          {profile.role === "admin" ? "🌿 Admin" : profile.role === "supplier" ? "🏭 Supplier" : "👤 Customer"}
        </div>
        {profile.role === "supplier" && (
          <span className={`prof-status prof-status-${profile.status}`}>{profile.status}</span>
        )}

        {success && <div className="prof-success">✅ {success}</div>}
        {error   && <div className="prof-error">⚠ {error}</div>}

        <div className="prof-fields">
          {editing ? (
            <>
              <div className="prof-row">
                <div className="prof-field"><label>First Name</label><input value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))}/></div>
                <div className="prof-field"><label>Last Name</label><input value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))}/></div>
              </div>
              <div className="prof-field"><label><Phone size={13}/> Phone</label><input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}/></div>
              <div className="prof-field"><label><MapPin size={13}/> Address</label><input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))}/></div>
              {profile.role === "supplier" && (
                <>
                  <div className="prof-field"><label><Building2 size={13}/> Company Name</label><input value={form.companyName} onChange={e => setForm(p => ({...p, companyName: e.target.value}))}/></div>
                  <div className="prof-field">
                    <label><FileText size={13}/> Update Certification</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setCertFile(e.target.files[0])}/>
                    {certFile && <span className="prof-filename">📄 {certFile.name}</span>}
                  </div>
                  <div className="prof-note">⚠ Editing your profile will require admin re-approval.</div>
                </>
              )}
              <div className="prof-actions">
                <button className="prof-save-btn" onClick={handleSave} disabled={saving}><Check size={15}/> {saving ? "Saving..." : "Save"}</button>
                <button className="prof-cancel-btn" onClick={() => setEditing(false)}><X size={15}/> Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="prof-info-row"><User size={15}/><span>{profile.firstName} {profile.lastName}</span></div>
              <div className="prof-info-row"><Mail size={15}/><span>{profile.email}</span></div>
              <div className="prof-info-row"><Phone size={15}/><span>{profile.phone}</span></div>
              <div className="prof-info-row"><MapPin size={15}/><span>{profile.address}</span></div>
              {profile.companyName && <div className="prof-info-row"><Building2 size={15}/><span>{profile.companyName}</span></div>}
              {profile.certificationUrl && (
                <div className="prof-info-row"><FileText size={15}/>
                  <a href={`http://localhost:5000${profile.certificationUrl}`} target="_blank" rel="noreferrer" className="prof-cert-link">View Certification</a>
                </div>
              )}
              <div className="prof-actions">
                <button className="prof-edit-btn" onClick={() => { setEditing(true); setSuccess(""); setError(""); }}><Edit2 size={15}/> Edit Profile</button>
                {profile.role !== "admin" && (
                  <button className="prof-delete-btn" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete Account</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="prof-overlay">
          <div className="prof-confirm-modal">
            <h3>⚠ Delete Account</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="prof-actions">
              <button className="prof-delete-btn" onClick={handleDelete}>Yes, Delete</button>
              <button className="prof-cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
