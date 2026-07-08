import "server-only";

import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/send-transactional-email";
import { buildTrackedCampaignHtml } from "@/lib/email-campaign-tracking";
import { runEmailCampaign, substituteTemplateVars } from "@/lib/emailing";
import { getBaladIndicesPdfAttachments } from "@/lib/email-campaign-attachments";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getProspectContactEmail } from "@/lib/prospect-contact-email";
import {
  completeProspectSequence,
  getProspectFollowupBlockReason,
} from "@/lib/prospect-events";
import { DEFAULT_PROSPECT_CONTACT_NAME } from "@/lib/prospect-events-constants";
import { logProspectEmailSent } from "@/lib/prospect-events";
import { SEQUENCE_MAIL_COUNT } from "@/lib/prospect-sequence";

const FOLLOWUP_DAYS = 10;
const DEFAULT_CRON_BATCH_SIZE = 10;
const DEFAULT_CRON_HOUR_START = 8;
const DEFAULT_CRON_HOUR_END = 19;
const DEFAULT_CRON_TIMEZONE = "Europe/Paris";
const CRON_LOCK_KEY = 8347291;

type ProspectCronQueue = "intro" | "relance" | "final";
const campaignAttachments = getBaladIndicesPdfAttachments();

const INTENDED_RECIPIENT_NOTICE =
  "Ce message est adressé au maire, aux adjoints ou aux délégués chargés de l'animation, de la culture et/ou du patrimoine. Si vous n'êtes pas le destinataire concerné, merci de bien vouloir le transmettre à la personne compétente.";

function intendedRecipientNoticeHtml(): string {
  return `<p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">${INTENDED_RECIPIENT_NOTICE}</p>`;
}

function communesLandingNoticeText(): string {
  return "Pour découvrir les avantages de Balad'indice pour votre collectivité, consultez : {{communes_url}}";
}

function communesLandingNoticeHtml(): string {
  return `
                <tr>
                  <td style="padding:0 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                      <tr>
                        <td style="padding:16px 14px;text-align:center;">
                          <p style="margin:0 0 12px;font-size:14.5px;">Découvrez les avantages de Balad'indice pour les communes et intercommunalités.</p>
                          <a href="{{communes_url}}" style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block;">
                            Voir les avantages pour ma commune
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

function prospectContactInviteText(): string {
  return "Pour échanger avec nous : {{reply_email}}";
}

function prospectContactInviteHtml(): string {
  return `
                <tr>
                  <td style="padding:0 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:14px;">
                      <tr>
                        <td style="padding:20px 18px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Restons en contact</p>
                          <p style="margin:0 0 16px;font-size:14.5px;color:#334155;line-height:1.55;">Une question sur Balad'indice pour <strong>{{commune}}</strong> ? Répondez à cet e-mail ou écrivez-nous.</p>
                          <a href="mailto:{{reply_email}}" style="background:#ffffff;color:#1f5fbf;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;display:inline-block;border:1px solid #bfdbfe;box-shadow:0 1px 2px rgba(15,23,42,0.06);font-size:15px;">
                            {{reply_email}}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
}

function buildProspectTemplateVars(params: {
  commune: string;
  intercommunalite: string;
  contactName: string;
  replyEmail: string;
  unsubscribeToken: string;
}): Record<string, string> {
  const origin = getPublicAppOrigin() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  const base = origin.replace(/\/$/, "");
  return {
    commune: params.commune,
    intercommunalite: params.intercommunalite,
    contact_name: params.contactName,
    reply_email: getProspectContactEmail(params.replyEmail),
    communes_url: `${base}/communes`,
    unsubscribe_url: `${base}/api/email/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`,
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildIntroText(): string {
  return `Bonjour {{contact_name}},

${INTENDED_RECIPIENT_NOTICE}

En échangeant avec de nombreux acteurs locaux et grâce à mon engagement en tant qu'élu local, j'ai pu constater une réalité que partagent beaucoup de collectivités : il n'est pas toujours simple de proposer de nouvelles animations, d'attirer des visiteurs, de faire découvrir le patrimoine ou encore de donner envie aux habitants de redécouvrir leur propre commune.

C'est de cette réflexion qu'est née Balad'indice, une application française développée dans un cadre strictement professionnel et indépendant de mon mandat. Son objectif est simple : permettre aux communes, intercommunalités et offices de tourisme de proposer une expérience originale, accessible toute l'année et entièrement personnalisable.

Balad'indice transforme une simple promenade en une véritable chasse au trésor. Les participants parcourent {{commune}} en résolvant des énigmes, en suivant des indices et en découvrant progressivement les lieux emblématiques, le patrimoine, l'histoire ou encore les espaces naturels de la commune.

À l'issue du parcours, ils ne remportent pas uniquement un badge virtuel : ils peuvent accéder à un véritable trésor, défini librement par la collectivité. Il peut s'agir d'un produit local, d'un cadeau proposé par un commerçant partenaire, d'une entrée, d'une récompense symbolique ou de toute autre surprise imaginée pour prolonger l'expérience et encourager la découverte du territoire.

Chaque parcours est entièrement conçu aux couleurs de la commune. Il peut être créé autour du patrimoine historique, d'un circuit touristique, d'un événement, d'une thématique particulière ou encore d'une opération de dynamisation du centre-ville.

L'ambition de Balad'indice n'est pas de remplacer les initiatives déjà existantes, mais d'offrir un nouvel outil simple, moderne et ludique pour mettre en valeur les richesses de {{commune}} tout en créant une expérience mémorable pour les habitants comme pour les visiteurs.

${communesLandingNoticeText()}

Si cette démarche peut répondre aux enjeux de {{commune}} et de {{intercommunalite}}, je serais ravi d'échanger avec vous afin de vous présenter plus en détail le fonctionnement de Balad'indice et d'imaginer ensemble un premier parcours adapté à votre territoire.

Je vous remercie pour le temps consacré à cette lecture et reste naturellement à votre disposition.

${prospectContactInviteText()}

Cordialement,

Pour ne plus recevoir nos informations, vous pouvez vous désinscrire à tout moment en cliquant ici : {{unsubscribe_url}}.`;
}

function buildFollowupText(): string {
  return `Bonjour {{contact_name}},

${INTENDED_RECIPIENT_NOTICE}

Je me permets de revenir vers vous une dizaine de jours après mon précédent message au sujet de Balad'indice, au cas où vous n'auriez pas encore eu l'occasion de le consulter.

Je sais que les sollicitations sont nombreuses et que les priorités des collectivités évoluent rapidement. Mon objectif est simplement de savoir si cette démarche pourrait présenter un intérêt pour {{commune}}.

Balad'indice permet de proposer une véritable chasse au trésor afin de faire découvrir le patrimoine local de manière ludique, avec une récompense réelle à la clé, définie par la collectivité.

${communesLandingNoticeText()}

Si le sujet vous intéresse, je serais ravi de vous présenter le concept lors d'un échange d'une vingtaine de minutes et de répondre à vos éventuelles questions.

Dans le cas contraire, n'hésitez pas à me le faire savoir. Cela m'évitera de vous solliciter inutilement.

${prospectContactInviteText()}

Je vous remercie pour votre temps et vous souhaite une excellente journée.

Cordialement,

Pour ne plus recevoir nos informations, vous pouvez vous désinscrire à tout moment : {{unsubscribe_url}}.`;
}

function buildFinalReminderText(): string {
  return `Bonjour {{contact_name}},

${INTENDED_RECIPIENT_NOTICE}

Je me permets de vous adresser un dernier message concernant **Balad'indice**, avant de clôturer ce dossier.

Mon objectif était simplement de vous faire découvrir une nouvelle manière de valoriser le patrimoine de {{commune}} à travers une véritable chasse au trésor, accessible toute l'année et entièrement personnalisable.

Je comprends parfaitement que ce projet ne fasse peut-être pas partie de vos priorités actuelles, ou que le moment ne soit tout simplement pas le bon.

${communesLandingNoticeText()}

Si toutefois le sujet vous intéresse, je serais ravi d'échanger avec vous afin de vous présenter plus en détail le concept et de voir comment il pourrait s'adapter à votre territoire.

À défaut de retour de votre part, je ne vous recontacterai plus à ce sujet. Bien entendu, si vos besoins évoluent dans les prochains mois, vous pourrez toujours reprendre contact avec moi, ce sera avec plaisir.

${prospectContactInviteText()}

Je vous remercie sincèrement pour le temps consacré à la lecture de mes messages et vous souhaite une excellente continuation.

Cordialement,

Pour ne plus recevoir nos informations, vous pouvez vous désinscrire à tout moment : {{unsubscribe_url}}.`;
}

function buildIntroHtml(): string {
  // HTML "fragment" (pas de <html>/<body>) : l'enveloppe e-mail est gérée côté appli.
  // Les placeholders seront injectés à l'envoi (voir `runEmailCampaign`).
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
          <tr>
            <td style="padding:26px 24px;font-family:Arial, Helvetica, sans-serif;color:#111827;line-height:1.65;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 14px;">
                    <p style="margin:0;font-size:16px;">Bonjour {{contact_name}},</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 20px;">
                    ${intendedRecipientNoticeHtml()}
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0;font-size:14.5px;">En échangeant avec de nombreux acteurs locaux et grâce à mon engagement en tant qu'élu local, j'ai pu constater une réalité que partagent beaucoup de collectivités : il n'est pas toujours simple de proposer de nouvelles animations, d'attirer des visiteurs, de faire découvrir le patrimoine ou encore de donner envie aux habitants de redécouvrir leur propre commune.</p>
                  </td>
                </tr>

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <p style="margin:0;font-size:14.5px;">C'est de cette réflexion qu'est née <strong>Balad'indice</strong>, une application française développée dans un cadre strictement professionnel et indépendant de mon mandat. Son objectif est simple : permettre aux communes, intercommunalités et offices de tourisme de proposer une expérience originale, accessible toute l'année et entièrement personnalisable.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0;font-size:14.5px;"><strong>Balad'indice transforme une simple promenade en une véritable chasse au trésor.</strong> Les participants parcourent {{commune}} en résolvant des énigmes, en suivant des indices et en découvrant progressivement les lieux emblématiques, le patrimoine, l'histoire ou encore les espaces naturels de la commune.</p>
                  </td>
                </tr>

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <p style="margin:0;font-size:14.5px;">À l'issue du parcours, ils ne remportent pas uniquement un badge virtuel : ils peuvent accéder à <strong>un véritable trésor</strong>, défini librement par la collectivité. Il peut s'agir d'un produit local, d'un cadeau proposé par un commerçant partenaire, d'une entrée, d'une récompense symbolique ou de toute autre surprise imaginée pour prolonger l'expérience et encourager la découverte du territoire.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Chaque parcours est entièrement conçu aux couleurs de la commune. Il peut être créé autour du patrimoine historique, d'un circuit touristique, d'un événement, d'une thématique particulière ou encore d'une opération de dynamisation du centre-ville.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #eef2f7;border-left:4px solid #1f5fbf;border-radius:12px;">
                      <tr>
                        <td style="padding:14px 14px;">
                          <p style="margin:0;font-size:14.5px;">L'ambition de Balad'indice n'est pas de remplacer les initiatives déjà existantes, mais d'offrir un nouvel outil simple, moderne et ludique pour mettre en valeur les richesses de {{commune}} tout en créant une expérience mémorable pour les habitants comme pour les visiteurs.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                ${communesLandingNoticeHtml()}

                <tr>
                  <td style="padding:24px 0 18px;">
                    <p style="margin:0;font-size:14.5px;">Si cette démarche peut répondre aux enjeux de {{commune}} et de {{intercommunalite}}, je serais ravi d'échanger avec vous afin de vous présenter plus en détail le fonctionnement de Balad'indice et d'imaginer ensemble un premier parcours adapté à votre territoire.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 18px;">
                    <p style="margin:0;font-size:14.5px;">Je vous remercie pour le temps consacré à cette lecture et reste naturellement à votre disposition.</p>
                  </td>
                </tr>

                <tr>
                  <td style="text-align:center;padding:8px 0 16px;">
                    <a href="{{communes_url}}" style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;display:inline-block;">
                      Découvrir Balad'indice
                    </a>
                  </td>
                </tr>

                ${prospectContactInviteHtml()}

                <tr>
                  <td style="padding:0 0 6px;">
                    <p style="margin:0;font-size:15px;">Cordialement,</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0;">
                    <p style="font-size:12.5px;color:#6b7280;margin:0;">
                      Pour ne plus recevoir nos informations, vous pouvez vous désinscrire ici :
                      <a
                        href="{{unsubscribe_url}}"
                        style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;display:inline-block;font-weight:bold;"
                      >
                        Se désinscrire
                      </a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function buildFollowupHtml(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
          <tr>
            <td style="padding:26px 24px;font-family:Arial, Helvetica, sans-serif;color:#111827;line-height:1.65;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 14px;">
                    <p style="margin:0;font-size:16px;">Bonjour {{contact_name}},</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 20px;">
                    ${intendedRecipientNoticeHtml()}
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Je me permets de revenir vers vous une dizaine de jours après mon précédent message au sujet de <strong>Balad'indice</strong>, au cas où vous n'auriez pas encore eu l'occasion de le consulter.</p>
                  </td>
                </tr>

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Je sais que les sollicitations sont nombreuses et que les priorités des collectivités évoluent rapidement. Mon objectif est simplement de savoir si cette démarche pourrait présenter un intérêt pour <strong>{{commune}}</strong>.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Balad'indice permet de proposer une véritable chasse au trésor afin de faire découvrir le patrimoine local de manière ludique, avec une récompense réelle à la clé, définie par la collectivité.</p>
                  </td>
                </tr>

                ${communesLandingNoticeHtml()}

                <tr>
                  <td style="padding:0 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #eef2f7;border-left:4px solid #1f5fbf;border-radius:12px;">
                      <tr>
                        <td style="padding:14px 14px;">
                          <p style="margin:0;font-size:14.5px;">Si le sujet vous intéresse, je serais ravi d'échanger avec vous pendant une vingtaine de minutes afin de vous présenter le concept et répondre à vos questions.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${prospectContactInviteHtml()}

                <tr>
                  <td style="padding:0 0 6px;">
                    <p style="margin:0;font-size:16px;">Cordialement.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0;">
                    <p style="font-size:12.5px;color:#6b7280;margin:0;">
                      Pour ne plus recevoir nos informations :
                      <a
                        href="{{unsubscribe_url}}"
                        style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;display:inline-block;font-weight:bold;"
                      >
                        Se désinscrire
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

function buildFinalReminderHtml(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
          <tr>
            <td style="padding:26px 24px;font-family:Arial, Helvetica, sans-serif;color:#111827;line-height:1.65;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 14px;">
                    <p style="margin:0;font-size:16px;">Bonjour {{contact_name}},</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 20px;">
                    ${intendedRecipientNoticeHtml()}
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Je me permets de vous adresser un dernier message concernant <strong>Balad'indice</strong>, avant de clôturer ce dossier.</p>
                  </td>
                </tr>

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <p style="margin:0;font-size:14.5px;">Mon objectif était simplement de vous faire découvrir une nouvelle manière de valoriser le patrimoine de <strong>{{commune}}</strong> à travers une véritable chasse au trésor, accessible toute l'année et entièrement personnalisable.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 18px;">
                    <p style="margin:0;font-size:14.5px;">Je comprends parfaitement que ce projet ne fasse peut-être pas partie de vos priorités actuelles, ou que le moment ne soit tout simplement pas le bon.</p>
                  </td>
                </tr>

                ${communesLandingNoticeHtml()}

                <tr>
                  <td style="height:1px;background:#e5e7eb;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>

                <tr>
                  <td style="padding:24px 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #eef2f7;border-left:4px solid #1f5fbf;border-radius:12px;">
                      <tr>
                        <td style="padding:14px 14px;">
                          <p style="margin:0;font-size:14.5px;">Si toutefois le sujet vous intéresse, je serais ravi d'échanger avec vous afin de vous présenter plus en détail le concept et de voir comment il pourrait s'adapter à votre territoire.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${prospectContactInviteHtml()}

                <tr>
                  <td style="padding:0 0 18px;">
                    <p style="margin:0;font-size:14.5px;">À défaut de retour de votre part, je ne vous recontacterai plus à ce sujet. Bien entendu, si vos besoins évoluent dans les prochains mois, vous pourrez toujours reprendre contact avec moi, ce sera avec plaisir.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 0 6px;">
                    <p style="margin:0;font-size:16px;">Cordialement.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0;">
                    <p style="font-size:12.5px;color:#6b7280;margin:0;">
                      Pour ne plus recevoir nos informations :
                      <a
                        href="{{unsubscribe_url}}"
                        style="background:#1f5fbf;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;display:inline-block;font-weight:bold;"
                      >
                        Se désinscrire
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

type CampaignVariant = "intro" | "followup" | "final";

function getCampaignVariant(step: number): CampaignVariant {
  if (step <= 0) return "intro";
  if (step === 1) return "followup";
  return "final";
}

function buildCampaignContent(variant: CampaignVariant): {
  subject: string;
  text: string;
  html: string;
} {
  if (variant === "intro") {
    return {
      subject:
        "Et si {{commune}} proposait une véritable chasse au trésor toute l'année ?",
      text: buildIntroText(),
      html: buildIntroHtml(),
    };
  }
  if (variant === "followup") {
    return {
      subject: "Re : Une nouvelle façon de valoriser {{commune}}",
      text: buildFollowupText(),
      html: buildFollowupHtml(),
    };
  }
  if (variant === "final") {
    return {
      subject: "Dernier message concernant Balad'indice",
      text: buildFinalReminderText(),
      html: buildFinalReminderHtml(),
    };
  }
  return {
    subject: "Une nouvelle maniere de faire decouvrir votre commune",
    text: buildIntroText(),
    html: buildIntroHtml(),
  };
}

function getProspectCronBatchSize(): number {
  const parsed = Number.parseInt(process.env.PROSPECT_CRON_BATCH_SIZE ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CRON_BATCH_SIZE;
}

function getProspectCronTimezone(): string {
  return process.env.PROSPECT_CRON_TIMEZONE?.trim() || DEFAULT_CRON_TIMEZONE;
}

function getCurrentHourInCronTimezone(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: getProspectCronTimezone(),
      hour: "numeric",
      hour12: false,
    }).format(now)
  );
}

function getProspectCronHourRange(): { start: number; end: number } {
  const start = Number.parseInt(process.env.PROSPECT_CRON_HOUR_START ?? "", 10);
  const end = Number.parseInt(process.env.PROSPECT_CRON_HOUR_END ?? "", 10);
  return {
    start: Number.isFinite(start) ? start : DEFAULT_CRON_HOUR_START,
    end: Number.isFinite(end) ? end : DEFAULT_CRON_HOUR_END,
  };
}

/** Rotation horaire sur 3 files : intro → relance J+10 → dernier message (8h–19h). */
export function getActiveProspectCronQueueForHour(hour: number): ProspectCronQueue | null {
  const { start, end } = getProspectCronHourRange();
  if (hour < start || hour > end) return null;
  const slot = hour % 3;
  if (slot === 0) return "intro";
  if (slot === 1) return "relance";
  return "final";
}

function getFollowUpStepFilterForQueue(queue: ProspectCronQueue) {
  if (queue === "intro") return { followUpStep: { lte: 0 } } as const;
  if (queue === "relance") return { followUpStep: 1 } as const;
  return { followUpStep: 2 } as const;
}

function computeHourlyBatchSize(backlog: number): number {
  if (backlog <= 0) return 0;
  return Math.min(getProspectCronBatchSize(), backlog);
}

/** Fenêtre d'envoi : par défaut 8h–19h (heure de Paris), inclus. */
export function isWithinProspectCronSendingWindow(now = new Date()): boolean {
  const hour = getCurrentHourInCronTimezone(now);
  const { start, end } = getProspectCronHourRange();
  return hour >= start && hour <= end;
}

async function backfillCompletedProspectSequences(): Promise<void> {
  const candidates = await prisma.prospect.findMany({
    where: {
      sequenceCompletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      lastContactedAt: true,
      recipients: {
        where: { status: "SENT", sequenceStep: { not: null } },
        select: { id: true },
      },
    },
  });

  for (const prospect of candidates) {
    if (prospect.recipients.length < SEQUENCE_MAIL_COUNT) continue;
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        sequenceCompletedAt: prospect.lastContactedAt ?? new Date(),
        nextFollowUpAt: null,
        commercialStatus: "CLOSED",
      },
    });
  }
}

async function getSystemCampaignAuthorId(): Promise<string | null> {
  const superadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
    select: { id: true },
  });
  if (superadmin) return superadmin.id;
  const fallback = await prisma.user.findFirst({ select: { id: true } });
  return fallback?.id ?? null;
}

export async function sendProspectFollowups(): Promise<{
  queued: number;
  skipped: number;
  queue?: ProspectCronQueue | null;
  backlog?: number;
  dispatchedBatch?: number;
  alreadyRunning?: boolean;
  outsideWindow?: boolean;
}> {
  if (!isWithinProspectCronSendingWindow()) {
    return { queued: 0, skipped: 0, outsideWindow: true };
  }

  const currentHour = getCurrentHourInCronTimezone();
  const activeQueue = getActiveProspectCronQueueForHour(currentHour);
  if (!activeQueue) {
    return { queued: 0, skipped: 0, outsideWindow: true };
  }

  const lockRows = await prisma.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(${CRON_LOCK_KEY}) AS locked
  `;
  if (!lockRows[0]?.locked) {
    return { queued: 0, skipped: 0, alreadyRunning: true };
  }

  try {
    await backfillCompletedProspectSequences();
    await backfillProspectOwners();
    const now = new Date();
    const eligibleWhere = {
      status: "ACTIVE" as const,
      commercialStatus: "OPEN" as const,
      emailBouncedAt: null,
      sequenceCompletedAt: null,
      nextFollowUpAt: { lte: now },
      meetings: {
        none: { status: "SCHEDULED" as const },
      },
    };

    const queueWhere = getFollowUpStepFilterForQueue(activeQueue);

    const backlog = await prisma.prospect.count({
      where: { ...eligibleWhere, ...queueWhere },
    });
    const dispatchedBatch = computeHourlyBatchSize(backlog);

    if (dispatchedBatch === 0) {
      return {
        queued: 0,
        skipped: 0,
        queue: activeQueue,
        backlog,
        dispatchedBatch: 0,
      };
    }

    const prospects = await prisma.prospect.findMany({
      where: { ...eligibleWhere, ...queueWhere },
      orderBy: { nextFollowUpAt: "asc" },
      take: dispatchedBatch,
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });
    if (prospects.length === 0) {
      return {
        queued: 0,
        skipped: 0,
        queue: activeQueue,
        backlog,
        dispatchedBatch,
      };
    }

    const { sent, skipped, sentProspectIds } = await queueProspectFollowupCampaign(prospects);
    if (sentProspectIds.length > 0) {
      const sentIdsSet = new Set(sentProspectIds);
      const sentFinalIds = prospects
        .filter((p) => sentIdsSet.has(p.id) && getCampaignVariant(p.followUpStep) === "final")
        .map((p) => p.id);
      const sentNonFinalIds = prospects
        .filter((p) => sentIdsSet.has(p.id) && getCampaignVariant(p.followUpStep) !== "final")
        .map((p) => p.id);

      if (sentNonFinalIds.length > 0) {
        await prisma.prospect.updateMany({
          where: { id: { in: sentNonFinalIds } },
          data: {
            lastContactedAt: now,
            nextFollowUpAt: addDays(now, FOLLOWUP_DAYS),
            followUpStep: { increment: 1 },
          },
        });
      }

      for (const prospectId of sentFinalIds) {
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { lastContactedAt: now },
        });
        await completeProspectSequence(prospectId);
      }
    }
    return {
      queued: sent,
      skipped,
      queue: activeQueue,
      backlog,
      dispatchedBatch,
    };
  } finally {
    await prisma.$executeRaw`SELECT pg_advisory_unlock(${CRON_LOCK_KEY})`;
  }
}

export async function sendProspectFollowupNow(prospectId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: {
      owner: { select: { id: true, email: true, name: true } },
    },
  });
  if (!prospect) {
    return { ok: false, message: "Prospect introuvable." };
  }
  if (prospect.status !== "ACTIVE") {
    return { ok: false, message: "Le prospect est désinscrit." };
  }

  const blockReason = await getProspectFollowupBlockReason(prospect.id);
  if (blockReason) {
    return { ok: false, message: blockReason };
  }

  const { sent, sentProspectIds } = await queueProspectFollowupCampaign([prospect]);
  if (sent === 0) {
    return { ok: false, message: "Échec de l'envoi de relance." };
  }

  const now = new Date();
  const isFinal = getCampaignVariant(prospect.followUpStep) === "final";
  if (isFinal) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { lastContactedAt: now },
    });
    await completeProspectSequence(prospect.id);
  } else {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        lastContactedAt: now,
        nextFollowUpAt: addDays(now, FOLLOWUP_DAYS),
        followUpStep: { increment: 1 },
      },
    });
  }
  return { ok: true, message: "Relance envoyée." };
}

async function backfillProspectOwners(): Promise<void> {
  const defaultOwnerId = await getSystemCampaignAuthorId();
  if (!defaultOwnerId) return;
  await prisma.prospect.updateMany({
    where: { ownerUserId: null },
    data: { ownerUserId: defaultOwnerId },
  });
}

type ProspectFollowupRow = {
  id: string;
  email: string;
  commune?: string | null;
  intercommunalite?: string | null;
  contactName?: string | null;
  followUpStep: number;
  unsubscribeToken: string;
  ownerUserId?: string | null;
  owner?: { id: string; email: string; name: string | null } | null;
};

async function queueProspectFollowupCampaignForOwner(
  prospects: ProspectFollowupRow[],
  sender: { authorId: string | null; replyEmail: string }
): Promise<{ sent: number; skipped: number; sentProspectIds: string[] }> {
  if (prospects.length === 0) {
    return { sent: 0, skipped: 0, sentProspectIds: [] };
  }

  if (!sender.authorId) {
    let sent = 0;
    const sentProspectIds: string[] = [];
    for (const prospect of prospects) {
      try {
        const variant = getCampaignVariant(prospect.followUpStep);
        const content = buildCampaignContent(variant);
        const communeForSubject = prospect.commune?.trim() || "votre commune";
        const intercommunaliteForText = prospect.intercommunalite?.trim() || "";
        const contactName = prospect.contactName?.trim() || DEFAULT_PROSPECT_CONTACT_NAME;
        const vars = buildProspectTemplateVars({
          commune: communeForSubject,
          intercommunalite: intercommunaliteForText,
          contactName,
          replyEmail: sender.replyEmail,
          unsubscribeToken: prospect.unsubscribeToken,
        });

        await sendTransactionalEmail({
          to: prospect.email,
          subject: substituteTemplateVars(content.subject, vars),
          text: substituteTemplateVars(content.text, vars),
          html: buildTrackedCampaignHtml({
            html: substituteTemplateVars(content.html, vars),
            trackingToken: `${prospect.id}-${Date.now()}`,
            unsubscribeToken: prospect.unsubscribeToken,
          }),
          replyTo: getProspectContactEmail(sender.replyEmail) || undefined,
          attachments: campaignAttachments ?? undefined,
        });
        await logProspectEmailSent({
          prospectId: prospect.id,
          sequenceStep: prospect.followUpStep,
        });
        sent += 1;
        sentProspectIds.push(prospect.id);
      } catch {
        // Ignore individuellement pour continuer les autres.
      }
    }
    return { sent, skipped: prospects.length - sent, sentProspectIds };
  }

  const introProspects = prospects.filter((p) => getCampaignVariant(p.followUpStep) === "intro");
  const followupProspects = prospects.filter((p) => getCampaignVariant(p.followUpStep) === "followup");
  const finalStageProspects = prospects.filter((p) => getCampaignVariant(p.followUpStep) === "final");
  const groups: Array<{ variant: CampaignVariant; prospects: ProspectFollowupRow[] }> = [
    { variant: "intro", prospects: introProspects },
    { variant: "followup", prospects: followupProspects },
    { variant: "final", prospects: finalStageProspects },
  ];

  const sentProspectIds: string[] = [];
  for (const group of groups) {
    if (group.prospects.length === 0) continue;
    const content = buildCampaignContent(group.variant);
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: content.subject,
        text: content.text,
        html: content.html,
        createdById: sender.authorId,
        totalCount: group.prospects.length,
        recipients: {
          create: group.prospects.map((prospect) => ({
            email: prospect.email,
            prospectId: prospect.id,
            sequenceStep: prospect.followUpStep,
          })),
        },
      },
    });
    await runEmailCampaign(campaign.id);

    const sentRecipients = await prisma.emailCampaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        prospectId: { not: null },
      },
      select: { prospectId: true },
    });
    for (const recipient of sentRecipients) {
      if (recipient.prospectId && !sentProspectIds.includes(recipient.prospectId)) {
        sentProspectIds.push(recipient.prospectId);
      }
    }
  }
  return {
    sent: sentProspectIds.length,
    skipped: prospects.length - sentProspectIds.length,
    sentProspectIds,
  };
}

async function queueProspectFollowupCampaign(
  prospects: ProspectFollowupRow[]
): Promise<{ sent: number; skipped: number; sentProspectIds: string[] }> {
  const systemAuthorId = await getSystemCampaignAuthorId();
  const byOwner = new Map<string, ProspectFollowupRow[]>();

  for (const prospect of prospects) {
    const key = prospect.ownerUserId ?? prospect.owner?.id ?? "__system__";
    const list = byOwner.get(key) ?? [];
    list.push(prospect);
    byOwner.set(key, list);
  }

  let sent = 0;
  const sentProspectIds: string[] = [];
  for (const group of byOwner.values()) {
    const owner = group[0]?.owner ?? null;
    const result = await queueProspectFollowupCampaignForOwner(group, {
      authorId: owner?.id ?? systemAuthorId,
      replyEmail: getProspectContactEmail(owner?.email),
    });
    sent += result.sent;
    sentProspectIds.push(...result.sentProspectIds);
  }

  return {
    sent,
    skipped: prospects.length - sent,
    sentProspectIds,
  };
}
