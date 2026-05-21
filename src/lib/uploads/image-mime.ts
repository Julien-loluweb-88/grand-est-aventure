/** Valeur `accept` pour les `<input type="file">` images (dashboard, éditeur, avis, etc.). */
export const IMAGE_INPUT_ACCEPT = "image/*";

const EXT_TO_MIME: Record<string, string> = {
  ".apng": "image/apng",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".ico": "image/x-icon",
  ".jfif": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pjpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/apng": ".apng",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/tiff": ".tiff",
  "image/webp": ".webp",
  "image/x-icon": ".ico",
};

/** Extensions image courantes (nettoyage d’anciens fichiers, ex. vignette avatar). */
export const COMMON_IMAGE_FILE_EXTENSIONS = [
  ...new Set([...Object.keys(EXT_TO_MIME), ...Object.values(MIME_TO_EXT)]),
] as const;

export function isAllowedImageMime(mime: string): boolean {
  const m = mime.trim().toLowerCase();
  return m.length > 0 && m.startsWith("image/");
}

/** Extension fichier (avec point) pour un MIME image, ou `null` si ce n’est pas une image. */
export function extensionForImageMime(mime: string): string | null {
  const m = mime.trim().toLowerCase();
  if (!isAllowedImageMime(m)) {
    return null;
  }
  const known = MIME_TO_EXT[m];
  if (known) {
    return known;
  }
  const sub = m.slice("image/".length).split(";")[0]?.split("+")[0]?.trim() ?? "";
  const safe = sub.replace(/[^a-z0-9.-]/gi, "");
  return safe ? `.${safe}` : ".img";
}

/** Content-Type HTTP à partir de l’extension (servir `/api/uploads/…`). */
export function contentTypeForImageExtension(ext: string): string | null {
  const e = ext.toLowerCase();
  if (!e.startsWith(".")) {
    return null;
  }
  return EXT_TO_MIME[e] ?? (e.length > 1 ? `image/${e.slice(1)}` : null);
}

/** MIME pour enregistrement : `file.type`, sinon extension du nom de fichier. */
export function resolveImageMimeFromFile(file: {
  type: string;
  name: string;
}): string {
  const fromType = file.type?.trim().toLowerCase();
  if (fromType && fromType !== "application/octet-stream" && isAllowedImageMime(fromType)) {
    return fromType;
  }
  const name = file.name?.trim().toLowerCase() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot >= 0) {
    const ext = name.slice(dot);
    const mapped = EXT_TO_MIME[ext];
    if (mapped) {
      return mapped;
    }
  }
  if (fromType && isAllowedImageMime(fromType)) {
    return fromType;
  }
  return "";
}
