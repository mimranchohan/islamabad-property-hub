"use client";
import { useState } from "react";

export default function AgentToggle({ agentId, isActive }: { agentId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/toggle`, { method: "PATCH" });
      const data = await res.json();
      setActive(data.isActive);
    } catch {
      // revert on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <label className="toggle-switch">
        <input type="checkbox" checked={active} onChange={toggle} disabled={loading} />
        <span className="toggle-slider" />
      </label>
      <span style={{ fontSize: "0.75rem", color: active ? "#22c55e" : "#64748b", fontWeight: 600 }}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
