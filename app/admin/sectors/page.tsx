"use client";
import { useState, useEffect, useCallback } from "react";

interface Sector {
  id: string;
  name: string;
  zone: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}

const COMMON_ZONES = [
  "F-Series", "G-Series", "E-Series", "I-Series", "H-Series",
  "B-Series", "D-Series", "Special", "DHA", "Bahria Town", "Other"
];

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterZone, setFilterZone] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", zone: "", city: "Islamabad", customZone: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSectors = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sectors");
    const data = await res.json();
    setSectors(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSectors(); }, [fetchSectors]);

  async function handleSeedFromStatic() {
    setSeeding(true);
    const res = await fetch("/api/sectors", { method: "PUT" });
    const data = await res.json();
    setSuccess(data.message || "Seeded!");
    await fetchSectors();
    setSeeding(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    const zone = form.zone === "__custom__" ? form.customZone : form.zone;
    const res = await fetch("/api/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, zone, city: form.city }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setAdding(false); return; }
    setSuccess(`✅ "${form.name}" added!`);
    setForm({ name: "", zone: "", city: "Islamabad", customZone: "" });
    await fetchSectors();
    setAdding(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" delete karna chahte hain?`)) return;
    await fetch("/api/sectors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSectors((prev) => prev.filter((s) => s.id !== id));
    setSuccess(`🗑️ "${name}" removed!`);
    setTimeout(() => setSuccess(""), 2000);
  }

  async function handleToggle(sector: Sector) {
    await fetch("/api/sectors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sector.id, isActive: !sector.isActive }),
    });
    setSectors((prev) =>
      prev.map((s) => s.id === sector.id ? { ...s, isActive: !s.isActive } : s)
    );
  }

  const zones = Array.from(new Set(sectors.map((s) => s.zone))).sort();
  const filtered = sectors.filter((s) => {
    const matchZone = !filterZone || s.zone === filterZone;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchZone && matchSearch;
  });

  const groupedByZone = zones.reduce<Record<string, Sector[]>>((acc, zone) => {
    acc[zone] = filtered.filter((s) => s.zone === zone);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📍 Manage Sectors & Areas</h1>
          <p className="page-subtitle">{sectors.length} total sectors — add, remove, or toggle visibility</p>
        </div>
        {sectors.length === 0 && (
          <button className="btn-primary" onClick={handleSeedFromStatic} disabled={seeding}>
            {seeding ? "Loading..." : "⚡ Load Default Sectors"}
          </button>
        )}
      </div>

      <div className="page-content">
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#22c55e", marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "1.5rem", alignItems: "start" }}>

          {/* ADD FORM */}
          <div className="form-section" style={{ margin: 0, position: "sticky", top: "1rem" }}>
            <div className="form-section-title">➕ New Sector / Area Add Karein</div>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label className="label">Sector / Area Name *</label>
                <input
                  className="input-field"
                  placeholder="e.g. F-12, CDA Colony, Park Road"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label className="label">Zone / Category *</label>
                <select
                  className="input-field"
                  value={form.zone}
                  onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                  required
                >
                  <option value="">Select Zone</option>
                  {COMMON_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  <option value="__custom__">+ Custom Zone</option>
                </select>
              </div>
              {form.zone === "__custom__" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="label">Custom Zone Name *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Rawalpindi, Twin Cities"
                    value={form.customZone}
                    onChange={(e) => setForm((p) => ({ ...p, customZone: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">City</label>
                <input
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
              {error && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>⚠️ {error}</div>
              )}
              <button type="submit" className="btn-primary" disabled={adding} style={{ width: "100%" }}>
                {adding ? "Adding..." : "➕ Add Sector"}
              </button>
            </form>

            {/* Stats */}
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.78rem", color: "#8899aa", marginBottom: "0.5rem" }}>QUICK STATS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(200,167,80,0.08)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#c8a750" }}>{sectors.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>Total</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(34,197,94,0.08)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22c55e" }}>{sectors.filter(s => s.isActive).length}</div>
                  <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>Active</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(99,102,241,0.08)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#818cf8" }}>{zones.length}</div>
                  <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>Zones</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(239,68,68,0.08)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ef4444" }}>{sectors.filter(s => !s.isActive).length}</div>
                  <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>Inactive</div>
                </div>
              </div>
            </div>

            {sectors.length > 0 && (
              <button
                onClick={handleSeedFromStatic}
                disabled={seeding}
                style={{
                  marginTop: "1rem", width: "100%", padding: "0.5rem",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px", color: "#64748b", cursor: "pointer", fontSize: "0.78rem",
                }}
              >
                {seeding ? "Loading..." : "🔄 Re-import Default Sectors"}
              </button>
            )}
          </div>

          {/* SECTORS LIST */}
          <div>
            {/* Search & Filter */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <input
                className="input-field"
                placeholder="🔍 Search sector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="input-field"
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                style={{ width: "180px" }}
              >
                <option value="">All Zones</option>
                {zones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#8899aa" }}>
                <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                Loading sectors...
              </div>
            ) : sectors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📍</div>
                <p>Koi sector nahi mila</p>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
                  "Load Default Sectors" click karein ya manually add karein
                </p>
              </div>
            ) : (
              Object.entries(groupedByZone).map(([zone, zoneSectors]) => (
                zoneSectors.length > 0 && (
                  <div key={zone} style={{ marginBottom: "1.25rem" }}>
                    <div style={{
                      fontSize: "0.72rem", fontWeight: 700, color: "#c8a750",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      padding: "0.25rem 0", borderBottom: "1px solid rgba(200,167,80,0.2)",
                      marginBottom: "0.6rem",
                    }}>
                      {zone} <span style={{ color: "#64748b", fontWeight: 400 }}>({zoneSectors.length})</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {zoneSectors.map((sector) => (
                        <div
                          key={sector.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.3rem 0.4rem 0.3rem 0.75rem",
                            background: sector.isActive ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${sector.isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                            borderRadius: "20px",
                            opacity: sector.isActive ? 1 : 0.5,
                          }}
                        >
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: sector.isActive ? "#f0f4f8" : "#64748b" }}>
                            {sector.name}
                          </span>
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(sector)}
                            title={sector.isActive ? "Deactivate" : "Activate"}
                            style={{
                              width: "20px", height: "20px", borderRadius: "50%",
                              border: "none", cursor: "pointer", fontSize: "0.6rem",
                              background: sector.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)",
                              color: sector.isActive ? "#22c55e" : "#ef4444",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {sector.isActive ? "✓" : "✕"}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(sector.id, sector.name)}
                            title="Delete"
                            style={{
                              width: "20px", height: "20px", borderRadius: "50%",
                              border: "none", cursor: "pointer", fontSize: "0.65rem",
                              background: "rgba(239,68,68,0.1)", color: "#ef4444",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
