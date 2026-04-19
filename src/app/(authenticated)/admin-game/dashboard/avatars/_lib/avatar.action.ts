"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";
import {
  saveAvatarModelFromUpload,
  saveAvatarThumbnailFromUpload,
} from "@/lib/uploads/dashboard-avatar-upload";

const SLUG_RE = /^[a-z][a-z0-9_]{1,48}$/;
const NAME_MAX = 80;

function revalidateAvatarPaths() {
  revalidatePath("/admin-game/dashboard/avatars");
  revalidatePath("/admin-game/dashboard/avatars", "layout");
}

async function requireAdventureUpdate(): Promise<{ ok: false; error: string } | { ok: true }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { ok: false, error: "Non autorisé." };
  }
  return { ok: true };
}

export async function createAvatarAction(input: {
  slug: string;
  name: string;
  sortOrder: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: "Slug : 2 à 49 caractères, minuscules, chiffres et _ ; doit commencer par une lettre.",
    };
  }
  if (!name || name.length > NAME_MAX) {
    return { ok: false, error: `Nom requis (max ${NAME_MAX} caractères).` };
  }
  if (!Number.isFinite(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 9999) {
    return { ok: false, error: "Ordre d’affichage invalide (0 à 9999)." };
  }

  try {
    const row = await prisma.avatar.create({
      data: {
        slug,
        name,
        sortOrder: Math.floor(input.sortOrder),
        isActive: true,
      },
      select: { id: true },
    });
    revalidateAvatarPaths();
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "Impossible de créer (slug déjà utilisé ?)." };
  }
}

export async function updateAvatarAction(input: {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const name = input.name.trim();
  if (!name || name.length > NAME_MAX) {
    return { ok: false, error: `Nom requis (max ${NAME_MAX} caractères).` };
  }
  if (!Number.isFinite(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 9999) {
    return { ok: false, error: "Ordre d’affichage invalide (0 à 9999)." };
  }

  const exists = await prisma.avatar.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, error: "Avatar introuvable." };
  }

  await prisma.avatar.update({
    where: { id: input.id },
    data: {
      name,
      sortOrder: Math.floor(input.sortOrder),
      isActive: input.isActive,
    },
  });
  revalidateAvatarPaths();
  revalidatePath(`/admin-game/dashboard/avatars/${input.id}`);
  return { ok: true };
}

export async function uploadAvatarThumbnailAction(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const avatarId = String(formData.get("avatarId") ?? "").trim();
  const file = formData.get("file");
  if (!avatarId || !(file instanceof File)) {
    return { ok: false, error: "Fichier ou avatar manquant." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await saveAvatarThumbnailFromUpload({
    avatarId,
    fileBuffer: buffer,
    mimeType: file.type,
  });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  revalidateAvatarPaths();
  revalidatePath(`/admin-game/dashboard/avatars/${avatarId}`);
  return { ok: true, url: res.publicUrl };
}

export async function uploadAvatarModelAction(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const avatarId = String(formData.get("avatarId") ?? "").trim();
  const file = formData.get("file");
  if (!avatarId || !(file instanceof File)) {
    return { ok: false, error: "Fichier ou avatar manquant." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await saveAvatarModelFromUpload({
    avatarId,
    fileBuffer: buffer,
    mimeType: file.type,
    originalFilename: file.name,
  });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  revalidateAvatarPaths();
  revalidatePath(`/admin-game/dashboard/avatars/${avatarId}`);
  return { ok: true, url: res.publicUrl };
}

export async function clearAvatarThumbnailAction(
  avatarId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const row = await prisma.avatar.findUnique({
    where: { id: avatarId },
    select: { id: true, thumbnailUrl: true },
  });
  if (!row) {
    return { ok: false, error: "Avatar introuvable." };
  }
  await deleteUploadsFileByUrl(row.thumbnailUrl);
  await prisma.avatar.update({
    where: { id: row.id },
    data: { thumbnailUrl: null },
  });
  revalidateAvatarPaths();
  revalidatePath(`/admin-game/dashboard/avatars/${avatarId}`);
  return { ok: true };
}

export async function clearAvatarModelAction(
  avatarId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdventureUpdate();
  if (!gate.ok) return gate;

  const row = await prisma.avatar.findUnique({
    where: { id: avatarId },
    select: { id: true, modelUrl: true },
  });
  if (!row) {
    return { ok: false, error: "Avatar introuvable." };
  }
  await deleteUploadsFileByUrl(row.modelUrl);
  await prisma.avatar.update({
    where: { id: row.id },
    data: { modelUrl: null },
  });
  revalidateAvatarPaths();
  revalidatePath(`/admin-game/dashboard/avatars/${avatarId}`);
  return { ok: true };
}
