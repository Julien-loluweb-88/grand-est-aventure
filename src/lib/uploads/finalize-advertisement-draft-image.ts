import "server-only";

import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Si `imageUrl` pointe vers un fichier sous `uploads/advertisements/drafts/{draftId}/`,
 * le déplace vers `uploads/advertisements/{advertisementId}/image.{ext}`.
 */
export async function finalizeAdvertisementDraftImageUrl(params: {
  draftId: string;
  advertisementId: string;
  imageUrl: string | null | undefined;
}): Promise<string | null> {
  const imageUrl = params.imageUrl?.trim();
  if (!imageUrl) return imageUrl ?? null;
  const draftId = params.draftId.trim();
  if (!UUID_RE.test(draftId)) return imageUrl;

  const needle = `/uploads/advertisements/drafts/${draftId}/`;
  if (!imageUrl.includes(needle)) {
    return imageUrl;
  }

  const prefix = "/uploads/";
  if (!imageUrl.startsWith(prefix)) return imageUrl;
  const rel = imageUrl.slice(prefix.length);
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const oldAbs = path.join(uploadsRoot, rel);
  const ext = path.extname(rel) || ".jpg";
  const newRel = path
    .join("advertisements", params.advertisementId, `image${ext}`)
    .replace(/\\/g, "/");
  const newAbs = path.join(uploadsRoot, newRel);

  await mkdir(path.dirname(newAbs), { recursive: true });
  await copyFile(oldAbs, newAbs);

  try {
    const draftDir = path.join(uploadsRoot, "advertisements", "drafts", draftId);
    await rm(draftDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  return `/uploads/${newRel}`;
}
