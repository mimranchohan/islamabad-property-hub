"use client";
import { useState, useEffect, useCallback } from "react";

interface BackupRecord {
  id: string;
  filename: string;
  type: string;
  sizeBytes: number;
  agentCount: number;
  propertyCount: number;
  sectorCount: number;
  notes: string | null;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Abhi";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min pehle`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ghante pehle`;
  return `${Math.floor(seconds / 86400)} din pehle`;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [autoEnabled, setAutoEnabled] = useState(true);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      const text = await res.text();
      if (!text) { setBackups([]); setLoading(false); return; }
      const data = JSON.parse(text);
      setBackups(Array.isArray(data) ? data : []);
    } catch {
      setBackups([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  // Auto backup check every 24h (sets interval on mount)
  useEffect(() => {
    if (!autoEnabled) return;
    // Trigger auto backup check on page load
    fetch("/api/admin/backup/auto").catch(() => {});
    // Then every 24 hours
    const interval = setInterval(() => {
      fetch("/api/admin/backup/auto").catch(() => {});
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled]);

  async function handleManualBackup() {
    setDownloading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "MANUAL", notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Backup failed");
        setDownloading(false);
        return;
      }

      // Download the file
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `backup-${Date.now()}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess("✅ Backup download shuru ho gaya!");
      setNotes("");
      await fetchBackups();
    } catch {
      setError("Network error — backup failed");
    }
    setDownloading(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleAutoNow() {
    setAutoRunning(true);
    const res = await fetch("/api/admin/backup/auto");
    const data = await res.json();
    if (data.success) {
      setSuccess("✅ Auto backup complete!");
    } else {
      setSuccess(`ℹ️ ${data.message || "Checked"}`);
    }
    await fetchBackups();
    setAutoRunning(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  const totalBackups = backups.length;
  const manualCount = backups.filter(b => b.type === "MANUAL").length;
  const autoCount = backups.filter(b => b.type === "AUTO").length;
  const lastBackup = backups[0];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">💾 Data Backup & Recovery</h1>
          <p className="page-subtitle">Apna sab data safe rakhein — manual ya automatic backup</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleAutoNow} disabled={autoRunning} className="btn-secondary">
            {autoRunning ? "⏳ Running..." : "🔄 Auto Backup Now"}
          </button>
          <button onClick={handleManualBackup} disabled={downloading} className="btn-primary">
            {downloading ? "⏳ Downloading..." : "⬇️ Manual Backup"}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Alerts */}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#22c55e", marginBottom: "1rem" }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#ef4444", marginBottom: "1rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "1.5rem", alignItems: "start" }}>
          {/* LEFT — Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Stats */}
            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">📊 Backup Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Total Backups", value: totalBackups, color: "#c8a750" },
                  { label: "Manual", value: manualCount, color: "#818cf8" },
                  { label: "Auto", value: autoCount, color: "#22c55e" },
                  { label: "Aakhri", value: lastBackup ? timeAgo(lastBackup.createdAt) : "N/A", color: "#3b82f6", small: true },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                    <div style={{ fontSize: s.small ? "0.9rem" : "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Backup */}
            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">⬇️ Manual Backup</div>
              <p style={{ fontSize: "0.82rem", color: "#8899aa", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                Sab agents, properties, sectors aur activity logs ka complete JSON file download hoga.
              </p>
              <div style={{ marginBottom: "0.75rem" }}>
                <label className="label">Notes (optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g. Weekly backup, before update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                onClick={handleManualBackup}
                disabled={downloading}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                {downloading ? "⏳ Generating..." : "⬇️ Download Backup (JSON)"}
              </button>
            </div>

            {/* Auto Backup */}
            <div className="form-section" style={{ margin: 0 }}>
              <div className="form-section-title">🤖 Auto Backup</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#f0f4f8" }}>Auto Daily Backup</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#8899aa", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                ✅ Vercel pe deploy hone ke baad har roz <strong style={{ color: "#c8a750" }}>raat 2 baje</strong> auto backup hoga.<br />
                ✅ Supabase khud bhi <strong style={{ color: "#c8a750" }}>daily backup</strong> rakhta hai (last 7 days).<br />
                ✅ Yahan backup history track hoti hai.
              </div>
              <button
                onClick={handleAutoNow}
                disabled={autoRunning}
                className="btn-secondary"
                style={{ width: "100%" }}
              >
                {autoRunning ? "⏳ Running..." : "🔄 Run Auto Backup Now"}
              </button>
            </div>

            {/* Supabase Info */}
            <div style={{ padding: "1rem", background: "rgba(200,167,80,0.05)", border: "1px solid rgba(200,167,80,0.15)", borderRadius: "10px" }}>
              <div style={{ fontWeight: 700, color: "#c8a750", fontSize: "0.85rem", marginBottom: "0.5rem" }}>🔐 Supabase Built-in Backup</div>
              <ul style={{ fontSize: "0.78rem", color: "#8899aa", lineHeight: 1.8, paddingLeft: "1rem" }}>
                <li>Point-in-time recovery available</li>
                <li>Last 7 days ka data restore ho sakta hai</li>
                <li>Supabase Dashboard → Database → Backups</li>
              </ul>
            </div>
          </div>

          {/* RIGHT — Backup History */}
          <div>
            <div style={{ fontWeight: 700, color: "#c8a750", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              📋 Backup History
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#8899aa" }}>
                <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                Loading...
              </div>
            ) : backups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💾</div>
                <p>Koi backup nahi mila</p>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem" }}>Pehla backup banao ↖️</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Agents</th>
                      <th>Properties</th>
                      <th>Size</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f0f4f8" }}>{b.filename}</div>
                          {b.notes && <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>{b.notes}</div>}
                        </td>
                        <td>
                          <span style={{
                            padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700,
                            background: b.type === "MANUAL" ? "rgba(129,140,248,0.15)" : "rgba(34,197,94,0.15)",
                            color: b.type === "MANUAL" ? "#818cf8" : "#22c55e",
                          }}>
                            {b.type === "MANUAL" ? "⬇️ Manual" : "🤖 Auto"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{b.agentCount}</td>
                        <td style={{ fontSize: "0.85rem" }}>{b.propertyCount}</td>
                        <td style={{ fontSize: "0.82rem", color: "#8899aa" }}>{formatBytes(b.sizeBytes)}</td>
                        <td>
                          <div style={{ fontSize: "0.8rem", color: "#8899aa" }}>{timeAgo(b.createdAt)}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            {new Date(b.createdAt).toLocaleDateString("en-PK")}
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
      </div>
    </div>
  );
}
