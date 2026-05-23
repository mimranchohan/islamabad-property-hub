"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
  const sessionUser = session?.user as { name?: string; email?: string; isSuperAdmin?: boolean } | undefined;
  const isSuperAdmin = sessionUser?.isSuperAdmin === true;

  // Profile form
  const [profile, setProfile] = useState({ name: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // New admin form
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Admins list
  interface AdminUser { id: string; name: string; email: string; isSuperAdmin: boolean; createdAt: string; }
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [removeMsg, setRemoveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (sessionUser?.name) setProfile(p => ({ ...p, name: sessionUser.name || "", email: sessionUser.email || "" }));
  }, [session]);

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin]);

  async function fetchAdmins() {
    setLoadingAdmins(true);
    const res = await fetch("/api/admin/list");
    const data = await res.json();
    setAdmins(Array.isArray(data) ? data : []);
    setLoadingAdmins(false);
  }

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
      setProfileMsg({ type: "ok", text: "✅ Profile update ho gaya! Agar email/password badla hai toh dobara login karein." });
      setProfile(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      await update();
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
      setAdminMsg({ type: "ok", text: `✅ "${newAdmin.name}" admin ban gaya!` });
      setNewAdmin({ name: "", email: "", password: "" });
      fetchAdmins();
    }
  }

  async function handleRemoveAdmin(adminId: string, adminName: string) {
    if (!confirm(`"${adminName}" ko admin se remove karna chahte hain?`)) return;
    setRemoveMsg(null);
    const res = await fetch("/api/admin/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRemoveMsg({ type: "err", text: data.error || "Remove failed" });
    } else {
      setRemoveMsg({ type: "ok", text: `✅ "${adminName}" remove ho gaya` });
      fetchAdmins();
    }
    setTimeout(() => setRemoveMsg(null), 4000);
  }

  const msgBox = (msg: { type: "ok" | "err"; text: string } | null) => msg ? (
    <div style={{
      padding: "0.75rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      background: msg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      color: msg.type === "ok" ? "#22c55e" : "#ef4444",
      fontSize: "0.85rem",
    }}>{msg.text}</div>
  ) : null;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Admin Settings</h1>
          <p className="page-subtitle">
            {isSuperAdmin
              ? "👑 Super Admin — Profile update, admins add/remove karein"
              : "Profile aur password update karein"}
          </p>
        </div>
        {isSuperAdmin && (
          <span style={{ padding: "0.4rem 1rem", background: "rgba(200,167,80,0.15)", border: "1px solid rgba(200,167,80,0.3)", borderRadius: "20px", color: "#c8a750", fontSize: "0.8rem", fontWeight: 700 }}>
            👑 Super Admin
          </span>
        )}
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: isSuperAdmin ? "1fr 1fr" : "1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* LEFT — Profile Update (visible to ALL admins) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <form onSubmit={handleProfileSave}>
              <div className="form-section" style={{ margin: 0 }}>
                <div className="form-section-title">👤 Apna Profile Update Karein</div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Full Name</label>
                  <input className="input-field" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                </div>

                <div style={{ margin: "1rem 0 0.75rem", padding: "0.6rem 0.75rem", background: "rgba(200,167,80,0.05)", border: "1px solid rgba(200,167,80,0.15)", borderRadius: "8px", fontSize: "0.78rem", color: "#8899aa" }}>
                  🔑 Password change karna ho tab hi neeche bharein
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Current Password</label>
                  <input type="password" className="input-field" value={profile.currentPassword} onChange={e => setProfile(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Purana password" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input-field" value={profile.newPassword} onChange={e => setProfile(p => ({ ...p, newPassword: e.target.value }))} placeholder="Naya password" minLength={6} />
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <input type="password" className="input-field" value={profile.confirmPassword} onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Dobara dalein" minLength={6} />
                  </div>
                </div>

                {msgBox(profileMsg)}
                <button type="submit" className="btn-primary" disabled={profileLoading} style={{ width: "100%" }}>
                  {profileLoading ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT — Super Admin Only Controls */}
          {isSuperAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Add New Admin */}
              <form onSubmit={handleAddAdmin}>
                <div className="form-section" style={{ margin: 0 }}>
                  <div className="form-section-title">➕ Naya Admin Add Karein</div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label className="label">Full Name *</label>
                    <input className="input-field" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} placeholder="Admin ka naam" required />
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label className="label">Email *</label>
                    <input type="email" className="input-field" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} placeholder="admin@example.com" required />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label className="label">Password *</label>
                    <input type="password" className="input-field" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
                  </div>
                  {msgBox(adminMsg)}
                  <button type="submit" className="btn-primary" disabled={adminLoading} style={{ width: "100%" }}>
                    {adminLoading ? "⏳ Adding..." : "✅ Add Admin"}
                  </button>
                </div>
              </form>

              {/* All Admins List */}
              <div className="form-section" style={{ margin: 0 }}>
                <div className="form-section-title">👥 Sab Admins</div>
                {msgBox(removeMsg)}
                {loadingAdmins ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "#8899aa" }}>Loading...</div>
                ) : admins.length === 0 ? (
                  <div style={{ color: "#8899aa", fontSize: "0.85rem", padding: "1rem", textAlign: "center" }}>Koi admin nahi mila</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {admins.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f4f8" }}>{a.name}</span>
                            {a.isSuperAdmin && (
                              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", background: "rgba(200,167,80,0.2)", color: "#c8a750", borderRadius: "10px", fontWeight: 700 }}>👑 SUPER ADMIN</span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{a.email}</div>
                        </div>
                        {!a.isSuperAdmin && (
                          <button
                            onClick={() => handleRemoveAdmin(a.id, a.name)}
                            style={{ padding: "0.3rem 0.7rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", fontSize: "0.78rem", transition: "all 0.2s" }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular admin — info box */}
          {!isSuperAdmin && (
            <div style={{ padding: "1rem", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "10px" }}>
              <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.85rem", marginBottom: "0.5rem" }}>ℹ️ Admin Permissions</div>
              <div style={{ fontSize: "0.78rem", color: "#8899aa", lineHeight: 1.7 }}>
                <div>✅ Apna naam, email, password change kar sakte hain</div>
                <div>✅ Agents manage kar sakte hain</div>
                <div>✅ Properties dekh sakte hain</div>
                <div>✅ Backup le sakte hain</div>
                <div style={{ marginTop: "0.5rem", color: "#64748b" }}>❌ Admin add/remove sirf Super Admin kar sakta hai</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
