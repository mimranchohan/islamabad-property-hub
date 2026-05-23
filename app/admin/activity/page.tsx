export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

const actionColors: Record<string, string> = {
  LOGIN: "#22c55e", LOGOUT: "#64748b", SEARCH: "#6366f1",
  VIEW_PROPERTY: "#3b82f6", ADD_PROPERTY: "#c8a750",
  EDIT_PROPERTY: "#f59e0b", DELETE_PROPERTY: "#ef4444",
};

export default async function ActivityPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      agent: { select: { name: true, email: true } },
      property: { select: { title: true } },
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">All agent activity — real-time surveillance</p>
        </div>
        <span style={{ color: "#8899aa", fontSize: "0.85rem" }}>Last 100 activities</span>
      </div>

      <div className="page-content">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Details</th>
                <th>Property</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#8899aa" }}>
                    No activity logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let details = "";
                  try {
                    if (log.metadata) {
                      const m = JSON.parse(log.metadata);
                      if (m.query) details = `Search: "${m.query}"`;
                      else if (m.sector) details = `Sector: ${m.sector}`;
                      else if (m.propertyTitle) details = m.propertyTitle;
                      else if (m.changes) details = `Changed: ${m.changes.join(", ")}`;
                    }
                  } catch {}

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.8rem", color: "#8899aa", whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{log.agent.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>{log.agent.email}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: `${actionColors[log.actionType] || "#8899aa"}20`,
                          color: actionColors[log.actionType] || "#8899aa",
                        }}>
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#8899aa" }}>{details || "-"}</td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {log.property?.title ? (
                          <span style={{ color: "#c8a750" }}>{log.property.title}</span>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
