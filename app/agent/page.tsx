export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPropertyTypeLabel } from "@/lib/utils";

export default async function AgentDashboard() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  // Guard: if no valid session, middleware will redirect — but this is defense-in-depth
  if (!userId) redirect("/login");

  const [myProperties, recentProperties] = await Promise.all([
    prisma.property.groupBy({ by: ["status"], where: { agentId: userId }, _count: { status: true } }),
    prisma.property.findMany({ where: { agentId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const statusMap = myProperties.reduce((acc, s) => {
    acc[s.status] = s._count.status;
    return acc;
  }, {} as Record<string, number>);

  const total = myProperties.reduce((sum, s) => sum + s._count.status, 0);

  const stats = [
    { label: "Total Listings", value: total, icon: "🏠", color: "#c8a750" },
    { label: "Active", value: statusMap["ACTIVE"] || 0, icon: "✅", color: "#22c55e" },
    { label: "Sold", value: statusMap["SOLD"] || 0, icon: "🔴", color: "#ef4444" },
    { label: "Rented", value: statusMap["RENTED"] || 0, icon: "🟡", color: "#f59e0b" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {session?.user?.name}</p>
        </div>
        <Link href="/agent/properties/add" className="btn-primary" style={{ textDecoration: "none" }}>
          + Add Property
        </Link>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20` }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", color: "#8899aa", fontWeight: 500 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          {/* Recent properties */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Recent Listings</h2>
              <Link href="/agent/properties" style={{ color: "#c8a750", fontSize: "0.8rem", textDecoration: "none" }}>View All →</Link>
            </div>
            {recentProperties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏠</div>
                <p>No properties yet</p>
                <Link href="/agent/properties/add" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: "1rem" }}>
                  Add First Property
                </Link>
              </div>
            ) : (
              recentProperties.map((p) => (
                <div key={p.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>
                      {getPropertyTypeLabel(p.propertyType)} • {p.sector} • {p.areaSize} {p.areaUnit}
                    </div>
                  </div>
                  <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { href: "/agent/properties/add", label: "Add Property", icon: "➕" },
                { href: "/agent/search", label: "Search Properties", icon: "🔍" },
                { href: "/agent/properties", label: "My Listings", icon: "📋" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="nav-link"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", textDecoration: "none" }}
                >
                  <span>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
