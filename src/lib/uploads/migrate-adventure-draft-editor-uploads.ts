import "server-only";

import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import type { Prisma } from "../../../generated/prisma/browser";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Déplace `uploads/adventures/drafts/{draftId}/editor/*` vers `…/{adventureId}/editor/`
 * et réécrit les URLs dans le JSON TipTap.
 */
export async function migrateAdventureDraftEditorUploads(params: {
  draftId: string;
  adventureId: string;
  description: Prisma.InputJsonValue;
}): Promise<Prisma.InputJsonValue> {
  const draftId = params.draftId.trim();
  if (!UUID_RE.test(draftId)) {
    return params.description;
  }

  await moveDraftEditorFolderToAdventure(draftId, params.adventureId);

  const fromPrefix = `/uploads/adventures/drafts/${draftId}/`;
  const toPrefix = `/uploads/adventures/${params.adventureId}/`;
  const s = JSON.stringify(params.description);
  if (!s.includes(fromPrefix)) {
    return params.description;
  }
  return JSON.parse(s.split(fromPrefix).join(toPrefix)) as Prisma.InputJsonValue;
}

async function moveDraftEditorFolderToAdventure(
  draftId: string,
  adventureId: string
): Promise<void> {
  const uploadsRoot = path.join(process.cwd(), "uploads", "adventures");
  const draftEditor = path.join(uploadsRoot, "drafts", draftId, "editor");
  const targetEditor = path.join(uploadsRoot, adventureId, "editor");

  let names: string[];
  try {
    names = await readdir(draftEditor);
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as NodeJS.ErrnoException).code
        : "";
    if (code === "ENOENT") {
      return;
    }
    throw e;
  }

  if (names.length === 0) {
    await rm(path.join(uploadsRoot, "drafts", draftId), {
      recursive: true,
      force: true,
    });
    return;
  }

  await mkdir(targetEditor, { recursive: true });
  for (const name of names) {
    await rename(path.join(draftEditor, name), path.join(targetEditor, name));
  }
  await rm(path.join(uploadsRoot, "drafts", draftId), { recursive: true, force: true });
}
