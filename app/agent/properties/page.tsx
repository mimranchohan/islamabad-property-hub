"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
  sector: string;
  status: string;
  createdAt: string;
}

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/properties?agentId=me")
      .then((r) => r.json())
      .then((data) => { setProperties(data); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? properties : properties.filter((p) => p.status === filter);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function deleteProperty(id: string) {
    if (!confirm("Are you sure you want to delete this property?")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Properties</h1>
          <p className="page-subtitle">{properties.length} total listings</p>
        </div>
        <Link href="/agent/properties/add" className="btn-primary" style={{ textDecoration: "none" }}>
          + Add Property
        </Link>
      </div>

      <div className="page-content">
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {["ALL", "ACTIVE", "SOLD", "RENTED", "INACTIVE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: filter === s ? "#c8a750" : "rgba(255,255,255,0.1)",
                background: filter === s ? "rgba(200,167,80,0.15)" : "transparent",
                color: filter === s ? "#c8a750" : "#8899aa",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <p>No properties found</p>
            <Link href="/agent/properties/add" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: "1rem" }}>
              Add Property
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Sector</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-PK")}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{getPropertyTypeLabel(p.propertyType)}</td>
                    <td style={{ fontSize: "0.85rem", color: "#c8a750", fontWeight: 600 }}>
                      {formatPrice(p.price, p.priceUnit)}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{formatArea(p.areaSize, p.areaUnit)}</td>
                    <td style={{ fontSize: "0.85rem" }}>{p.sector}</td>
                    <td>
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          color: "#f0f4f8",
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SOLD">Sold</option>
                        <option value="RENTED">Rented</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Link
                          href={`/agent/properties/${p.id}/edit`}
                          style={{ padding: "0.3rem 0.6rem", background: "rgba(200,167,80,0.15)", color: "#c8a750", borderRadius: "6px", textDecoration: "none", fontSize: "0.8rem" }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProperty(p.id)}
                          className="btn-danger"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
