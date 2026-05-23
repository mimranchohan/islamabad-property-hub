export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { getPropertyTypeLabel, formatPrice, formatArea } from "@/lib/utils";

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { name: true, agencyName: true } } },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Properties</h1>
          <p className="page-subtitle">{properties.length} total listings across all agents</p>
        </div>
      </div>

      <div className="page-content">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Price</th>
                <th>Size</th>
                <th>Sector</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#8899aa" }}>
                    No properties listed yet
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: "200px" }}>{p.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>{p.purpose === "FOR_SALE" ? "For Sale" : "For Rent"}</div>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{getPropertyTypeLabel(p.propertyType)}</td>
                    <td style={{ fontSize: "0.85rem", color: "#c8a750", fontWeight: 600 }}>
                      {formatPrice(p.price, p.priceUnit)}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{formatArea(p.areaSize, p.areaUnit)}</td>
                    <td style={{ fontSize: "0.85rem" }}>{p.sector}</td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{p.agent.name}</div>
                      {p.agent.agencyName && <div style={{ fontSize: "0.72rem", color: "#8899aa" }}>{p.agent.agencyName}</div>}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#8899aa" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-PK")}
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
