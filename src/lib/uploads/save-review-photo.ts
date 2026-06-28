import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;

import {
  extensionForImageMime,
  resolveImageMimeFromFile,
} from "@/lib/uploads/image-mime";

const DATA_URL_RE = /^data:(image\/[^;]+);base64,(.+)$/i;

async function writeReviewPhotoBuffer(params: {
  adventureId: string;
  buffer: Buffer;
  mime: string | null;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (params.buffer.length === 0) {
    return { ok: false, error: "Fichier photo vide." };
  }
  if (params.buffer.length > MAX_BYTES) {
    return { ok: false, error: "Photo trop volumineuse (max 5 Mo)." };
  }

  const mime = params.mime?.trim();
  if (!mime) {
    return { ok: false, error: "Format photo non supporté (fichier image requis)." };
  }

  const ext = extensionForImageMime(mime);
  if (!ext) {
    return { ok: false, error: "Format photo non supporté (fichier image requis)." };
  }

  const fileName = `${randomUUID()}${ext}`;
  const rel = path.join("reviews", params.adventureId, fileName).replace(/\\/g, "/");
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const dir = path.join(uploadsRoot, "reviews", params.adventureId);
  const absFile = path.join(uploadsRoot, rel);

  await mkdir(dir, { recursive: true });
  await writeFile(absFile, params.buffer);

  return { ok: true, publicUrl: `/uploads/${rel}` };
}

/**
 * Enregistre une photo d’avis depuis une chaîne base64 ou data-URL (`data:image/...;base64,...`).
 */
export async function saveReviewPhotoFromBase64(params: {
  adventureId: string;
  base64: string;
  mimeType?: string | null;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const raw = params.base64.trim();
  if (!raw) {
    return { ok: false, error: "Photo base64 vide." };
  }

  let mime = params.mimeType?.trim() || null;
  let encoded = raw;
  const dataUrlMatch = raw.match(DATA_URL_RE);
  if (dataUrlMatch) {
    mime = dataUrlMatch[1] ?? mime;
    encoded = dataUrlMatch[2] ?? encoded;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(encoded, "base64");
  } catch {
    return { ok: false, error: "Photo base64 invalide." };
  }

  return writeReviewPhotoBuffer({
    adventureId: params.adventureId,
    buffer,
    mime,
  });
}

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
  return writeReviewPhotoBuffer({
    adventureId: params.adventureId,
    buffer: buf,
    mime,
  });
}
