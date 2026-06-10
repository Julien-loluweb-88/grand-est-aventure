import { z } from "zod";

/** Longueur max d’une URL DiceBear (query params inclus). */
export const DICEBEAR_AVATAR_URL_MAX_LENGTH = 2048;

export function isDicebearAvatarUrl(value: string): boolean {
  if (value.length > DICEBEAR_AVATAR_URL_MAX_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith("dicebear.com");
  } catch {
    return false;
  }
}

export const dicebearAvatarUrlSchema = z
  .string()
  .max(DICEBEAR_AVATAR_URL_MAX_LENGTH)
  .refine(isDicebearAvatarUrl, {
    message: "URL DiceBear HTTPS invalide (domaine dicebear.com attendu).",
  });

/** `User.image` : URL DiceBear complète ou `null` pour effacer. */
export const userImagePatchSchema = z.union([z.null(), dicebearAvatarUrlSchema]);
