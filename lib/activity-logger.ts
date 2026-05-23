import { prisma } from "./prisma";

export async function logActivity({
  agentId,
  actionType,
  metadata,
  ipAddress,
  propertyId,
}: {
  agentId: string;
  actionType: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  propertyId?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        agentId,
        actionType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
        propertyId: propertyId || null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
