import "server-only";

import { getPermissionSubjectUserId } from "@/lib/auth/permission-subject";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { prisma } from "@/lib/prisma";

export type AdminActor = { id: string; role: string };

/**
 * Acteur des actions dashboard aventure : admin réel si impersonation, sinon l’utilisateur connecté.
 * À utiliser pour les droits et le périmètre `AdminAdventureAccess` (pas `session.user` brut).
 */
export async function getAdminActorForAuthorization(): Promise<AdminActor | null> {
  const subjectId = await getPermissionSubjectUserId();
  if (!subjectId) return null;
  const u = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { id: true, role: true },
  });
  if (!u?.role || !isAdminRole(u.role)) return null;
  return { id: u.id, role: u.role };
}

/** Matrice `adventure` (plugin admin) + périmètre assigné (sauf superadmin). */
export async function canActOnAdventure(
  actor: AdminActor,
  adventureId: string,
  action: "read" | "update" | "delete"
): Promise<boolean> {
  if (!(await userHasPermissionServer({ permissions: { adventure: [action] } }))) {
    return false;
  }
  return canManageAdventure({
    userId: actor.id,
    role: actor.role,
    adventureId,
  });
}

export async function canCreateAdventure(): Promise<boolean> {
  return userHasPermissionServer({ permissions: { adventure: ["create"] } });
}

export type AdventureGateOk = { ok: true; actor: AdminActor };
export type AdventureGateFail = { ok: false };

export async function gateAdventureAction(
  adventureId: string,
  action: "read" | "update" | "delete"
): Promise<AdventureGateOk | AdventureGateFail> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { ok: false };
  if (!(await canActOnAdventure(actor, adventureId, action))) {
    return { ok: false };
  }
  return { ok: true, actor };
}

export async function gateAdventureUpdateContent(
  adventureId: string
): Promise<AdventureGateOk | AdventureGateFail> {
  return gateAdventureAction(adventureId, "update");
}

/** Téléversements images pour l’éditeur riche avant qu’une aventure existe (création). */
export async function gateAdventureDraftUpload(): Promise<
  AdventureGateOk | AdventureGateFail
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { ok: false };
  if (!(await canCreateAdventure())) {
    return { ok: false };
  }
  return { ok: true, actor };
}
