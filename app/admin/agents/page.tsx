export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AgentToggle from "./AgentToggle";

export default async function AgentsPage() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { properties: true, activityLogs: true } },
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents Management</h1>
          <p className="page-subtitle">{agents.length} agents registered</p>
        </div>
        <Link href="/admin/agents/add" className="btn-primary" style={{ textDecoration: "none" }}>
          + Add Agent
        </Link>
      </div>

      <div className="page-content">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Contact</th>
                <th>Agency</th>
                <th>Properties</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#8899aa" }}>
                    No agents yet. <Link href="/admin/agents/add" style={{ color: "#c8a750" }}>Add first agent →</Link>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{agent.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#8899aa" }}>{agent.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>{agent.phone || "-"}</div>
                      {agent.website && (
                        <a href={agent.website} target="_blank" style={{ fontSize: "0.75rem", color: "#c8a750" }}>
                          Website ↗
                        </a>
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{agent.agencyName || "-"}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#c8a750" }}>{agent._count.properties}</span>
                      <span style={{ color: "#8899aa", fontSize: "0.8rem" }}> listings</span>
                    </td>
                    <td>
                      <AgentToggle agentId={agent.id} isActive={agent.isActive} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          href={`/admin/agents/${agent.id}`}
                          style={{
                            padding: "0.35rem 0.75rem",
                            background: "rgba(99,102,241,0.15)",
                            color: "#818cf8",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                          }}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
