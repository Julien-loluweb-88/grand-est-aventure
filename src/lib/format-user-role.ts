const ROLE_LABELS: Record<string, string> = {
  user: "Utilisateur",
  admin: "Admin",
  superadmin: "Super admin",
  myCustomRole: "Rôle personnalisé",
};

export function formatUserRoleLabel(role: string | undefined | null): string {
  const key = role ?? "user";
  return ROLE_LABELS[key] ?? key;
}
