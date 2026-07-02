import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;

import {
  extensionForImageMime,
  resolveImageMimeFromFile,
} from "@/lib/uploads/image-mime";

/**
 * Enregistre la photo d’avis sous `uploads/reviews/{adventureId}/`.
 * URL publique : `/uploads/reviews/...` (réécriture Next → `/api/uploads/...`).
 */
export async function saveReviewPhotoFile(params: {
  adventureId: string;
  file: File;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (params.file.size === 0) {
    return { ok: false, error: "Fichier photo vide." };
  }
  if (params.file.size > MAX_BYTES) {
    return { ok: false, error: "Photo trop volumineuse (max 5 Mo)." };
  }

  const mime = resolveImageMimeFromFile(params.file);
  const ext = extensionForImageMime(mime);
  if (!ext) {
    return { ok: false, error: "Format photo non supporté (fichier image requis)." };
  }

  const buf = Buffer.from(await params.file.arrayBuffer());
  const fileName = `${randomUUID()}${ext}`;
  const rel = path.join("reviews", params.adventureId, fileName).replace(/\\/g, "/");
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const dir = path.join(uploadsRoot, "reviews", params.adventureId);
  const absFile = path.join(uploadsRoot, rel);

  await mkdir(dir, { recursive: true });
  await writeFile(absFile, buf);

  return { ok: true, publicUrl: `/uploads/${rel}` };
}
