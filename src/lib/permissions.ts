import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/** Comme la doc Admin : vocabulaire complet `user` / `session` + ressources métier. */
const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
  adventure: ["read", "create", "update", "delete"],
} as const;
export const ac = createAccessControl(statement);

/** Droits utilisés par Better Auth et par le proxy (une seule source). */
const ADVENTURE_PERMS_FULL = ["read", "create", "update", "delete"] as const;
/**
 * Admin client (commune) : uniquement lecture + édition du contenu des aventures qui lui sont assignées.
 * Création / suppression d'aventure = superadmin (toi).
 */
const ADVENTURE_PERMS_CLIENT = ["read", "update"] as const;
/** Admin métier : pas la gestion des comptes utilisateurs. */
const ADMIN_USER_PERMS = [] as const;
/** Inclut `impersonate-admins` comme dans la doc Better Auth (superadmin peut impersonner d’autres admins). */
const SUPERADMIN_USER_PERMS = [
  ...(adminAc.statements.user ?? []),
  "impersonate-admins",
  "get",
  "create",
  "update",
  "delete",
  "ban",
] as const;

const SUPERADMIN_SESSION_PERMS = [...(adminAc.statements.session ?? [])] as const;

export type RoutePermissionResource = "adventure" | "user" | "session";

/**
 * ## Source unique des droits dashboard admin (UI, proxy, actions serveur)
 *
 * Ce tableau définit ce que chaque rôle peut faire sur les ressources `adventure` et `user`.
 * Ne pas dupliquer cette logique ailleurs : utiliser `roleHasRoutePermission`,
 * les helpers `adventure-authorization` (acteur + périmètre aventure),
 * ou `getAdminSessionCapabilities` pour l’UI dashboard.
 *
 * Les rôles Better Auth (`admin`, `superadmin` dans `auth.ts`) doivent rester alignés avec ces listes
 * (mêmes actions sur les mêmes ressources). Le périmètre par aventure (`AdminAdventureAccess`)
 * s’ajoute côté serveur via `adventure-authorization` (`canActOnAdventure` + `canManageAdventure`).
 *
 * Le fichier `proxy.ts` applique en plus une **liste blanche** des chemins dashboard : toute nouvelle
 * section sous `/admin-game/dashboard/` doit y être autorisée (préfixe dédié + rôles, ou page d’accueil /
 * `acces-refuse` / `parametres`). Ex. : `demandes-aventures`, `journal-admin` (superadmin).
 */
export const routePermissionsByRole = {
  admin: {
    adventure: ADVENTURE_PERMS_CLIENT,
    user: ADMIN_USER_PERMS,
    session: [] as const,
  },
  superadmin: {
    adventure: ADVENTURE_PERMS_FULL,
    user: SUPERADMIN_USER_PERMS,
    session: SUPERADMIN_SESSION_PERMS,
  },
} as const;

export type DashboardAdminRole = keyof typeof routePermissionsByRole;

/** Vérifie un droit « route » à partir du rôle session (proxy, server actions, UI). */
export function roleHasRoutePermission(
  role: string | null | undefined,
  resource: RoutePermissionResource,
  action: string
): boolean {
  if (!role) return false;
  const matrix = routePermissionsByRole[role as DashboardAdminRole];
  if (!matrix) return false;
  const list = matrix[resource] as readonly string[];
  return list.includes(action);
}

/** Raccourci pour la ressource `adventure` (liste + détail + actions serveur). */
export function roleHasAdventurePermission(
  role: string | null | undefined,
  action: "read" | "create" | "update" | "delete"
): boolean {
  return roleHasRoutePermission(role, "adventure", action);
}

export const user = ac.newRole({ 
    project: ["create"], 
}); 

export const admin = ac.newRole({ 
    project: ["create", "update", "delete"],
    ...adminAc.statements,
    user: [...routePermissionsByRole.admin.user],
    adventure: [...routePermissionsByRole.admin.adventure],
}); 

export const superadmin = ac.newRole({
  project: ["create", "update", "delete"],
  ...adminAc.statements,
  user: [...routePermissionsByRole.superadmin.user],
  adventure: [...routePermissionsByRole.superadmin.adventure],
});

export const myCustomRole = ac.newRole({ 
    project: ["create", "update", "delete"], 
    user: ["ban"], 
}); 