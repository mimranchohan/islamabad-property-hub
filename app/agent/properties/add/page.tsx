"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISLAMABAD_SECTORS, PROPERTY_TYPES, PROPERTY_FEATURES, SECTOR_ZONES } from "@/lib/sectors-data";

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState("");

  const [form, setForm] = useState({
    title: "", description: "",
    propertyType: "", purpose: "FOR_SALE",
    price: "", priceUnit: "LAKH",
    areaSize: "", areaUnit: "MARLA",
    bedrooms: "", bathrooms: "", floors: "", kitchens: "",
    sector: "", block: "", streetNo: "", fullAddress: "",
    furnishStatus: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }

  const filteredSectors = selectedZone
    ? ISLAMABAD_SECTORS.filter((s) => s.zone === selectedZone)
    : ISLAMABAD_SECTORS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, features: selectedFeatures }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to add property");
      return;
    }

    router.push("/agent/properties");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">➕ Add New Property</h1>
          <p className="page-subtitle">Fill in all details to list your property in the inventory</p>
        </div>
        <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>

          {/* Row 1 — Basic Info + Size side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">🏷️ Basic Information</div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Property Title *</label>
                <input name="title" className="input-field" placeholder="e.g. Beautiful 5 Marla House in F-7" value={form.title} onChange={handleChange} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Property Type *</label>
                  <select name="propertyType" className="input-field" value={form.propertyType} onChange={handleChange} required>
                    <option value="">Select Type</option>
                    {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Purpose *</label>
                  <select name="purpose" className="input-field" value={form.purpose} onChange={handleChange} required>
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Price *</label>
                  <input name="price" type="number" className="input-field" placeholder="e.g. 85" value={form.price} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Price Unit *</label>
                  <select name="priceUnit" className="input-field" value={form.priceUnit} onChange={handleChange}>
                    <option value="LAKH">Lakh (PKR)</option>
                    <option value="CRORE">Crore (PKR)</option>
                    <option value="PKR">PKR (full amount)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">📐 Size & Structure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Area Size *</label>
                  <input name="areaSize" type="number" className="input-field" placeholder="e.g. 5" value={form.areaSize} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Area Unit *</label>
                  <select name="areaUnit" className="input-field" value={form.areaUnit} onChange={handleChange}>
                    <option value="MARLA">Marla</option>
                    <option value="KANAL">Kanal</option>
                    <option value="SQFT">Sq. Ft</option>
                  </select>
                </div>
                <div>
                  <label className="label">Bedrooms</label>
                  <input name="bedrooms" type="number" className="input-field" placeholder="e.g. 3" value={form.bedrooms} onChange={handleChange} min="0" />
                </div>
                <div>
                  <label className="label">Bathrooms</label>
                  <input name="bathrooms" type="number" className="input-field" placeholder="e.g. 2" value={form.bathrooms} onChange={handleChange} min="0" />
                </div>
                <div>
                  <label className="label">Floors</label>
                  <input name="floors" type="number" className="input-field" placeholder="e.g. 2" value={form.floors} onChange={handleChange} min="0" />
                </div>
                <div>
                  <label className="label">Kitchens</label>
                  <input name="kitchens" type="number" className="input-field" placeholder="e.g. 1" value={form.kitchens} onChange={handleChange} min="0" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Furnished Status</label>
                  <select name="furnishStatus" className="input-field" value={form.furnishStatus} onChange={handleChange}>
                    <option value="">Not Specified</option>
                    <option value="FURNISHED">Furnished</option>
                    <option value="SEMI">Semi Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Location + Description side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">📍 Location Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Zone / Area</label>
                  <select className="input-field" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                    <option value="">All Islamabad</option>
                    {SECTOR_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sector / Society *</label>
                  <select name="sector" className="input-field" value={form.sector} onChange={handleChange} required>
                    <option value="">Select Sector</option>
                    {filteredSectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Block / Phase</label>
                  <input name="block" className="input-field" placeholder="e.g. Block A, Phase 1" value={form.block} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Street No.</label>
                  <input name="streetNo" className="input-field" placeholder="e.g. Street 5" value={form.streetNo} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Full Address *</label>
                  <input name="fullAddress" className="input-field" placeholder="e.g. House 12, Street 5, F-7/2, Islamabad" value={form.fullAddress} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ margin: 0, display: "flex", flexDirection: "column" }}>
              <div className="form-section-title">📝 Description</div>
              <label className="label">Property Description</label>
              <textarea
                name="description"
                className="input-field"
                placeholder="Describe the property — features, nearby facilities, special details..."
                value={form.description}
                onChange={handleChange}
                style={{ resize: "none", flex: 1, minHeight: "170px" }}
              />
            </div>
          </div>

          {/* Features — full width */}
          <div className="form-section" style={{ marginBottom: "1.5rem" }}>
            <div className="form-section-title">✨ Features & Amenities</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
              {PROPERTY_FEATURES.map((feature) => (
                <label key={feature} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: selectedFeatures.includes(feature) ? "rgba(200,167,80,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedFeatures.includes(feature) ? "rgba(200,167,80,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px", cursor: "pointer", transition: "all 0.2s",
                  fontSize: "0.82rem", fontWeight: 500,
                  color: selectedFeatures.includes(feature) ? "#c8a750" : "#8899aa",
                }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    style={{ accentColor: "#c8a750" }}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem", color: "#ef4444", marginBottom: "1rem" }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.8rem 2.5rem", fontSize: "1rem" }}>
              {loading ? "Adding Property..." : "✅ Add Property"}
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
