import "server-only";

import {
  buildBrandEmailHtml,
  escapeHtmlForBrandEmail,
  type BrandEmailBlock,
} from "@/lib/email-brand-template";
import { getPublicAppOrigin, getResetPasswordRedirectUrl } from "@/lib/public-app-url";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";

/** E-mail de suspension (après ban effectif). */
export function queueUserBannedEmail(params: {
  to: string;
  displayName: string;
  reason: string;
  banExpires: Date | null;
}): void {
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const lines: string[] = [
    greet,
    "",
    "Votre compte Balad'indice a été suspendu. Vous ne pouvez plus vous connecter tant que le compte reste suspendu.",
    "",
    `Motif communiqué : ${params.reason}`,
  ];
  if (params.banExpires) {
    lines.push(
      "",
      `Fin prévue de la suspension : ${params.banExpires.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}.`
    );
  } else {
    lines.push("", "Aucune date de fin automatique n’a été indiquée.");
  }
  lines.push(
    "",
    "Si vous pensez qu’il s’agit d’une erreur, contactez le support du service.",
    "",
    "— L’équipe Balad'indice"
  );
  const text = lines.join("\n");

  const expiry =
    params.banExpires != null
      ? `Fin prévue de la suspension : ${params.banExpires.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}.`
      : "Aucune date de fin automatique n’a été indiquée pour cette suspension.";

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">Votre compte a été <strong>suspendu</strong>. Vous ne pouvez plus vous connecter tant que cette mesure est en vigueur.</p>`,
    },
    { type: "highlight", title: "Motif", text: params.reason },
    { type: "p", text: expiry },
    {
      type: "html",
      html: `<p style="margin:0;color:#281401;font-size:16px;line-height:1.55;">Si vous pensez qu’il s’agit d’une erreur, contactez le support du service.</p>`,
    },
  ];

  const html = buildBrandEmailHtml({
    preheader: "Votre compte Balad'indice a été suspendu.",
    headline: "Compte suspendu",
    blocks,
  });

  queueTransactionalEmail({ to: params.to, subject: "[Balad'indice] Compte suspendu", text, html });
}

export function queueUserUnbannedEmail(params: {
  to: string;
  displayName: string;
}): void {
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const text = `${greet}

Votre compte Balad'indice est à nouveau actif. Vous pouvez vous reconnecter.

— L’équipe Balad'indice`;

  const html = buildBrandEmailHtml({
    preheader: "Votre compte Balad'indice est réactivé.",
    headline: "Compte réactivé",
    blocks: [
      {
        type: "html",
        html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
      },
      {
        type: "html",
        html: `<p style="margin:0;color:#281401;font-size:16px;line-height:1.55;">Bonne nouvelle : votre compte est <strong>à nouveau actif</strong>. Vous pouvez vous reconnecter à l’application.</p>`,
      },
    ],
  });

  queueTransactionalEmail({ to: params.to, subject: "[Balad'indice] Compte réactivé", text, html });
}

/** Compte créé par un administrateur (e-mail déjà vérifié). */
export function queueWelcomeAdminCreatedUserEmail(params: {
  to: string;
  displayName: string;
}): void {
  const origin = getPublicAppOrigin();
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const resetUrl = getResetPasswordRedirectUrl();
  const text = `${greet}

Un compte Balad'indice vient d’être créé pour vous par l’équipe.

${origin ? `Connectez-vous sur ${origin} avec l’adresse e-mail et le mot de passe qui vous ont été communiqués.` : "Connectez-vous à l’application avec l’adresse e-mail et le mot de passe qui vous ont été communiqués."}

Pour choisir un nouveau mot de passe, utilisez « mot de passe oublié » sur l’écran de connexion${resetUrl.startsWith("http") ? ` : ${resetUrl}` : ""}.

— L’équipe Balad'indice`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">Un compte <strong>Balad'indice</strong> vient d’être créé pour vous par l’équipe. Vous pouvez vous connecter avec l’adresse e-mail et le mot de passe qui vous ont été transmis.</p>`,
    },
    {
      type: "highlight",
      title: "Sécurité",
      text: "Changez votre mot de passe après la première connexion si l’équipe vous a communiqué un mot de passe temporaire.",
    },
  ];
  if (resetUrl.startsWith("http")) {
    blocks.push({ type: "cta", label: "Réinitialiser le mot de passe", href: resetUrl });
  }

  const html = buildBrandEmailHtml({
    preheader: "Votre compte Balad'indice est prêt.",
    headline: "Bienvenue sur Balad'indice",
    blocks,
  });

  queueTransactionalEmail({
    to: params.to,
    subject: "[Balad'indice] Votre compte a été créé",
    text,
    html,
  });
}

/** Demande admin clôturée — informe le demandeur. */
export function queueAdminRequestClosedEmail(params: {
  to: string;
  displayName: string;
  requestLabel: string;
  requestId: string;
}): void {
  const origin = getPublicAppOrigin();
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const listPath = "/admin-game/dashboard/demandes";
  const listUrl = origin ? `${origin}${listPath}` : listPath;
  const text = `${greet}

Votre demande « ${params.requestLabel} » (${params.requestId}) a été marquée comme traitée par l’équipe.

${origin ? `Détail : ${listUrl}` : "Connectez-vous au tableau de bord pour consulter l’historique des demandes."}

— Balad'indice`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;">Votre demande <strong>${escapeHtmlForBrandEmail(params.requestLabel)}</strong> a été <strong>marquée comme traitée</strong> par l’équipe.</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:14px;line-height:1.5;">Référence : <span style="font-family:ui-monospace,monospace;background:#f0ebe3;padding:2px 8px;border-radius:4px;">${escapeHtmlForBrandEmail(params.requestId)}</span></p>`,
    },
  ];
  if (origin) {
    blocks.push({
      type: "cta",
      label: "Voir le tableau des demandes",
      href: listUrl,
    });
  } else {
    blocks.push({
      type: "p",
      text: "Ouvrez le tableau de bord administration pour consulter vos demandes.",
    });
  }

  const html = buildBrandEmailHtml({
    preheader: "Votre demande a été traitée.",
    headline: "Demande traitée",
    blocks,
  });

  queueTransactionalEmail({
    to: params.to,
    subject: `[Balad'indice] Demande traitée — ${params.requestLabel}`,
    text,
    html,
  });
}
