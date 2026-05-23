"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", agencyName: "", website: "", password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess("Agent successfully added! Now you can activate them from the Agents page.");
    setTimeout(() => router.push("/admin/agents"), 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Agent</h1>
          <p className="page-subtitle">Create agent account — they will be inactive until you activate them</p>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">👤 Agent Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input name="name" className="input-field" placeholder="Muhammad Ali" value={form.name} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input name="email" type="email" className="input-field" placeholder="agent@email.com" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input name="phone" className="input-field" placeholder="0300-1234567" value={form.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Agency / Company Name</label>
                  <input name="agencyName" className="input-field" placeholder="Ali Properties" value={form.agencyName} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Website</label>
                  <input name="website" className="input-field" placeholder="https://www.aliproperties.pk" value={form.website} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">🔑 Login Credentials</div>
              <div>
                <label className="label">Password *</label>
                <input name="password" type="password" className="input-field" placeholder="Set a strong password" value={form.password} onChange={handleChange} required minLength={6} />
                <p style={{ color: "#8899aa", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                  Share this password securely with the agent. They can use it to login at the agent portal.
                </p>
              </div>
              <div style={{
                marginTop: "1.5rem", padding: "1rem",
                background: "rgba(200,167,80,0.05)",
                border: "1px solid rgba(200,167,80,0.15)",
                borderRadius: "8px", fontSize: "0.82rem", color: "#8899aa"
              }}>
                <div style={{ fontWeight: 600, color: "#c8a750", marginBottom: "0.4rem" }}>📋 Note</div>
                <p>Agent account will be <strong style={{ color: "#f0f4f8" }}>inactive</strong> after creation. Go to Agents page to activate them manually.</p>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem", color: "#ef4444", marginBottom: "1rem" }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "0.75rem", color: "#22c55e", marginBottom: "1rem" }}>
              ✅ {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.8rem 2.5rem", fontSize: "1rem" }}>
              {loading ? "Adding..." : "✅ Add Agent"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ padding: "0.8rem 1.5rem" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
