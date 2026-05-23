"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ISLAMABAD_SECTORS, PROPERTY_TYPES, PROPERTY_FEATURES, SECTOR_ZONES } from "@/lib/sectors-data";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState("");

  const [form, setForm] = useState({
    title: "", description: "",
    propertyType: "", purpose: "FOR_SALE",
    price: "", priceUnit: "LAKH",
    areaSize: "", areaUnit: "MARLA",
    bedrooms: "", bathrooms: "", floors: "", kitchens: "",
    sector: "", block: "", streetNo: "", fullAddress: "",
    furnishStatus: "", status: "ACTIVE",
  });

  // Load existing property data
  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError("Property not found"); setFetching(false); return; }
        setForm({
          title: data.title || "",
          description: data.description || "",
          propertyType: data.propertyType || "",
          purpose: data.purpose || "FOR_SALE",
          price: String(data.price || ""),
          priceUnit: data.priceUnit || "LAKH",
          areaSize: String(data.areaSize || ""),
          areaUnit: data.areaUnit || "MARLA",
          bedrooms: data.bedrooms != null ? String(data.bedrooms) : "",
          bathrooms: data.bathrooms != null ? String(data.bathrooms) : "",
          floors: data.floors != null ? String(data.floors) : "",
          kitchens: data.kitchens != null ? String(data.kitchens) : "",
          sector: data.sector || "",
          block: data.block || "",
          streetNo: data.streetNo || "",
          fullAddress: data.fullAddress || "",
          furnishStatus: data.furnishStatus || "",
          status: data.status || "ACTIVE",
        });
        if (data.features) {
          try { setSelectedFeatures(JSON.parse(data.features)); } catch {}
        }
        setFetching(false);
      })
      .catch(() => { setError("Failed to load property"); setFetching(false); });
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
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
    setSuccess("");

    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        areaSize: parseFloat(form.areaSize),
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        kitchens: form.kitchens ? parseInt(form.kitchens) : null,
        features: JSON.stringify(selectedFeatures),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update property");
      return;
    }
    setSuccess("Property updated successfully!");
    setTimeout(() => router.push("/agent/properties"), 1500);
  }

  if (fetching) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "#8899aa" }}>Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">✏️ Edit Property</h1>
          <p className="page-subtitle">Update property details — changes save immediately</p>
        </div>
        <button className="btn-secondary" onClick={() => router.back()}>
          ← Back
        </button>
      </div>

      <div className="page-content" style={{ maxWidth: "800px" }}>
        <form onSubmit={handleSubmit}>

          {/* Status */}
          <div className="form-section">
            <div className="form-section-title">📋 Listing Status</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {["ACTIVE", "SOLD", "RENTED", "INACTIVE"].map((s) => (
                <label key={s} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: form.status === s ? "rgba(200,167,80,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${form.status === s ? "rgba(200,167,80,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                  color: form.status === s ? "#c8a750" : "#8899aa",
                  transition: "all 0.2s",
                }}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={handleChange} style={{ accentColor: "#c8a750" }} />
                  {s === "ACTIVE" ? "✅ Active" : s === "SOLD" ? "🔴 Sold" : s === "RENTED" ? "🟡 Rented" : "⏸ Inactive"}
                </label>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <div className="form-section-title">🏷️ Basic Information</div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Property Title *</label>
              <input name="title" className="input-field" placeholder="e.g. Beautiful 5 Marla House in F-7" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-grid">
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
                <input name="price" type="number" className="input-field" value={form.price} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Price Unit</label>
                <select name="priceUnit" className="input-field" value={form.priceUnit} onChange={handleChange}>
                  <option value="LAKH">Lakh (PKR)</option>
                  <option value="CRORE">Crore (PKR)</option>
                  <option value="PKR">PKR (full)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Size & Structure */}
          <div className="form-section">
            <div className="form-section-title">📐 Size & Structure</div>
            <div className="form-grid">
              <div>
                <label className="label">Area Size *</label>
                <input name="areaSize" type="number" className="input-field" value={form.areaSize} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Area Unit</label>
                <select name="areaUnit" className="input-field" value={form.areaUnit} onChange={handleChange}>
                  <option value="MARLA">Marla</option>
                  <option value="KANAL">Kanal</option>
                  <option value="SQ_FT">Sq. Ft</option>
                </select>
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <input name="bedrooms" type="number" className="input-field" value={form.bedrooms} onChange={handleChange} min="0" />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input name="bathrooms" type="number" className="input-field" value={form.bathrooms} onChange={handleChange} min="0" />
              </div>
              <div>
                <label className="label">Floors</label>
                <input name="floors" type="number" className="input-field" value={form.floors} onChange={handleChange} min="0" />
              </div>
              <div>
                <label className="label">Kitchens</label>
                <input name="kitchens" type="number" className="input-field" value={form.kitchens} onChange={handleChange} min="0" />
              </div>
              <div>
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

          {/* Location */}
          <div className="form-section">
            <div className="form-section-title">📍 Location</div>
            <div className="form-grid">
              <div>
                <label className="label">Zone / Area</label>
                <select className="input-field" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                  <option value="">All Islamabad</option>
                  {SECTOR_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sector *</label>
                <select name="sector" className="input-field" value={form.sector} onChange={handleChange} required>
                  <option value="">Select Sector</option>
                  {filteredSectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Block / Phase</label>
                <input name="block" className="input-field" value={form.block} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Street No.</label>
                <input name="streetNo" className="input-field" value={form.streetNo} onChange={handleChange} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Full Address *</label>
                <input name="fullAddress" className="input-field" value={form.fullAddress} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="form-section">
            <div className="form-section-title">✨ Features & Amenities</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
              {PROPERTY_FEATURES.map((feature) => (
                <label key={feature} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: selectedFeatures.includes(feature) ? "rgba(200,167,80,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedFeatures.includes(feature) ? "rgba(200,167,80,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500, transition: "all 0.2s",
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

          {/* Description */}
          <div className="form-section">
            <div className="form-section-title">📝 Description</div>
            <textarea
              name="description"
              className="input-field"
              rows={4}
              placeholder="Describe the property..."
              value={form.description}
              onChange={handleChange}
              style={{ resize: "vertical" }}
            />
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
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.75rem 2rem" }}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
