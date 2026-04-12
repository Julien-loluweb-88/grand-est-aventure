"use server";

import type { DashboardImageScope } from "@/lib/uploads/dashboard-image-scope";
import {
  saveDashboardImage,
  DASHBOARD_UPLOAD_MAX_BYTES,
} from "@/lib/uploads/dashboard-image-upload";

const ALLOWED_SCOPES: DashboardImageScope[] = [
  "adventure-cover",
  "adventure-badge",
  "adventure-editor-image",
  "adventure-editor-draft",
  "enigma",
  "treasure",
  "advertisement",
  "advertisement-draft",
  "milestone-badge",
  "discovery-point",
];

/** Téléversement unique (dashboard) : écrit dans `uploads/adventures/{id}/` à la racine du projet. */
export async function uploadDashboardImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  const scope = formData.get("scope")?.toString() as DashboardImageScope;
  const adventureId = formData.get("adventureId")?.toString() ?? "";
  const draftId = formData.get("draftId")?.toString() ?? "";
  const advertisementId = formData.get("advertisementId")?.toString() ?? "";
  const advertisementDraftId = formData.get("advertisementDraftId")?.toString() ?? "";
  const enigmaIdRaw = formData.get("enigmaId")?.toString();

  if (!(file instanceof File)) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (!ALLOWED_SCOPES.includes(scope)) {
    return { ok: false, error: "Type d’image invalide." };
  }
  if (scope === "adventure-editor-draft") {
    if (!draftId.trim()) {
      return { ok: false, error: "Identifiant de brouillon manquant." };
    }
  } else if (scope === "advertisement-draft") {
    if (!advertisementDraftId.trim()) {
      return { ok: false, error: "Identifiant de brouillon publicité manquant." };
    }
  } else if (scope === "advertisement") {
    if (!advertisementId.trim()) {
      return { ok: false, error: "Identifiant de publicité manquant." };
    }
  } else if (scope === "milestone-badge" || scope === "discovery-point") {
    /* pas d’id métier : gate côté saveDashboardImage */
  } else if (!adventureId) {
    return { ok: false, error: "Identifiant d’aventure manquant." };
  }
  if (file.size > DASHBOARD_UPLOAD_MAX_BYTES) {
    const maxMb = DASHBOARD_UPLOAD_MAX_BYTES / (1024 * 1024);
    return {
      ok: false,
      error: `Fichier trop volumineux (max ${maxMb} Mo).`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await saveDashboardImage({
    adventureId: adventureId || undefined,
    draftId: draftId || undefined,
    advertisementId: advertisementId || undefined,
    advertisementDraftId: advertisementDraftId || undefined,
    scope,
    enigmaId: enigmaIdRaw && enigmaIdRaw.length > 0 ? enigmaIdRaw : null,
    fileBuffer: buffer,
    mimeType: file.type,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, url: result.publicUrl };
}
