import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function parseDateFromArg(raw) {
  if (!raw) return new Date();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Date invalide: "${raw}"`);
  }
  return date;
}

async function main() {
  const jsonPathArg = process.argv[2];
  const followupDateArg = process.argv[3];
  if (!jsonPathArg) {
    throw new Error(
      "Usage: node scripts/import-prospects-from-json.mjs <fichier-json> [dateRelanceISO]"
    );
  }

  const jsonPath = path.resolve(process.cwd(), jsonPathArg);
  const raw = await fs.readFile(jsonPath, "utf8");
  const payload = JSON.parse(raw);
  const rows = Array.isArray(payload.mairies) ? payload.mairies : [];
  const nextFollowUpAt = parseDateFromArg(followupDateArg);

  const connectionString = `${process.env.DATABASE_URL ?? ""}`;
  if (!connectionString) throw new Error("DATABASE_URL manquante.");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped += 1;
      continue;
    }
    await prisma.prospect.upsert({
      where: { email },
      create: {
        email,
        commune: row.commune || null,
        intercommunalite: row.intercommunalite || payload.intercommunalite || null,
        source: "cdc_json_import",
        lastImportedAt: new Date(),
        nextFollowUpAt,
      },
      update: {
        commune: row.commune || undefined,
        intercommunalite: row.intercommunalite || payload.intercommunalite || undefined,
        source: "cdc_json_import",
        lastImportedAt: new Date(),
        nextFollowUpAt,
      },
    });
    imported += 1;
  }

  await prisma.$disconnect();
  console.log(
    JSON.stringify(
      {
        file: jsonPath,
        totalRows: rows.length,
        imported,
        skipped,
        nextFollowUpAt: nextFollowUpAt.toISOString(),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
