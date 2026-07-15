import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_PROSPECT_CONTACT_NAME } from "./prospect-events-constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProspectImportRow = {
  email: string;
  commune: string | null;
  intercommunalite: string | null;
  telephone: string | null;
  adresse: string | null;
  siteInternet: string | null;
};

export function normalizeProspectEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  if (!value || !EMAIL_REGEX.test(value)) return null;
  return value;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function parseProspectsFromJsonPayload(payload: unknown): {
  rows: ProspectImportRow[];
  intercommunaliteFromPayload: string | null;
} {
  const data = payload as Record<string, unknown>;
  const rawRows: unknown[] = Array.isArray(data?.mairies)
    ? data.mairies
    : Array.isArray(payload)
      ? payload
      : [];

  const intercommunaliteFromPayload =
    typeof data?.intercommunalite === "string" ? data.intercommunalite.trim() || null : null;

  const rows = rawRows
    .map((row) => {
      const item = row as Record<string, unknown>;
      const email = normalizeProspectEmail(item.email);
      if (!email) return null;

      const adresse =
        normalizeOptionalString(item.adresse) ??
        ([normalizeOptionalString(item.adresseRue), normalizeOptionalString(item.adresseVille)]
          .filter(Boolean)
          .join(", ") || null);

      return {
        email,
        commune: normalizeOptionalString(item.commune),
        intercommunalite:
          normalizeOptionalString(item.intercommunalite) ?? intercommunaliteFromPayload,
        telephone: normalizeOptionalString(item.telephone),
        adresse,
        siteInternet: normalizeOptionalString(item.siteInternet),
      };
    })
    .filter(Boolean) as ProspectImportRow[];

  const uniqueByEmail = new Map<string, ProspectImportRow>();
  for (const row of rows) uniqueByEmail.set(row.email, row);

  return {
    rows: [...uniqueByEmail.values()],
    intercommunaliteFromPayload,
  };
}

export async function upsertProspectsFromRows(
  rows: ProspectImportRow[],
  followUpDays: number,
  source: string,
  ownerUserId: string
): Promise<{ created: number; enriched: number; total: number }> {
  const now = new Date();
  const nextFollowUpAt =
    followUpDays === 0 ? now : new Date(now.getTime() + followUpDays * 24 * 60 * 60 * 1000);

  const existing = await prisma.prospect.findMany({
    where: { email: { in: rows.map((row) => row.email) } },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((item) => item.email));

  let created = 0;
  let enriched = 0;

  for (const row of rows) {
    if (existingSet.has(row.email)) {
      await prisma.prospect.update({
        where: { email: row.email },
        data: {
          commune: row.commune ?? undefined,
          intercommunalite: row.intercommunalite ?? undefined,
          telephone: row.telephone ?? undefined,
          adresse: row.adresse ?? undefined,
          siteInternet: row.siteInternet ?? undefined,
          lastImportedAt: now,
        },
      });
      enriched += 1;
      continue;
    }

    await prisma.prospect.create({
      data: {
        email: row.email,
        commune: row.commune,
        intercommunalite: row.intercommunalite,
        telephone: row.telephone,
        adresse: row.adresse,
        siteInternet: row.siteInternet,
        contactName: DEFAULT_PROSPECT_CONTACT_NAME,
        source,
        ownerUserId,
        lastImportedAt: now,
        nextFollowUpAt,
        followUpStep: 0,
      },
    });
    created += 1;
  }

  return { created, enriched, total: rows.length };
}
