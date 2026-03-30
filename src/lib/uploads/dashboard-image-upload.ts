import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  gateAdventureDraftUpload,
  gateAdventureUpdateContent,
  gateAdvertisementDraftImageUpload,
  gateAdvertisementImageUpload,
} from "@/lib/adventure-authorization";
import { prisma } from "@/lib/prisma";
import type { DashboardImageScope } from "@/lib/uploads/dashboard-image-scope";
import { removeAdventureImageStem } from "@/lib/uploads/delete-uploads-file";

/** Limite unique pour les téléversements dashboard (couverture, badge, énigme, éditeur, etc.). */
export const DASHBOARD_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export const DASHBOARD_IMAGE_MIME_TO_EXT = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

/** `crypto.randomUUID()` (navigateur / Node). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SaveDashboardImageResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

function publicUrlForRelative(rel: string) {
  return `/uploads/${rel.replace(/^\/+/, "")}`;
}

/**
 * Écrit sous `uploads/` à la racine du projet : `adventures/{adventureId}/…`
 * — `cover.*` / `badge.*` / `treasure.*` / `enigmas/{enigmaId|uuid}.*`.
 * Lecture HTTP : `/uploads/…` (rewrite vers `/api/uploads/…`).
 */
export async function saveDashboardImage(params: {
  adventureId?: string;
  /** Pour `adventure-editor-draft` uniquement (UUID v4). */
  draftId?: string;
  /** Pour `advertisement` (fiche existante). */
  advertisementId?: string;
  /** Pour `advertisement-draft` (UUID v4). */
  advertisementDraftId?: string;
  scope: DashboardImageScope;
  enigmaId?: string | null;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<SaveDashboardImageResult> {
  const ext = DASHBOARD_IMAGE_MIME_TO_EXT.get(params.mimeType);
  if (!ext) {
    return { ok: false, error: "Type non autorisé (JPEG, PNG, WebP)." };
  }

  if (params.scope === "adventure-editor-draft") {
    const gate = await gateAdventureDraftUpload();
    if (!gate.ok) {
      return { ok: false, error: "Non autorisé." };
    }
    const draftId = params.draftId?.trim() ?? "";
    if (!draftId || !UUID_RE.test(draftId)) {
      return { ok: false, error: "Identifiant de brouillon invalide." };
    }
    const fileStem = randomUUID();
    const relative = path
      .join("adventures", "drafts", draftId, "editor", `${fileStem}${ext}`)
      .replace(/\\/g, "/");
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const absoluteDir = path.join(uploadsRoot, path.dirname(relative));
    const absoluteFile = path.join(uploadsRoot, relative);
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFile, params.fileBuffer);
    return { ok: true, publicUrl: publicUrlForRelative(relative) };
  }

  if (params.scope === "advertisement-draft") {
    const gate = await gateAdvertisementDraftImageUpload();
    if (!gate.ok) {
      return { ok: false, error: "Non autorisé." };
    }
    const draftId = params.advertisementDraftId?.trim() ?? "";
    if (!draftId || !UUID_RE.test(draftId)) {
      return { ok: false, error: "Identifiant de brouillon publicité invalide." };
    }
    const fileStem = randomUUID();
    const relative = path
      .join("advertisements", "drafts", draftId, `${fileStem}${ext}`)
      .replace(/\\/g, "/");
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const absoluteDir = path.join(uploadsRoot, path.dirname(relative));
    const absoluteFile = path.join(uploadsRoot, relative);
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFile, params.fileBuffer);
    return { ok: true, publicUrl: publicUrlForRelative(relative) };
  }

  if (params.scope === "advertisement") {
    const adId = params.advertisementId?.trim() ?? "";
    if (!adId) {
      return { ok: false, error: "Identifiant de publicité manquant." };
    }
    const gate = await gateAdvertisementImageUpload(adId);
    if (!gate.ok) {
      return { ok: false, error: "Non autorisé." };
    }
    const fileStem = randomUUID();
    const relative = path
      .join("advertisements", adId, `${fileStem}${ext}`)
      .replace(/\\/g, "/");
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const absoluteDir = path.join(uploadsRoot, path.dirname(relative));
    const absoluteFile = path.join(uploadsRoot, relative);
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFile, params.fileBuffer);
    return { ok: true, publicUrl: publicUrlForRelative(relative) };
  }

  const adventureId = params.adventureId?.trim() ?? "";
  if (!adventureId) {
    return { ok: false, error: "Identifiant d’aventure manquant." };
  }

  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }

  const base = path.join("adventures", adventureId);
  let relative: string;

  switch (params.scope) {
    case "adventure-cover":
      await removeAdventureImageStem(adventureId, "cover");
      relative = path.join(base, `cover${ext}`).replace(/\\/g, "/");
      break;
    case "adventure-badge":
      await removeAdventureImageStem(adventureId, "badge");
      relative = path.join(base, `badge${ext}`).replace(/\\/g, "/");
      break;
    case "treasure":
      await removeAdventureImageStem(adventureId, "treasure");
      relative = path.join(base, `treasure${ext}`).replace(/\\/g, "/");
      break;
    case "adventure-editor-image": {
      const fileStem = randomUUID();
      relative = path.join(base, "editor", `${fileStem}${ext}`).replace(/\\/g, "/");
      break;
    }
    case "enigma": {
      let fileStem: string;
      if (params.enigmaId && params.enigmaId.length > 0) {
        const row = await prisma.enigma.findFirst({
          where: { id: params.enigmaId, adventureId },
          select: { id: true },
        });
        if (!row) {
          return { ok: false, error: "Énigme introuvable." };
        }
        fileStem = params.enigmaId;
      } else {
        fileStem = randomUUID();
      }
      await removeAdventureImageStem(adventureId, `enigmas/${fileStem}`);
      relative = path.join(base, "enigmas", `${fileStem}${ext}`).replace(/\\/g, "/");
      break;
    }
    default:
      return { ok: false, error: "Type d’image invalide." };
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const absoluteDir = path.join(uploadsRoot, path.dirname(relative));
  const absoluteFile = path.join(uploadsRoot, relative);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absoluteFile, params.fileBuffer);

  return { ok: true, publicUrl: publicUrlForRelative(relative) };
}
