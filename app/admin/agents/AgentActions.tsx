"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agencyName: string | null;
  website: string | null;
};

const btn = (color: string, bg: string): React.CSSProperties => ({
  padding: "0.35rem 0.75rem",
  background: bg,
  color,
  border: "none",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "0.8rem",
  cursor: "pointer",
  fontWeight: 600,
});

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
};
const box: React.CSSProperties = {
  background: "#141b2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
  padding: "1.5rem", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.75rem", marginTop: "0.25rem",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", color: "#fff", fontSize: "0.9rem",
};
const labelStyle: React.CSSProperties = { fontSize: "0.75rem", color: "#8899aa", fontWeight: 600 };

export default function AgentActions({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: agent.name,
    email: agent.email,
    phone: agent.phone || "",
    agencyName: agent.agencyName || "",
    website: agent.website || "",
    password: "",
  });

  async function save() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove agent "${agent.name}"?\n\nThis permanently deletes the agent AND all their properties. This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to remove agent");
      }
    } catch {
      alert("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <a href={`/admin/agents/${agent.id}`} style={btn("#818cf8", "rgba(99,102,241,0.15)")}>View</a>
        <button onClick={() => { setError(""); setEditing(true); }} style={btn("#c8a750", "rgba(200,167,80,0.15)")}>Edit</button>
        <button onClick={remove} disabled={loading} style={btn("#ef4444", "rgba(239,68,68,0.15)")}>Remove</button>
      </div>

      {editing && (
        <div style={overlay} onClick={() => !loading && setEditing(false)}>
          <div style={box} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Edit Agent</h3>
            {error && <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</div>}

            <div style={{ marginBottom: "0.75rem" }}>
              <div style={labelStyle}>Name</div>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={labelStyle}>Email</div>
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={labelStyle}>Phone</div>
              <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={labelStyle}>Agency</div>
              <input style={inputStyle} value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={labelStyle}>Website</div>
              <input style={inputStyle} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={labelStyle}>New Password (leave blank to keep current)</div>
              <input style={inputStyle} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={save} disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} disabled={loading} style={btn("#94a3b8", "rgba(148,163,184,0.15)")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
