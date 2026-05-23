"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  block: string | null;
  status: string;
  fullAddress: string;
  features: string | null;
  furnishStatus: string | null;
  description: string | null;
  createdAt: string;
  agent: {
    name: string;
    phone: string | null;
    email: string;
    agencyName: string | null;
    website: string | null;
  };
}

const purposeColors: Record<string, string> = {
  FOR_SALE: "#22c55e",
  FOR_RENT: "#f59e0b",
};

const typeIcons: Record<string, string> = {
  HOUSE: "🏠", FLAT: "🏢", APARTMENT: "🏢", PLOT: "🏗️",
  COMMERCIAL_PLOT: "🏢", OFFICE: "🏛️", SHOP: "🏪",
  WAREHOUSE: "🏭", FARM_HOUSE: "🌳", PENTHOUSE: "🌆",
  UPPER_PORTION: "🏠", LOWER_PORTION: "🏠", ROOM: "🛏️", STUDIO: "🏙️",
};

export default function ExplorePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    q: "", sector: "", zone: "", type: "", purpose: "",
    minPrice: "", maxPrice: "", minArea: "", maxArea: "",
    bedrooms: "", furnishStatus: "",
  });

  const filteredSectors = filters.zone
    ? ISLAMABAD_SECTORS.filter((s) => s.zone === filters.zone)
    : ISLAMABAD_SECTORS;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchProperties = useCallback(async (f = filters) => {
    setLoading(true);
    setHasSearched(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/properties?${params}`);
    const data = await res.json();
    setProperties(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filters]);

  // Load all on mount
  useEffect(() => { fetchProperties({}); }, []); // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProperties();
  }

  function selectSector(name: string) {
    const next = { ...filters, sector: filters.sector === name ? "" : name };
    setFilters(next);
    fetchProperties(next);
  }

  function clearFilters() {
    const empty = { q: "", sector: "", zone: "", type: "", purpose: "", minPrice: "", maxPrice: "", minArea: "", maxArea: "", bedrooms: "", furnishStatus: "" };
    setFilters(empty);
    fetchProperties(empty);
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">🏘️ Explore Properties</h1>
          <p className="page-subtitle">
            Browse all Islamabad inventory — {properties.length} listings found
          </p>
        </div>
        <Link
          href="/agent/properties/add"
          className="btn-primary"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          ➕ Add New Property
        </Link>
      </div>

      <div className="page-content">
        {/* Search & Filters */}
        <form onSubmit={handleSearch}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}>
            {/* Main search */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="search-container" style={{ flex: 1 }}>
                <span className="search-icon" style={{ left: "1rem", top: "50%", transform: "translateY(-50%)", position: "absolute", color: "#8899aa" }}>🔍</span>
                <input
                  name="q"
                  value={filters.q}
                  onChange={handleChange}
                  placeholder="Search by title, address, sector, description..."
                  style={{
                    width: "100%", paddingLeft: "2.75rem", paddingRight: "1rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", padding: "0.8rem 1rem 0.8rem 2.75rem",
                    color: "#f0f4f8", fontSize: "0.9rem", outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#c8a750")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                {loading ? "..." : "Search"}
              </button>
              {activeFiltersCount > 0 && (
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Filter row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.6rem" }}>
              <div>
                <select name="zone" className="input-field" value={filters.zone} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">All Zones</option>
                  {SECTOR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <select name="sector" className="input-field" value={filters.sector} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">All Sectors</option>
                  {filteredSectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <select name="type" className="input-field" value={filters.type} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <select name="purpose" className="input-field" value={filters.purpose} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">Sale / Rent</option>
                  <option value="FOR_SALE">For Sale</option>
                  <option value="FOR_RENT">For Rent</option>
                </select>
              </div>
              <div>
                <input name="minPrice" type="number" className="input-field" placeholder="Min Price (L)" value={filters.minPrice} onChange={handleChange} style={{ fontSize: "0.82rem" }} />
              </div>
              <div>
                <input name="maxPrice" type="number" className="input-field" placeholder="Max Price (L)" value={filters.maxPrice} onChange={handleChange} style={{ fontSize: "0.82rem" }} />
              </div>
              <div>
                <input name="minArea" type="number" className="input-field" placeholder="Min Area (M)" value={filters.minArea} onChange={handleChange} style={{ fontSize: "0.82rem" }} />
              </div>
              <div>
                <select name="bedrooms" className="input-field" value={filters.bedrooms} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">Any Beds</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
                </select>
              </div>
              <div>
                <select name="furnishStatus" className="input-field" value={filters.furnishStatus} onChange={handleChange} style={{ fontSize: "0.82rem" }}>
                  <option value="">Any Furnish</option>
                  <option value="FURNISHED">Furnished</option>
                  <option value="SEMI">Semi Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Sector Quick Pills */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <div className="section-title" style={{ margin: 0 }}>📍 Quick Sector Select</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setView("grid")}
                style={{
                  padding: "0.3rem 0.8rem", borderRadius: "6px", border: "1px solid",
                  borderColor: view === "grid" ? "#c8a750" : "rgba(255,255,255,0.1)",
                  background: view === "grid" ? "rgba(200,167,80,0.15)" : "transparent",
                  color: view === "grid" ? "#c8a750" : "#8899aa", cursor: "pointer", fontSize: "0.8rem",
                }}
              >⊞ Grid</button>
              <button
                onClick={() => setView("list")}
                style={{
                  padding: "0.3rem 0.8rem", borderRadius: "6px", border: "1px solid",
                  borderColor: view === "list" ? "#c8a750" : "rgba(255,255,255,0.1)",
                  background: view === "list" ? "rgba(200,167,80,0.15)" : "transparent",
                  color: view === "list" ? "#c8a750" : "#8899aa", cursor: "pointer", fontSize: "0.8rem",
                }}
              >☰ List</button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {ISLAMABAD_SECTORS.map(s => (
              <button
                key={s.id}
                onClick={() => selectSector(s.name)}
                style={{
                  padding: "0.28rem 0.7rem", borderRadius: "16px", border: "1px solid",
                  borderColor: filters.sector === s.name ? "#c8a750" : "rgba(255,255,255,0.08)",
                  background: filters.sector === s.name ? "rgba(200,167,80,0.18)" : "transparent",
                  color: filters.sector === s.name ? "#c8a750" : "#8899aa",
                  cursor: "pointer", fontSize: "0.76rem", fontWeight: 600, transition: "all 0.15s",
                }}
              >{s.name}</button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <div className="spinner" style={{ margin: "0 auto 1rem" }} />
            <p style={{ color: "#8899aa" }}>Loading properties...</p>
          </div>
        ) : properties.length === 0 && hasSearched ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏘️</div>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>No properties found</p>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Try different filters or add the first property</p>
            <Link href="/agent/properties/add" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              ➕ Add First Property
            </Link>
          </div>
        ) : view === "grid" ? (
          /* GRID VIEW */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.2rem" }}>
            {properties.map(p => (
              <div
                key={p.id}
                className="property-card"
                style={{ cursor: "default" }}
              >
                {/* Card top */}
                <div className="property-card-image" style={{ height: "160px" }}>
                  <span style={{ fontSize: "3rem" }}>{typeIcons[p.propertyType] || "🏠"}</span>
                  <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>
                    <span style={{
                      padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem",
                      fontWeight: 700, background: `${purposeColors[p.purpose]}25`,
                      color: purposeColors[p.purpose], border: `1px solid ${purposeColors[p.purpose]}40`,
                    }}>
                      {p.purpose === "FOR_SALE" ? "For Sale" : "For Rent"}
                    </span>
                  </div>
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                    <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                  </div>
                </div>

                <div className="property-card-body">
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem", lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ color: "#c8a750", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    {formatPrice(p.price, p.priceUnit)}
                  </div>

                  {/* Tags row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
                    <span style={{ padding: "0.15rem 0.5rem", background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600 }}>
                      {getPropertyTypeLabel(p.propertyType)}
                    </span>
                    <span style={{ padding: "0.15rem 0.5rem", background: "rgba(200,167,80,0.12)", color: "#c8a750", borderRadius: "6px", fontSize: "0.72rem" }}>
                      📐 {formatArea(p.areaSize, p.areaUnit)}
                    </span>
                    {p.bedrooms ? (
                      <span style={{ padding: "0.15rem 0.5rem", background: "rgba(255,255,255,0.06)", color: "#8899aa", borderRadius: "6px", fontSize: "0.72rem" }}>
                        🛏 {p.bedrooms} Bed{p.bedrooms > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {p.furnishStatus && (
                      <span style={{ padding: "0.15rem 0.5rem", background: "rgba(255,255,255,0.06)", color: "#8899aa", borderRadius: "6px", fontSize: "0.72rem" }}>
                        {p.furnishStatus === "FURNISHED" ? "✨ Furnished" : p.furnishStatus === "SEMI" ? "🪑 Semi" : "📦 Unfurnished"}
                      </span>
                    )}
                  </div>

                  <div style={{ color: "#8899aa", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                    📍 {p.sector}{p.block ? `, ${p.block}` : ""}
                  </div>

                  {/* Agent + expand */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 600, color: "#f0f4f8" }}>{p.agent.name}</span>
                      {p.agent.agencyName && <div style={{ color: "#64748b" }}>{p.agent.agencyName}</div>}
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      style={{
                        padding: "0.3rem 0.7rem", background: "rgba(200,167,80,0.12)",
                        border: "1px solid rgba(200,167,80,0.25)", borderRadius: "6px",
                        color: "#c8a750", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                      }}
                    >
                      {expandedId === p.id ? "▲ Less" : "▼ Details"}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expandedId === p.id && (
                    <div style={{
                      marginTop: "0.75rem", padding: "0.9rem",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                      fontSize: "0.8rem", animation: "fadeIn 0.2s ease",
                    }}>
                      <div style={{ fontWeight: 700, color: "#c8a750", marginBottom: "0.6rem" }}>📞 Agent Contact</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.6rem" }}>
                        {p.agent.phone && <div>📱 {p.agent.phone}</div>}
                        <div>📧 {p.agent.email}</div>
                        {p.agent.website && (
                          <div style={{ gridColumn: "1/-1" }}>
                            🌐 <a href={p.agent.website} target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>{p.agent.website}</a>
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: "#c8a750", marginBottom: "0.4rem" }}>📍 Address</div>
                      <div style={{ color: "#8899aa", marginBottom: "0.6rem" }}>{p.fullAddress}</div>
                      {p.description && (
                        <>
                          <div style={{ fontWeight: 700, color: "#c8a750", marginBottom: "0.4rem" }}>📝 Description</div>
                          <div style={{ color: "#8899aa", lineHeight: 1.5 }}>{p.description}</div>
                        </>
                      )}
                      {p.features && JSON.parse(p.features).length > 0 && (
                        <>
                          <div style={{ fontWeight: 700, color: "#c8a750", marginTop: "0.6rem", marginBottom: "0.4rem" }}>✨ Features</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                            {JSON.parse(p.features).map((f: string) => (
                              <span key={f} style={{ padding: "0.15rem 0.5rem", background: "rgba(200,167,80,0.1)", color: "#c8a750", borderRadius: "5px", fontSize: "0.72rem" }}>
                                {f}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Sector</th>
                  <th>Agent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <React.Fragment key={p.id}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>
                          {p.purpose === "FOR_SALE" ? "🟢 For Sale" : "🟡 For Rent"}
                          {p.bedrooms ? ` • ${p.bedrooms} Beds` : ""}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{getPropertyTypeLabel(p.propertyType)}</td>
                      <td style={{ color: "#c8a750", fontWeight: 700 }}>{formatPrice(p.price, p.priceUnit)}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatArea(p.areaSize, p.areaUnit)}</td>
                      <td style={{ fontSize: "0.82rem" }}>{p.sector}</td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.agent.name}</div>
                        {p.agent.phone && <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>{p.agent.phone}</div>}
                      </td>
                      <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    </tr>
                    {expandedId === p.id && (
                      <tr>
                        <td colSpan={7} style={{ background: "rgba(200,167,80,0.04)", padding: "1rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem", fontSize: "0.82rem" }}>
                            <div>
                              <div style={{ color: "#c8a750", fontWeight: 700, marginBottom: "0.4rem" }}>📞 Contact</div>
                              <div>{p.agent.email}</div>
                              {p.agent.phone && <div>{p.agent.phone}</div>}
                            </div>
                            <div>
                              <div style={{ color: "#c8a750", fontWeight: 700, marginBottom: "0.4rem" }}>📍 Address</div>
                              <div style={{ color: "#8899aa" }}>{p.fullAddress}</div>
                            </div>
                            {p.description && (
                              <div style={{ gridColumn: "span 2" }}>
                                <div style={{ color: "#c8a750", fontWeight: 700, marginBottom: "0.4rem" }}>📝 Description</div>
                                <div style={{ color: "#8899aa" }}>{p.description}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating Add Button */}
        <Link
          href="/agent/properties/add"
          style={{
            position: "fixed", bottom: "2rem", right: "2rem",
            background: "linear-gradient(135deg, #c8a750, #d4b96a)",
            color: "#0f2236", fontWeight: 800, padding: "0.9rem 1.5rem",
            borderRadius: "50px", textDecoration: "none",
            boxShadow: "0 8px 30px rgba(200,167,80,0.4)",
            display: "flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.9rem", zIndex: 99, transition: "all 0.2s",
            animation: "pulse-glow 2s infinite",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          ➕ Add Property
        </Link>
      </div>
    </div>
  );
}
