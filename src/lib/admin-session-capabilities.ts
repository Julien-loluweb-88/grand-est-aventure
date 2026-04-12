import { getSession } from "@/lib/auth/auth-user";
import { getPermissionSubjectUserId } from "@/lib/auth/permission-subject";
import { isSuperadmin } from "@/lib/admin-access";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { prisma } from "@/lib/prisma";

export type AdminSessionCapabilities = {
  /** Compte `merchant` : shell web réduit (pas d’aventures / pubs / OpenAPI). */
  merchantPortal: boolean;
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
    create: boolean;
    setPassword: boolean;
    impersonate: boolean;
  };
  session: {
    list: boolean;
    revoke: boolean;
  };
  canAssignRolesAndScopes: boolean;
};

export async function getAdminSessionCapabilities(): Promise<AdminSessionCapabilities | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const subjectId = await getPermissionSubjectUserId();
  if (!subjectId) {
    return null;
  }

  const actorRow = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { role: true },
  });

  if (actorRow?.role === "merchant") {
    return {
      merchantPortal: true,
      adventure: { read: false, create: false, update: false, delete: false },
      user: {
        get: false,
        update: false,
        ban: false,
        delete: false,
        create: false,
        setPassword: false,
        impersonate: false,
      },
      session: { list: false, revoke: false },
      canAssignRolesAndScopes: false,
    };
  }

  const canAccessDashboard = await userHasPermissionServer({
    permissions: { adventure: ["read"] },
  });
  if (!canAccessDashboard) {
    return null;
  }

  const [
    advCreate,
    advUpdate,
    advDelete,
    uGet,
    uUpdate,
    uBan,
    uDelete,
    uCreate,
    uSetPassword,
    uImpersonate,
    sList,
    sRevoke,
  ] = await Promise.all([
    userHasPermissionServer({ permissions: { adventure: ["create"] } }),
    userHasPermissionServer({ permissions: { adventure: ["update"] } }),
    userHasPermissionServer({ permissions: { adventure: ["delete"] } }),
    userHasPermissionServer({ permissions: { user: ["get"] } }),
    userHasPermissionServer({ permissions: { user: ["update"] } }),
    userHasPermissionServer({ permissions: { user: ["ban"] } }),
    userHasPermissionServer({ permissions: { user: ["delete"] } }),
    userHasPermissionServer({ permissions: { user: ["create"] } }),
    userHasPermissionServer({ permissions: { user: ["set-password"] } }),
    userHasPermissionServer({ permissions: { user: ["impersonate"] } }),
    userHasPermissionServer({ permissions: { session: ["list"] } }),
    userHasPermissionServer({ permissions: { session: ["revoke"] } }),
  ]);

  return {
    merchantPortal: false,
    adventure: {
      read: canAccessDashboard,
      create: advCreate,
      update: advUpdate,
      delete: advDelete,
    },
    user: {
      get: uGet,
      update: uUpdate,
      ban: uBan,
      delete: uDelete,
      create: uCreate,
      setPassword: uSetPassword,
      impersonate: uImpersonate,
    },
    session: {
      list: sList,
      revoke: sRevoke,
    },
    canAssignRolesAndScopes: isSuperadmin(actorRow?.role),
  };
}
