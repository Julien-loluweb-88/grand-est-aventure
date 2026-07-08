"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { readFormDataUploadFile } from "@/lib/uploads/read-form-data-upload-file";
import {
  parseProspectsFromJsonPayload,
  upsertProspectsFromRows,
} from "@/lib/prospect-import";
import { requireSuperadmin } from "../../utilisateurs/[id]/_lib/user-admin-guard";

export async function importProspectsFromJsonAction(formData: FormData) {
  const user = await requireSuperadmin();

  const file = readFormDataUploadFile(formData, "file");
  if (!file) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Fichier JSON manquant.")
    );
  }

  const rawFollowUpDays = String(formData.get("followUpDays") ?? "").trim();
  const requestedFollowUpDays = Number.parseInt(rawFollowUpDays || "1", 10);
  const followUpDays = Number.isFinite(requestedFollowUpDays)
    ? Math.max(0, Math.min(60, requestedFollowUpDays))
    : 1;

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Fichier trop volumineux (max 2 Mo).")
    );
  }

  let payload: unknown;
  try {
    const jsonText = Buffer.from(await file.blob.arrayBuffer()).toString("utf8");
    payload = JSON.parse(jsonText);
  } catch {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("JSON invalide (impossible de parser).")
    );
  }

  const { rows } = parseProspectsFromJsonPayload(payload);
  if (!rows.length) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Format inattendu : tableau `mairies` introuvable.")
    );
  }

  const { created, enriched, total } = await upsertProspectsFromRows(
    rows,
    followUpDays,
    "json_upload",
    user.id
  );

  revalidatePath("/admin-game/dashboard/prospects");

  const qs = new URLSearchParams();
  qs.set("import", "ok");
  qs.set("created", String(created));
  qs.set("enriched", String(enriched));
  qs.set("total", String(total));

  return redirect(`/admin-game/dashboard/prospects?${qs.toString()}`);
}
