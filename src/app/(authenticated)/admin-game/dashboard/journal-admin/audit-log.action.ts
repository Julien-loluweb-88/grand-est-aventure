"use server";

import { getUser } from "@/lib/auth/auth-user";
import { isSuperadmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function listAdminAuditLogs() {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }

  const entries = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      actor: { select: { id: true, email: true, name: true } },
      target: { select: { id: true, email: true, name: true } },
    },
  });

  return { ok: true as const, entries };
}
