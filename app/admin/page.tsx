import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  const [totalAgents, activeAgents, totalProperties, recentActivity] = await Promise.all([
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "AGENT", isActive: true } }),
    prisma.property.count(),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { name: true } } },
    }),
  ]);

  const propertiesByStatus = await prisma.property.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const statusMap = propertiesByStatus.reduce((acc, s) => {
    acc[s.status] = s._count.status;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: "Total Agents", value: totalAgents, icon: "👥", color: "#6366f1" },
    { label: "Active Agents", value: activeAgents, icon: "✅", color: "#22c55e" },
    { label: "Total Properties", value: totalProperties, icon: "🏠", color: "#c8a750" },
    { label: "Active Listings", value: statusMap["ACTIVE"] || 0, icon: "📋", color: "#3b82f6" },
    { label: "Sold", value: statusMap["SOLD"] || 0, icon: "🔴", color: "#ef4444" },
    { label: "Rented", value: statusMap["RENTED"] || 0, icon: "🟡", color: "#f59e0b" },
  ];

  const actionColors: Record<string, string> = {
    LOGIN: "#22c55e",
    LOGOUT: "#64748b",
    SEARCH: "#6366f1",
    VIEW_PROPERTY: "#3b82f6",
    ADD_PROPERTY: "#c8a750",
    EDIT_PROPERTY: "#f59e0b",
    DELETE_PROPERTY: "#ef4444",
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {session?.user?.name || "Administrator"}</p>
        </div>
        <Link href="/admin/agents/add" className="btn-primary" style={{ textDecoration: "none" }}>
          + Add New Agent
        </Link>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20` }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#8899aa", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Recent Activity */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Recent Activity</h2>
              <Link href="/admin/activity" style={{ color: "#c8a750", fontSize: "0.8rem", textDecoration: "none" }}>
                View All →
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No activity yet</p>
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-dot" style={{ background: actionColors[log.actionType] || "#8899aa" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{log.agent.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>
                      {log.actionType.replace(/_/g, " ")} •{" "}
                      {new Date(log.createdAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { href: "/admin/agents", label: "Manage Agents", icon: "👥", desc: "Add, activate, or remove agents" },
                { href: "/admin/properties", label: "View All Properties", icon: "🏠", desc: "Browse all listed properties" },
                { href: "/admin/activity", label: "Activity Logs", icon: "👁️", desc: "See what agents are doing" },
                { href: "/admin/agents/add", label: "Add New Agent", icon: "➕", desc: "Register a new property agent" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  className="nav-link"
                >
                  <span style={{ fontSize: "1.25rem" }}>{action.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f4f8" }}>{action.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
