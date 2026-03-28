import "server-only";

import { getPermissionSubjectUserId } from "@/lib/auth/permission-subject";
import { auth } from "@/lib/auth";
import { admin, user, myCustomRole, superadmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/** Même `roles` que `adminPlugin({ roles })` dans `auth.ts` (équivalent à `hasPermission` interne Better Auth). */
const adminPluginPermissionOptions = {
  roles: {
    admin,
    user,
    myCustomRole,
    superadmin,
  },
  adminUserIds: [] as string[],
  defaultRole: "user",
} as const;

type PermissionMap = Record<string, string[]>;

function adminHasPermission(input: {
  userId: string;
  role: string;
  permissions: PermissionMap;
}): boolean {
  if (adminPluginPermissionOptions.adminUserIds.includes(input.userId)) {
    return true;
  }
  const opts = adminPluginPermissionOptions;
  const roles = (input.role || opts.defaultRole).split(",");
  const acRoles = opts.roles;
  const authorizeRole = (
    entry: (typeof acRoles)[keyof typeof acRoles] | undefined,
    perms: PermissionMap
  ) =>
    (entry as { authorize?: (r: PermissionMap) => { success: boolean } } | undefined)?.authorize?.(
      perms
    );

  for (const role of roles) {
    if (authorizeRole(acRoles[role as keyof typeof acRoles], input.permissions)?.success) {
      return true;
    }
  }
  return false;
}

export type UserHasPermissionBody = NonNullable<
  Parameters<typeof auth.api.userHasPermission>[0]
>["body"];

function normalizePermissions(body: UserHasPermissionBody): Record<string, string[]> {
  if ("permissions" in body && body.permissions) {
    return body.permissions as Record<string, string[]>;
  }
  if ("permission" in body && body.permission) {
    return body.permission as Record<string, string[]>;
  }
  return {};
}

/**
 * Contrôle d’accès aligné sur le plugin admin Better Auth, mais basé sur l’**acteur réel**
 * (champ `impersonatedBy` ou utilisateur courant), pas sur `session.user` seul — indispensable
 * sous impersonation car l’API `/admin/has-permission` priorise la session (utilisateur cible).
 *
 * @see https://better-auth.com/docs/plugins/admin#access-control-usage
 */
export async function userHasPermissionServer(
  body: UserHasPermissionBody,
): Promise<boolean> {
  const permissions = normalizePermissions(body);
  if (Object.keys(permissions).length === 0) {
    return false;
  }

  const subjectId = body.userId ?? (await getPermissionSubjectUserId());
  if (!subjectId) {
    return false;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { id: true, role: true },
  });
  if (!dbUser?.role) {
    return false;
  }

  return adminHasPermission({
    userId: dbUser.id,
    role: dbUser.role,
    permissions,
  });
}
