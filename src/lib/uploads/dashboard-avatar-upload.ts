import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { gateAvatarAssetsUpload } from "@/lib/adventure-authorization";
import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_IMAGE_MIME_TO_EXT,
  DASHBOARD_UPLOAD_MAX_BYTES,
} from "@/lib/uploads/dashboard-image-upload";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

/** Limite dédiée aux fichiers `.glb` (modèles compagnons) — alignée avec `proxyClientMaxBodySize` / serverActions. */
export const AVATAR_MODEL_MAX_BYTES = 100 * 1024 * 1024;

export type SaveAvatarUploadResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

function publicUrlForRelative(rel: string) {
  return `/uploads/${rel.replace(/^\/+/, "")}`;
}

function safeAvatarId(avatarId: string): boolean {
  const t = avatarId.trim();
  return t.length > 0 && !t.includes("..") && !t.includes("/") && !t.includes("\\");
}

async function loadAvatarRow(avatarId: string) {
  return prisma.avatar.findUnique({
    where: { id: avatarId },
    select: { id: true, thumbnailUrl: true, modelUrl: true },
  });
}

/**
 * Enregistre une vignette sous `uploads/avatars/{avatarId}/thumbnail.{ext}` et met à jour `Avatar.thumbnailUrl`.
 */
export async function saveAvatarThumbnailFromUpload(params: {
  avatarId: string;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<SaveAvatarUploadResult> {
  const gate = await gateAvatarAssetsUpload();
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!safeAvatarId(params.avatarId)) {
    return { ok: false, error: "Identifiant d’avatar invalide." };
  }
  if (params.fileBuffer.length > DASHBOARD_UPLOAD_MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux." };
  }

  const row = await loadAvatarRow(params.avatarId);
  if (!row) {
    return { ok: false, error: "Avatar introuvable." };
  }

  const ext = DASHBOARD_IMAGE_MIME_TO_EXT.get(params.mimeType);
  if (!ext) {
    return { ok: false, error: "Image : JPEG, PNG ou WebP uniquement." };
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const dirAbs = path.join(uploadsRoot, "avatars", params.avatarId);
  await mkdir(dirAbs, { recursive: true });

  for (const e of [".jpg", ".jpeg", ".png", ".webp"] as const) {
    if (e === ext) continue;
    try {
      await unlink(path.join(dirAbs, `thumbnail${e}`));
    } catch {
      /* absent */
    }
  }

  const relative = path.join("avatars", params.avatarId, `thumbnail${ext}`).replace(/\\/g, "/");
  const absFile = path.join(uploadsRoot, relative);
  await writeFile(absFile, params.fileBuffer);
  const url = publicUrlForRelative(relative);

  await deleteUploadsFileByUrl(row.thumbnailUrl);
  await prisma.avatar.update({
    where: { id: row.id },
    data: { thumbnailUrl: url },
  });

  return { ok: true, publicUrl: url };
}

function isAllowedGlbMime(mimeType: string, originalFilename: string | undefined): boolean {
  const m = mimeType.toLowerCase().trim();
  if (m === "model/gltf-binary") return true;
  if (m === "application/octet-stream" || m === "binary/octet-stream") {
    const name = (originalFilename ?? "").toLowerCase();
    return name.endsWith(".glb");
  }
  return false;
}

/**
 * Enregistre un unique `model.glb` sous `uploads/avatars/{avatarId}/` et met à jour `Avatar.modelUrl`.
 */
export async function saveAvatarModelFromUpload(params: {
  avatarId: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalFilename?: string;
}): Promise<SaveAvatarUploadResult> {
  const gate = await gateAvatarAssetsUpload();
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!safeAvatarId(params.avatarId)) {
    return { ok: false, error: "Identifiant d’avatar invalide." };
  }
  if (!isAllowedGlbMime(params.mimeType, params.originalFilename)) {
    return {
      ok: false,
      error: "Modèle : fichier .glb uniquement (type model/gltf-binary ou .glb en octet-stream).",
    };
  }
  if (params.fileBuffer.length > AVATAR_MODEL_MAX_BYTES) {
    const maxMb = AVATAR_MODEL_MAX_BYTES / (1024 * 1024);
    return { ok: false, error: `Modèle trop volumineux (max ${maxMb} Mo).` };
  }

  const row = await loadAvatarRow(params.avatarId);
  if (!row) {
    return { ok: false, error: "Avatar introuvable." };
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const dirAbs = path.join(uploadsRoot, "avatars", params.avatarId);
  await mkdir(dirAbs, { recursive: true });

  const relative = path.join("avatars", params.avatarId, "model.glb").replace(/\\/g, "/");
  const absFile = path.join(uploadsRoot, relative);

  await deleteUploadsFileByUrl(row.modelUrl);
  await writeFile(absFile, params.fileBuffer);
  const url = publicUrlForRelative(relative);

  await prisma.avatar.update({
    where: { id: row.id },
    data: { modelUrl: url },
  });

  return { ok: true, publicUrl: url };
}
