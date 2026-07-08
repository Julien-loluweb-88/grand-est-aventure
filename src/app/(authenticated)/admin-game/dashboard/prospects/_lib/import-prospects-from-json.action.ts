"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { readFormDataUploadFile } from "@/lib/uploads/read-form-data-upload-file";
import { requireSuperadmin } from "../../utilisateurs/[id]/_lib/user-admin-guard";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const v = email.trim().toLowerCase();
  if (!v) return null;
  if (!EMAIL_REGEX.test(v)) return null;
  return v;
}

export async function importProspectsFromJsonAction(formData: FormData) {
  await requireSuperadmin();

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

  const maxBytes = 2 * 1024 * 1024; // 2 Mo: suffisant pour tes exports.
  if (file.size > maxBytes) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Fichier trop volumineux (max 2 Mo).")
    );
  }

  let payload: any;
  try {
    const jsonText = Buffer.from(await file.blob.arrayBuffer()).toString("utf8");
    payload = JSON.parse(jsonText);
  } catch {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("JSON invalide (impossible de parser).")
    );
  }

  const rows: any[] = Array.isArray(payload?.mairies)
    ? payload.mairies
    : Array.isArray(payload)
      ? payload
      : [];

  if (!rows.length) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Format inattendu : tableau `mairies` introuvable.")
    );
  }

  const intercommunaliteFromPayload =
    typeof payload?.intercommunalite === "string" ? payload.intercommunalite : null;

  const candidates = rows
    .map((row) => {
      const email = normalizeEmail(row?.email);
      if (!email) return null;

      const commune =
        typeof row?.commune === "string" && row.commune.trim()
          ? row.commune.trim()
          : null;

      const intercommunalite =
        typeof row?.intercommunalite === "string" && row.intercommunalite.trim()
          ? row.intercommunalite.trim()
          : intercommunaliteFromPayload;

      return { email, commune, intercommunalite };
    })
    .filter(Boolean) as Array<{
    email: string;
    commune: string | null;
    intercommunalite: string | null;
  }>;

  if (!candidates.length) {
    return redirect(
      "/admin-game/dashboard/prospects?import=error&message=" +
        encodeURIComponent("Aucune adresse e-mail valide trouvée dans le JSON.")
    );
  }

  const uniqueByEmail = new Map<string, { email: string; commune: string | null; intercommunalite: string | null }>();
  for (const c of candidates) uniqueByEmail.set(c.email, c);
  const uniqueCandidates = [...uniqueByEmail.values()];

  const now = new Date();
  const nextFollowUpAt =
    followUpDays === 0 ? now : new Date(now.getTime() + followUpDays * 24 * 60 * 60 * 1000);

  const existing = await prisma.prospect.findMany({
    where: { email: { in: uniqueCandidates.map((c) => c.email) } },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((e) => e.email));

  let created = 0;
  let updated = 0;
  for (const c of uniqueCandidates) {
    await prisma.prospect.upsert({
      where: { email: c.email },
      create: {
        email: c.email,
        commune: c.commune,
        intercommunalite: c.intercommunalite,
        source: "json_upload",
        lastImportedAt: now,
        nextFollowUpAt,
        followUpStep: 0,
      },
      update: {
        commune: c.commune ?? undefined,
        intercommunalite: c.intercommunalite ?? undefined,
        source: "json_upload",
        lastImportedAt: now,
        nextFollowUpAt,
        followUpStep: 0,
      },
    });
    if (existingSet.has(c.email)) updated += 1;
    else created += 1;
  }

  revalidatePath("/admin-game/dashboard/prospects");

  const qs = new URLSearchParams();
  qs.set("import", "ok");
  qs.set("created", String(created));
  qs.set("updated", String(updated));
  qs.set("total", String(uniqueCandidates.length));

  return redirect(`/admin-game/dashboard/prospects?${qs.toString()}`);
}

