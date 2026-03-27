import { getUser } from "@/lib/auth/auth-user";
import { isAdminRole, isSuperadmin } from "@/lib/admin-access";
import { roleHasRoutePermission } from "@/lib/permissions";

export type AdminSessionCapabilities = {
  adventure: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  user: {
    get: boolean;
    update: boolean;
    ban: boolean;
    delete: boolean;
  };
  canAssignRolesAndScopes: boolean;
};

/** Capacités UI — même matrice que `routePermissionsByRole` / `roleHasRoutePermission` / proxy. */
export async function getAdminSessionCapabilities(): Promise<AdminSessionCapabilities | null> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  const r = user.role;

  return {
    adventure: {
      read: roleHasRoutePermission(r, "adventure", "read"),
      create: roleHasRoutePermission(r, "adventure", "create"),
      update: roleHasRoutePermission(r, "adventure", "update"),
      delete: roleHasRoutePermission(r, "adventure", "delete"),
    },
    user: {
      get: roleHasRoutePermission(r, "user", "get"),
      update: roleHasRoutePermission(r, "user", "update"),
      ban: roleHasRoutePermission(r, "user", "ban"),
      delete: roleHasRoutePermission(r, "user", "delete"),
    },
    canAssignRolesAndScopes: isSuperadmin(r),
  };
}
