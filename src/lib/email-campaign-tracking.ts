import "server-only";

import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getBaladIndicesPdfMeta } from "@/lib/email-campaign-attachments";

function ensureAbsoluteUrl(path: string): string {
  const origin = getPublicAppOrigin();
  if (!origin) return path;
  return `${origin}${path}`;
}

export function buildTrackedCampaignHtml(params: {
  html: string;
  trackingToken: string;
  unsubscribeToken?: string | null;
}): string {
  const pdfMeta = getBaladIndicesPdfMeta();
  const openTrackingUrl = ensureAbsoluteUrl(
    `/api/email/track/open?token=${encodeURIComponent(params.trackingToken)}`
  );

  // On utilise la signature comme image "d'ouverture".
  // Le endpoint `/api/email/track/open` renverra l'image PNG quand `img=signature`.
  const signatureTrackingUrl = ensureAbsoluteUrl(
    `/api/email/track/open?token=${encodeURIComponent(
      params.trackingToken
    )}&img=${encodeURIComponent("signature")}`
  );
  const unsubscribeUrl = params.unsubscribeToken
    ? ensureAbsoluteUrl(
        `/api/email/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`
      )
    : null;

  // Si le HTML contient déjà un lien de désinscription (cas des templates "prêts à l'emploi"),
  // on évite de dupliquer le bloc.
  const htmlAlreadyHasUnsubscribe =
    unsubscribeUrl != null &&
    (params.html.includes(unsubscribeUrl) || params.html.includes("/api/email/unsubscribe"));

  const unsubscribeBlock =
    unsubscribeUrl && !htmlAlreadyHasUnsubscribe
      ? `<p style="margin-top:24px;font-size:12px;color:#666;">Vous ne souhaitez plus recevoir ces messages ? <a href="${unsubscribeUrl}" style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;display:inline-block;font-weight:bold;">Se désinscrire</a></p>`
      : "";

  const signatureBlock = `
    <p style="margin-top:24px;margin-bottom:0;">
      <img
        src="${signatureTrackingUrl}"
        alt="Signature Balad'indice"
        style="display:block;border:0;outline:none;text-decoration:none;max-width:240px;height:auto;"
      />
    </p>
  `;

  // Si le PDF est trop gros pour être attaché, on propose un lien à la place.
  const pdfLinkBlock =
    pdfMeta?.attachments == null && pdfMeta?.publicPath
      ? `
  <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">
    Vous pouvez également télécharger le dossier ici :
    <a href="${ensureAbsoluteUrl(pdfMeta.publicPath)}" style="color:#1f5fbf;text-decoration:underline;">PDF Balad'indice</a>.
  </p>
`
      : "";

  // Pixel 1x1 en fallback : certains clients chargent les très petites ressources
  // même si d'autres images sont bloquées.
  const trackingPixel = `<img src="${openTrackingUrl}" alt="" width="1" height="1" style="display:block;border:0;outline:none;text-decoration:none;width:1px;height:1px;" />`;

  let htmlWithSignature = params.html;
  const alreadyHasSignature =
    htmlWithSignature.includes(`img src="${signatureTrackingUrl}"`);

  if (!alreadyHasSignature) {
    const insertAfter = (needle: string) => {
      const idx = htmlWithSignature.indexOf(needle);
      if (idx === -1) return false;
      htmlWithSignature = htmlWithSignature.replace(needle, `${needle}${signatureBlock}`);
      return true;
    };

    // On insère la signature juste après la ligne "Cordialement".
    let inserted = insertAfter("Cordialement,</p>");
    if (!inserted) inserted = insertAfter("Cordialement.</p>");
    if (!inserted) htmlWithSignature = `${htmlWithSignature}${signatureBlock}`;
  }

  return `${htmlWithSignature}${unsubscribeBlock}${pdfLinkBlock}${trackingPixel}`;
}
