"use client";
import { useState, useEffect, useCallback } from "react";
import { ISLAMABAD_SECTORS, PROPERTY_TYPES, SECTOR_ZONES } from "@/lib/sectors-data";
import { getPropertyTypeLabel, formatPrice, formatArea } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  propertyType: string;
  purpose: string;
  price: number;
  priceUnit: string;
  areaSize: number;
  areaUnit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sector: string;
  status: string;
  fullAddress: string;
  features: string | null;
  agent: { name: string; phone: string | null; email: string; agencyName: string | null; website: string | null };
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    q: "", sector: "", zone: "", type: "", purpose: "",
    minPrice: "", maxPrice: "", minArea: "", maxArea: "", bedrooms: "",
  });
  const [searched, setSearched] = useState(false);

  const filteredSectors = filters.zone
    ? ISLAMABAD_SECTORS.filter((s) => s.zone === filters.zone)
    : ISLAMABAD_SECTORS;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [searchError, setSearchError] = useState("");

  const search = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    setSearchError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("limit", "50");
    try {
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setProperties(Array.isArray(data.items) ? data.items : []);
    } catch {
      setSearchError("Search fail ho gai. Internet check karein ya dobara koshish karein.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  function shareOnWhatsApp(p: Property) {
    const msg = encodeURIComponent(
      `🏠 *${p.title}*\n📍 ${p.sector}\n💰 ${formatPrice(p.price, p.priceUnit)}\n📐 ${formatArea(p.areaSize, p.areaUnit)}${p.bedrooms ? `\n🛏 ${p.bedrooms} Beds` : ""}\n📞 ${p.agent.phone || p.agent.email}\n\n_Islamabad Property Hub_`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search();
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Properties</h1>
          <p className="page-subtitle">Search across all Islamabad sectors</p>
        </div>
      </div>

      <div className="page-content">
        {searchError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", marginBottom: "1rem", fontSize: "0.85rem" }}>
            ⚠️ {searchError}
          </div>
        )}
        {/* Search Filters */}
        <div className="form-section" style={{ marginBottom: "1.5rem" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  name="q"
                  className="search-input"
                  style={{ paddingLeft: "3rem" }}
                  placeholder="Search by title, address, sector..."
                  value={filters.q}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label className="label">Zone</label>
                <select name="zone" className="input-field" value={filters.zone} onChange={handleChange}>
                  <option value="">All Zones</option>
                  {SECTOR_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sector</label>
                <select name="sector" className="input-field" value={filters.sector} onChange={handleChange}>
                  <option value="">All Sectors</option>
                  {filteredSectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Property Type</label>
                <select name="type" className="input-field" value={filters.type} onChange={handleChange}>
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Purpose</label>
                <select name="purpose" className="input-field" value={filters.purpose} onChange={handleChange}>
                  <option value="">Any</option>
                  <option value="FOR_SALE">For Sale</option>
                  <option value="FOR_RENT">For Rent</option>
                </select>
              </div>
              <div>
                <label className="label">Min Price (Lakh)</label>
                <input name="minPrice" type="number" className="input-field" placeholder="e.g. 50" value={filters.minPrice} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Max Price (Lakh)</label>
                <input name="maxPrice" type="number" className="input-field" placeholder="e.g. 200" value={filters.maxPrice} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Min Area (Marla)</label>
                <input name="minArea" type="number" className="input-field" placeholder="e.g. 5" value={filters.minArea} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <select name="bedrooms" className="input-field" value={filters.bedrooms} onChange={handleChange}>
                  <option value="">Any</option>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Searching..." : "🔍 Search Properties"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setFilters({ q: "", sector: "", zone: "", type: "", purpose: "", minPrice: "", maxPrice: "", minArea: "", maxArea: "", bedrooms: "" })}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Sector pills */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="section-title">Quick Select: Islamabad Sectors</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {ISLAMABAD_SECTORS.slice(0, 20).map((s) => (
              <button
                key={s.id}
                onClick={() => { setFilters((prev) => ({ ...prev, sector: s.name })); }}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: filters.sector === s.name ? "#c8a750" : "rgba(255,255,255,0.1)",
                  background: filters.sector === s.name ? "rgba(200,167,80,0.15)" : "transparent",
                  color: filters.sector === s.name ? "#c8a750" : "#8899aa",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div>
            <div style={{ marginBottom: "1rem", color: "#8899aa", fontSize: "0.875rem" }}>
              {loading ? "Searching..." : `${properties.length} properties found`}
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : properties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>No properties match your search</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="property-card"
                    onClick={() => setSelectedProperty(selectedProperty?.id === p.id ? null : p)}
                  >
                    <div className="property-card-image">
                      <span>{p.propertyType === "HOUSE" ? "🏠" : p.propertyType === "FLAT" ? "🏢" : p.propertyType === "PLOT" ? "🏗️" : p.propertyType === "SHOP" ? "🏪" : "🏠"}</span>
                      <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                        <span className={`badge ${p.purpose === "FOR_SALE" ? "badge-active" : "badge-rented"}`}>
                          {p.purpose === "FOR_SALE" ? "For Sale" : "For Rent"}
                        </span>
                      </div>
                    </div>
                    <div className="property-card-body">
                      <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{p.title}</div>
                      <div style={{ color: "#c8a750", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>
                        {formatPrice(p.price, p.priceUnit)}
                      </div>
                      <div style={{ color: "#8899aa", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                        📍 {p.sector} • {formatArea(p.areaSize, p.areaUnit)}
                        {p.bedrooms ? ` • ${p.bedrooms} Beds` : ""}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#8899aa" }}>
                        <span style={{ fontWeight: 500, color: "#f0f4f8" }}>{p.agent.name}</span>
                        {p.agent.agencyName && ` • ${p.agent.agencyName}`}
                      </div>
                      {selectedProperty?.id === p.id && (
                        <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px", fontSize: "0.8rem" }}>
                          <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#c8a750" }}>Contact Details</div>
                          {p.agent.phone && <div>📞 {p.agent.phone}</div>}
                          <div>📧 {p.agent.email}</div>
                          {p.agent.website && <div>🌐 <a href={p.agent.website} target="_blank" style={{ color: "#818cf8" }}>Website</a></div>}
                          <div style={{ marginTop: "0.5rem", color: "#8899aa" }}>📍 {p.fullAddress}</div>
                          {p.bedrooms && <div>🛏 {p.bedrooms} Beds • 🚿 {p.bathrooms} Baths</div>}
                          {p.features && (
                            <div style={{ marginTop: "0.5rem" }}>
                              {(() => {
                                try { return JSON.parse(p.features).slice(0, 4).join(" • "); }
                                catch { return ""; }
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
