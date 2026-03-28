import "server-only";

import { getSession } from "@/lib/auth/auth-user";

/**
 * Identifiant Better Auth à utiliser pour `userHasPermission` : l’admin réel si session
 * d’impersonation, sinon l’utilisateur connecté.
 */
export async function getPermissionSubjectUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const impersonatedBy =
    session.session &&
    typeof session.session === "object" &&
    "impersonatedBy" in session.session
      ? (session.session as { impersonatedBy?: string | null }).impersonatedBy
      : undefined;
  if (impersonatedBy) return impersonatedBy;
  return session.user.id;
}
