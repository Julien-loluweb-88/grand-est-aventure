import "server-only";

import path from "path";
import { readdirSync, readFileSync, statSync } from "fs";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type BaladIndicesPdfMeta = {
  filename: string;
  sizeBytes: number;
  // Chemin public (relatif), prêt pour URL (avec encodage éventuel)
  publicPath: string;
  // Attachments Nodemailer si autorisé par la taille.
  attachments: EmailAttachment[] | null;
};

let baladPdfCache: BaladIndicesPdfMeta | null | undefined = undefined;

function getMaxAttachmentBytes(): number {
  const raw = process.env.BALAD_PDF_MAX_ATTACHMENT_BYTES?.trim();
  // Valeur par défaut volontairement "prudente" (8 Mo).
  const fallback = 8 * 1024 * 1024;
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function encodePathSegment(segment: string): string {
  // encodeURIComponent gère correctement les caractères spéciaux (ex: ’).
  return encodeURIComponent(segment);
}

function loadBaladIndicesPdfMeta(): BaladIndicesPdfMeta | null {
  if (baladPdfCache !== undefined) return baladPdfCache;

  const publicDir = path.join(process.cwd(), "public");
  try {
    const files = readdirSync(publicDir);
    const pdfFile = files.find(
      (f) => f.toLowerCase().startsWith("balad") && f.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      baladPdfCache = null;
      return null;
    }

    const pdfPath = path.join(publicDir, pdfFile);
    const sizeBytes = statSync(pdfPath).size;
    const publicPath = `/${encodePathSegment(pdfFile)}`;

    const maxBytes = getMaxAttachmentBytes();
    const canAttach = sizeBytes <= maxBytes;

    if (!canAttach) {
      baladPdfCache = {
        filename: pdfFile,
        sizeBytes,
        publicPath,
        attachments: null,
      };
      return baladPdfCache;
    }

    const buffer = readFileSync(pdfPath);
    baladPdfCache = {
      filename: pdfFile,
      sizeBytes,
      publicPath,
      attachments: [
        {
          filename: pdfFile,
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    };
    return baladPdfCache;
  } catch {
    baladPdfCache = null;
    return null;
  }
}

export function getBaladIndicesPdfAttachments(): EmailAttachment[] | null {
  return loadBaladIndicesPdfMeta()?.attachments ?? null;
}

export function getBaladIndicesPdfPublicPath(): string | null {
  return loadBaladIndicesPdfMeta()?.publicPath ?? null;
}

export function getBaladIndicesPdfMeta(): BaladIndicesPdfMeta | null {
  return loadBaladIndicesPdfMeta();
}

