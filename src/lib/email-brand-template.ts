/**
 * Gabarit HTML e-mail aligné sur la page d’accueil (verts #68a618 / #39951a, brun #281401, crème #fef0c7).
 * Styles majoritairement inline pour les clients mail.
 */

import { getPublicAppOrigin } from "@/lib/public-app-url";

export function escapeHtmlForBrandEmail(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = {
  green: "#68a618",
  greenDark: "#5a9014",
  greenTitle: "#39951a",
  brown: "#281401",
  cream: "#fef0c7",
  lightGreen: "#c8e89f",
  paper: "#f6f3ef",
  white: "#ffffff",
} as const;

/** Blocs de contenu passés à `buildBrandEmailHtml` (textes utilisateur : échapper avant avec `escapeHtmlForBrandEmail`). */
export type BrandEmailBlock =
  | { type: "p"; text: string }
  | { type: "html"; html: string }
  | {
      type: "highlight";
      title?: string;
      text: string;
    }
  | { type: "cta"; label: string; href: string }
  | { type: "pre"; text: string };

function blockToHtml(b: BrandEmailBlock): string {
  switch (b.type) {
    case "p":
      return `<p style="margin:0 0 16px;color:${BRAND.brown};font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(b.text)}</p>`;
    case "html":
      return b.html;
    case "highlight": {
      const title = b.title
        ? `<p style="margin:0 0 8px;font-weight:700;color:${BRAND.greenTitle};font-size:14px;">${escapeHtmlForBrandEmail(b.title)}</p>`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-radius:8px;background:${BRAND.cream};border-left:4px solid ${BRAND.green};"><tr><td style="padding:14px 16px;">${title}<p style="margin:0;color:${BRAND.brown};font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtmlForBrandEmail(b.text)}</p></td></tr></table>`;
    }
    case "cta":
      return `<p style="margin:24px 0 8px;text-align:center;"><a href="${escapeHtmlForBrandEmail(b.href)}" style="display:inline-block;padding:14px 28px;background:${BRAND.green};color:${BRAND.white};font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">${escapeHtmlForBrandEmail(b.label)}</a></p><p style="margin:0;font-size:12px;color:${BRAND.brown};opacity:0.65;text-align:center;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/><span style="word-break:break-all;">${escapeHtmlForBrandEmail(b.href)}</span></p>`;
    case "pre":
      return `<pre style="margin:0 0 16px;padding:14px;background:#f0ebe3;border-radius:8px;font-size:13px;line-height:1.45;color:${BRAND.brown};white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Consolas,monospace;">${escapeHtmlForBrandEmail(b.text)}</pre>`;
    default:
      return "";
  }
}

/**
 * Enveloppe le contenu dans une carte type « page d’accueil » (header sombre + accent vert).
 */
export function buildBrandEmailHtml(params: {
  /** Texte masqué pour les prévisualisations clients mail (anti-spam léger). */
  preheader?: string;
  /** Titre principal sous le bandeau. */
  headline: string;
  /** Blocs de contenu. */
  blocks: BrandEmailBlock[];
  footerText?: string;
}): string {
  const origin = getPublicAppOrigin();
  const homeUrl = origin || "";
  const blocksHtml = params.blocks.map(blockToHtml).join("\n");
  const pre = params.preheader
    ? `<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtmlForBrandEmail(params.preheader)}</div>`
    : "";

  const footer =
    params.footerText ??
    `Cet e-mail a été envoyé par Balad'indice.${homeUrl ? ` <a href="${escapeHtmlForBrandEmail(homeUrl)}" style="color:${BRAND.greenDark};">Voir le site</a>` : ""}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtmlForBrandEmail(params.headline)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.brown}14;box-shadow:0 4px 24px ${BRAND.brown}12;">
<tr><td style="background:${BRAND.brown};padding:26px 22px 22px;text-align:center;">
<p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.lightGreen};">Grand Est</p>
<h1 style="margin:0;font-family:Georgia,&#39;Times New Roman&#39;,serif;font-size:24px;font-weight:700;color:${BRAND.white};line-height:1.25;">Balad&apos;indice</h1>
<p style="margin:10px 0 0;font-size:14px;color:${BRAND.lightGreen};line-height:1.4;">La ville devient une chasse au tr&eacute;sor</p>
</td></tr>
<tr><td style="padding:26px 24px 8px;">
<h2 style="margin:0 0 18px;font-family:Georgia,serif;font-size:20px;font-weight:600;color:${BRAND.greenTitle};line-height:1.3;">${escapeHtmlForBrandEmail(params.headline)}</h2>
${blocksHtml}
</td></tr>
<tr><td style="padding:18px 24px 26px;background:${BRAND.cream};border-top:1px solid ${BRAND.brown}14;">
<p style="margin:0;font-size:12px;line-height:1.45;color:${BRAND.brown};opacity:0.85;">${footer}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
