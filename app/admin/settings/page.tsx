"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();

  // Profile form
  const [profile, setProfile] = useState({
    name: (session?.user?.name) || "",
    email: (session?.user?.email) || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // New admin form
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);

    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setProfileMsg({ type: "err", text: "New passwords do not match" });
      return;
    }

    setProfileLoading(true);
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        email: profile.email,
        currentPassword: profile.currentPassword || undefined,
        newPassword: profile.newPassword || undefined,
      }),
    });
    const data = await res.json();
    setProfileLoading(false);

    if (!res.ok) {
      setProfileMsg({ type: "err", text: data.error || "Update failed" });
    } else {
      setProfileMsg({ type: "ok", text: "✅ Profile updated successfully! Please login again if you changed email/password." });
      setProfile((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      await update(); // refresh session
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminMsg(null);
    setAdminLoading(true);

    const res = await fetch("/api/admin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdmin),
    });
    const data = await res.json();
    setAdminLoading(false);

    if (!res.ok) {
      setAdminMsg({ type: "err", text: data.error || "Failed to add admin" });
    } else {
      setAdminMsg({ type: "ok", text: `✅ Admin "${newAdmin.name}" added successfully!` });
      setNewAdmin({ name: "", email: "", password: "" });
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Admin Settings</h1>
          <p className="page-subtitle">Apna email, password change karein aur naye admin add karein</p>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* LEFT — Profile Update */}
          <div>
            <form onSubmit={handleProfileSave}>
              <div className="form-section" style={{ margin: 0 }}>
                <div className="form-section-title">👤 Apna Profile Update Karein</div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Full Name</label>
                  <input
                    className="input-field"
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div style={{
                  margin: "1.25rem 0 0.75rem",
                  padding: "0.75rem",
                  background: "rgba(200,167,80,0.05)",
                  border: "1px solid rgba(200,167,80,0.15)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "#8899aa",
                }}>
                  🔑 <strong style={{ color: "#c8a750" }}>Password Change</strong> — Sirf tab bharein jab password change karna ho
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={profile.currentPassword}
                    onChange={(e) => setProfile(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Purana password dalein"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={profile.newPassword}
                      onChange={(e) => setProfile(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="Naya password"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={profile.confirmPassword}
                      onChange={(e) => setProfile(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Dobara dalein"
                      minLength={6}
                    />
                  </div>
                </div>

                {profileMsg && (
                  <div style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    background: profileMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${profileMsg.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: profileMsg.type === "ok" ? "#22c55e" : "#ef4444",
                    fontSize: "0.85rem",
                  }}>
                    {profileMsg.text}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={profileLoading} style={{ width: "100%" }}>
                  {profileLoading ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT — Add New Admin */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <form onSubmit={handleAddAdmin}>
              <div className="form-section" style={{ margin: 0 }}>
                <div className="form-section-title">➕ Naya Admin Add Karein</div>
                <p style={{ fontSize: "0.82rem", color: "#8899aa", marginBottom: "1rem", lineHeight: 1.5 }}>
                  Naya admin wahi kuch kar sakta hai jo aap kar sakte hain — agents manage, properties dekhna, backup lena.
                </p>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Full Name *</label>
                  <input
                    className="input-field"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin(p => ({ ...p, name: e.target.value }))}
                    placeholder="Admin ka naam"
                    required
                  />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                {adminMsg && (
                  <div style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    background: adminMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${adminMsg.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: adminMsg.type === "ok" ? "#22c55e" : "#ef4444",
                    fontSize: "0.85rem",
                  }}>
                    {adminMsg.text}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={adminLoading} style={{ width: "100%", background: "linear-gradient(135deg, #1a3a5c, #0f2236)", border: "1px solid rgba(200,167,80,0.3)" }}>
                  {adminLoading ? "⏳ Adding..." : "✅ Add Admin Account"}
                </button>
              </div>
            </form>

            {/* Info box */}
            <div style={{ padding: "1rem", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "10px" }}>
              <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.85rem", marginBottom: "0.5rem" }}>ℹ️ Admin vs Agent</div>
              <div style={{ fontSize: "0.78rem", color: "#8899aa", lineHeight: 1.7 }}>
                <div>👑 <strong style={{ color: "#f0f4f8" }}>Admin:</strong> Sab kuch dekh/manage kar sakta hai</div>
                <div>🏠 <strong style={{ color: "#f0f4f8" }}>Agent:</strong> Sirf apni properties manage karta hai</div>
                <div style={{ marginTop: "0.5rem", color: "#64748b" }}>Agent add karne ke liye: Agents → Add Agent</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
