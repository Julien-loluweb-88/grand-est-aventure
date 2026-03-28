import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  userHasPermissionServer,
  type UserHasPermissionBody,
} from "@/lib/better-auth-admin-permission";
import type { RoutePermissionResource } from "@/lib/permissions";

export async function requireUserPermission(permission: "get" | "update" | "ban" | "delete") {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user;
  if (!currentUser) {
    throw new Error("Non autorisé.");
  }
  const allowed = await userHasPermissionServer({
    permissions: { user: [permission] },
  } satisfies UserHasPermissionBody);
  if (!allowed) {
    throw new Error("Non autorisé.");
  }
  return currentUser;
}

export async function requireSuperadmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user;
  if (!currentUser) {
    throw new Error("Non autorisé.");
  }
  const allowed = await userHasPermissionServer({
    permissions: { user: ["set-role"] },
  } satisfies UserHasPermissionBody);
  if (!allowed) {
    throw new Error("Non autorisé.");
  }
  return currentUser;
}

export async function requireRoutePermission(
  resource: RoutePermissionResource,
  action: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user;
  if (!currentUser) {
    throw new Error("Non autorisé.");
  }
  const permissions = {
    [resource]: [action],
  } as UserHasPermissionBody["permissions"];
  const allowed = await userHasPermissionServer({
    permissions,
  } satisfies UserHasPermissionBody);
  if (!allowed) {
    throw new Error("Non autorisé.");
  }
  return currentUser;
}
