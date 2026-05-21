import "server-only";

import type { DashboardImageScope } from "@/lib/uploads/dashboard-image-scope";
import {
  saveDashboardImage,
  DASHBOARD_UPLOAD_MAX_BYTES,
} from "@/lib/uploads/dashboard-image-upload";
import { resolveImageMimeFromFile } from "@/lib/uploads/image-mime";
import { readFormDataUploadFile } from "@/lib/uploads/read-form-data-upload-file";

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

export type UploadDashboardImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function runUploadDashboardImage(
  formData: FormData
): Promise<UploadDashboardImageResult> {
  try {
    const upload = readFormDataUploadFile(formData);
    const scope = formData.get("scope")?.toString() as DashboardImageScope;
    const adventureId = formData.get("adventureId")?.toString() ?? "";
    const draftId = formData.get("draftId")?.toString() ?? "";
    const advertisementId = formData.get("advertisementId")?.toString() ?? "";
    const advertisementDraftId = formData.get("advertisementDraftId")?.toString() ?? "";
    const enigmaIdRaw = formData.get("enigmaId")?.toString();

    if (!upload) {
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
      /* gate dans saveDashboardImage */
    } else if (!adventureId) {
      return { ok: false, error: "Identifiant d’aventure manquant." };
    }

    if (upload.size < 1) {
      return { ok: false, error: "Fichier vide." };
    }
    if (upload.size > DASHBOARD_UPLOAD_MAX_BYTES) {
      const maxMb = DASHBOARD_UPLOAD_MAX_BYTES / (1024 * 1024);
      return {
        ok: false,
        error: `Fichier trop volumineux (max ${maxMb} Mo).`,
      };
    }

    const mimeType = resolveImageMimeFromFile({
      type: upload.type,
      name: upload.name,
    });
    if (!mimeType) {
      return {
        ok: false,
        error: "Type non reconnu. Envoyez un fichier image.",
      };
    }

    const buffer = Buffer.from(await upload.blob.arrayBuffer());
    const result = await saveDashboardImage({
      adventureId: adventureId || undefined,
      draftId: draftId || undefined,
      advertisementId: advertisementId || undefined,
      advertisementDraftId: advertisementDraftId || undefined,
      scope,
      enigmaId: enigmaIdRaw && enigmaIdRaw.length > 0 ? enigmaIdRaw : null,
      fileBuffer: buffer,
      mimeType,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true, url: result.publicUrl };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Erreur lors de l’enregistrement du fichier.";
    console.error("[upload-dashboard-image]", e);
    return { ok: false, error: msg };
  }
}
