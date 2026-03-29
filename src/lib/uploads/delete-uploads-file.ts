import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"] as const;

/** Chemin relatif à `uploads/` (ex. `adventures/id/cover.jpg`) depuis une URL publique. */
export function uploadsRelativePathFromPublicUrl(
  url: string | null | undefined
): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  try {
    if (t.startsWith("http://") || t.startsWith("https://")) {
      const u = new URL(t);
      const idx = u.pathname.indexOf("/uploads/");
      if (idx === -1) return null;
      return safeRel(u.pathname.slice(idx + "/uploads/".length));
    }
  } catch {
    return null;
  }
  if (t.startsWith("/uploads/")) {
    return safeRel(t.slice("/uploads/".length));
  }
  return null;
}

function safeRel(rel: string): string | null {
  const n = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!n || n.includes("..")) return null;
  return n;
}

export async function deleteUploadsFileByRelativePath(rel: string): Promise<void> {
  const safe = safeRel(rel);
  if (!safe) return;
  const root = path.resolve(process.cwd(), "uploads");
  const abs = path.resolve(root, safe);
  if (abs !== root && !abs.startsWith(root + path.sep)) return;
  try {
    await unlink(abs);
  } catch {
    /* fichier absent */
  }
}

export async function deleteUploadsFileByUrl(url: string | null | undefined): Promise<void> {
  const rel = uploadsRelativePathFromPublicUrl(url);
  if (rel) await deleteUploadsFileByRelativePath(rel);
}

/**
 * Supprime toutes les variantes d’extension pour un « slot » sous `uploads/adventures/{adventureId}/`.
 * @param stemRelativeToAdventure ex. `cover`, `badge`, `treasure`, `enigmas/{id}`
 */
export async function removeAdventureImageStem(
  adventureId: string,
  stemRelativeToAdventure: string
): Promise<void> {
  if (!adventureId || adventureId.includes("..")) return;
  const normalized = stemRelativeToAdventure
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("..")) return;
  const root = path.join(process.cwd(), "uploads", "adventures", adventureId);
  const segments = normalized.split("/");
  const fileStem = segments.pop()!;
  const dir = segments.length ? path.join(root, ...segments) : root;
  for (const ext of IMAGE_EXTS) {
    try {
      await unlink(path.join(dir, fileStem + ext));
    } catch {
      /* absent */
    }
  }
}
