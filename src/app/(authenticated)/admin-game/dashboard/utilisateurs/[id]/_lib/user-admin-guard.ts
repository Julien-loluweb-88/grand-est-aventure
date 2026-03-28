import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isSuperadmin } from "@/lib/admin-access";
import { roleHasRoutePermission } from "@/lib/permissions";

export async function requireUserPermission(permission: "get" | "update" | "ban" | "delete") {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user;
  if (!currentUser) {
    throw new Error("Non autorisé.");
  }
  if (!roleHasRoutePermission(currentUser.role, "user", permission)) {
    throw new Error("Non autorisé.");
  }
  return currentUser;
}

export async function requireSuperadmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user;
  if (!currentUser || !isSuperadmin(currentUser.role)) {
    throw new Error("Non autorisé.");
  }
  return currentUser;
}
