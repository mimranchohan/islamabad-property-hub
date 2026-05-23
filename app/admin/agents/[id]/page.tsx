export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getPropertyTypeLabel } from "@/lib/utils";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.user.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { createdAt: "desc" }, take: 10 },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!agent) return notFound();

  const actionColors: Record<string, string> = {
    LOGIN: "#22c55e", LOGOUT: "#64748b", SEARCH: "#6366f1",
    VIEW_PROPERTY: "#3b82f6", ADD_PROPERTY: "#c8a750",
    EDIT_PROPERTY: "#f59e0b", DELETE_PROPERTY: "#ef4444",
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{agent.name}</h1>
          <p className="page-subtitle">{agent.agencyName || "Independent Agent"} • {agent.email}</p>
        </div>
        <span className={`badge ${agent.isActive ? "badge-active" : "badge-inactive"}`}>
          {agent.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="page-content">
        {/* Agent Info */}
        <div className="form-section" style={{ marginBottom: "1.5rem" }}>
          <div className="form-section-title">👤 Agent Profile</div>
          <div className="form-grid">
            {[
              { label: "Phone", value: agent.phone || "Not set" },
              { label: "Email", value: agent.email },
              { label: "Agency", value: agent.agencyName || "Not set" },
              { label: "Website", value: agent.website || "Not set" },
              { label: "Joined", value: new Date(agent.createdAt).toLocaleDateString("en-PK") },
              { label: "Last Login", value: agent.lastLogin ? new Date(agent.lastLogin).toLocaleString("en-PK") : "Never" },
            ].map((item) => (
              <div key={item.label}>
                <div className="label">{item.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Properties */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Properties ({agent.properties.length})
            </h2>
            {agent.properties.length === 0 ? (
              <div className="empty-state"><p>No properties yet</p></div>
            ) : (
              agent.properties.map((p) => (
                <div key={p.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>
                    {getPropertyTypeLabel(p.propertyType)} • {p.sector} • 
                    <span className={`badge badge-${p.status.toLowerCase()}`} style={{ marginLeft: "0.3rem" }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Activity Log ({agent.activityLogs.length})
            </h2>
            {agent.activityLogs.length === 0 ? (
              <div className="empty-state"><p>No activity yet</p></div>
            ) : (
              agent.activityLogs.map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-dot" style={{ background: actionColors[log.actionType] || "#8899aa" }} />
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{log.actionType.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>
                      {new Date(log.createdAt).toLocaleString("en-PK")}
                      {log.metadata && (() => {
                        try {
                          const m = JSON.parse(log.metadata);
                          if (m.query) return ` — Search: "${m.query}"`;
                        } catch { return ""; }
                        return "";
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
