/**
 * Ordre d’affichage des opérations dans Swagger UI (même logique que la spec : parcours métier).
 * Chemins absolus tels que dans OpenAPI `paths`.
 */
export const SWAGGER_PATH_ORDER: readonly string[] = [
  "/api/auth/{path}",
  "/api/game/adventures",
  "/api/game/adventures/{id}",
  "/api/game/cities",
  "/api/game/progress",
  "/api/game/validate-enigma",
  "/api/game/validate-treasure",
  "/api/game/adventure-review",
  "/api/game/adventure-reviews",
  "/api/game/adventure-reviews/{id}",
  "/api/advertisements",
  "/api/advertisements/events",
  "/api/partner-offers/claims",
  "/api/merchant/partner-claims",
  "/api/merchant/partner-claims/{id}/resolve",
  "/api/cron/expire-partner-claims",
  "/api/user/badges",
  "/api/user/advertisement-dismissals",
  "/api/admin-game/permission-context",
  "/api/uploads/{path}",
];

const METHOD_ORDER: Record<string, number> = {
  get: 0,
  post: 1,
  put: 2,
  patch: 3,
  delete: 4,
  head: 5,
  options: 6,
};

export const SWAGGER_TAG_ORDER: readonly string[] = [
  "Authentification",
  "Jeu",
  "Publicités",
  "Offres partenaires",
  "Utilisateur",
  "Cron",
  "Admin",
  "Fichiers",
];

function pathOrderIndex(path: string): number {
  const i = SWAGGER_PATH_ORDER.indexOf(path);
  return i === -1 ? 999 : i;
}

/** Swagger UI passe des objets Immutable avec `.get("path")` / `.get("method")`. */
function getPathAndMethod(op: unknown): { path: string; method: string } {
  if (
    op &&
    typeof op === "object" &&
    "get" in op &&
    typeof (op as { get?: unknown }).get === "function"
  ) {
    const get = (op as { get: (k: string) => unknown }).get.bind(op);
    return {
      path: String(get("path") ?? ""),
      method: String(get("method") ?? "").toLowerCase(),
    };
  }
  const s = String(op);
  const idx = s.indexOf(" ");
  if (idx > 0) {
    return { method: s.slice(0, idx).toLowerCase(), path: s.slice(idx + 1).trim() };
  }
  return { path: s, method: "" };
}

export function swaggerOperationsSorter(a: unknown, b: unknown): number {
  const pa = getPathAndMethod(a);
  const pb = getPathAndMethod(b);
  const pathDiff = pathOrderIndex(pa.path) - pathOrderIndex(pb.path);
  if (pathDiff !== 0) return pathDiff;
  const ma = METHOD_ORDER[pa.method] ?? 99;
  const mb = METHOD_ORDER[pb.method] ?? 99;
  if (ma !== mb) return ma - mb;
  return pa.path.localeCompare(pb.path);
}

export function swaggerTagsSorter(a: unknown, b: unknown): number {
  const sa = String(a);
  const sb = String(b);
  const ia = SWAGGER_TAG_ORDER.indexOf(sa);
  const ib = SWAGGER_TAG_ORDER.indexOf(sb);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return sa.localeCompare(sb);
}
