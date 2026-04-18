import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { admin as adminPlugin } from "better-auth/plugins";
import { i18n } from "@better-auth/i18n";
import { ac, admin, user, myCustomRole, superadmin, merchant } from "@/lib/permissions";
import { nextCookies } from "better-auth/next-js";
import { buildBrandEmailHtml } from "@/lib/email-brand-template";
import { prisma } from "@/lib/prisma";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";
import { queueOAuthWelcomeEmail } from "@/lib/user-lifecycle-emails";
import { betterAuthFrMessages } from "@/lib/better-auth-i18n-fr";
import { getExpoTrustedOrigins } from "@/lib/better-auth-expo-trusted-origins";
import {
  DEFAULT_ADMIN_BAN_REASON,
  DEFAULT_MAX_PASSWORD_LENGTH,
  DEFAULT_MIN_PASSWORD_LENGTH,
  RESET_PASSWORD_TOKEN_EXPIRES_IN_SEC,
} from "@/lib/better-auth-shared-constants";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleOAuthEnabled = Boolean(googleClientId && googleClientSecret);

const facebookClientId = process.env.FACEBOOK_CLIENT_ID?.trim();
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
const facebookOAuthEnabled = Boolean(facebookClientId && facebookClientSecret);

const discordClientId = process.env.DISCORD_CLIENT_ID?.trim();
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
const discordOAuthEnabled = Boolean(discordClientId && discordClientSecret);

/** Doc Better Auth : URL de base pour les callbacks OAuth (évite redirect_uri_mismatch). */
const betterAuthBaseUrl = process.env.BETTER_AUTH_URL?.trim();

/** Fenêtre pour considérer un utilisateur comme « tout juste créé » après callback OAuth. */
const OAUTH_NEW_USER_MAX_AGE_MS = 5 * 60_000;

const OAUTH_PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  discord: "Discord",
};

const socialProviders = {
  ...(googleOAuthEnabled
    ? {
        google: {
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
          /** Doc Google Better Auth : forcer l’écran de choix de compte. */
          prompt: "select_account" as const,
        },
      }
    : {}),
  ...(facebookOAuthEnabled
    ? {
        facebook: {
          clientId: facebookClientId as string,
          clientSecret: facebookClientSecret as string,
        },
      }
    : {}),
  ...(discordOAuthEnabled
    ? {
        discord: {
          clientId: discordClientId as string,
          clientSecret: discordClientSecret as string,
        },
      }
    : {}),
};

/** Fournisseurs OAuth déclarés : utilisés pour `trustedProviders` (liaison si l’e-mail n’est pas marqué « vérifié » côté fournisseur). */
const oauthTrustedProviderIds = Object.keys(socialProviders);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(betterAuthBaseUrl ? { baseURL: betterAuthBaseUrl } : {}),
  /** Deep links Expo (`scheme://`) + motifs `exp://` en dev. Voir docs/expo-better-auth.md */
  trustedOrigins: getExpoTrustedOrigins(),
  ...(oauthTrustedProviderIds.length > 0
    ? {
        account: {
          accountLinking: {
            enabled: true,
            trustedProviders: oauthTrustedProviderIds,
          },
        },
      }
    : {}),
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path ?? "";
      if (!path.includes("/callback/")) return;
      const newSession = ctx.context.newSession as
        | { user?: { id?: string; email?: string | null; name?: string | null } }
        | undefined;
      const userId = newSession?.user?.id;
      if (!userId) return;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, email: true, name: true },
      });
      if (!dbUser?.email) return;

      const ageMs = Date.now() - dbUser.createdAt.getTime();
      if (ageMs < 0 || ageMs > OAUTH_NEW_USER_MAX_AGE_MS) return;

      const providerMatch = path.match(/(?:^|\/)callback\/([^/?]+)/);
      const providerId = providerMatch?.[1]?.toLowerCase() ?? "";
      const providerLabel =
        OAUTH_PROVIDER_LABELS[providerId] ?? (providerId ? providerId : "un fournisseur");

      queueOAuthWelcomeEmail({
        to: dbUser.email,
        displayName: dbUser.name?.trim() ?? "",
        providerLabel,
      });
    }),
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user: u, newEmail, url }) => {
        queueTransactionalEmail({
          to: u.email,
          subject: "Confirmez le changement d’adresse e-mail",
          text: `Bonjour,\n\nUne demande a été faite pour utiliser cette nouvelle adresse sur votre compte : ${newEmail}\n\nSi c’est bien vous, ouvrez ce lien depuis la boîte de l’adresse actuelle (${u.email}) :\n${url}\n\nSans confirmation, l’adresse ne sera pas modifiée.`,
          html: buildBrandEmailHtml({
            preheader: "Validez votre nouvelle adresse e-mail sur Balad'indice.",
            headline: "Changement d’adresse e-mail",
            blocks: [
              {
                type: "p",
                text: "Une demande a été faite pour associer une nouvelle adresse à votre compte Balad'indice.",
              },
              { type: "highlight", title: "Nouvelle adresse demandée", text: newEmail },
              { type: "highlight", title: "Adresse actuelle du compte", text: u.email },
              { type: "cta", label: "Confirmer le changement", href: url },
              {
                type: "p",
                text: "Sans confirmation depuis cette boîte, votre adresse ne sera pas modifiée.",
              },
            ],
          }),
        });
      },
    },
    additionalFields: {
      role: { type: "string", required: false },
      city: { type: "string", required: false },
      address: { type: "string", required: false },
      postalCode: { type: "string", required: false },
      country: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  },
  emailVerification: {
    /** Doc Better Auth : renvoyer le mail de vérif à chaque tentative de connexion si non vérifié. */
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user: u, url }) => {
      queueTransactionalEmail({
        to: u.email,
        subject: "Confirmez votre adresse e-mail",
        text: `Bonjour${u.name ? ` ${u.name}` : ""},\n\nPour activer votre compte, ouvrez ce lien :\n${url}\n\nLe lien expire après un délai limité. Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.`,
        html: buildBrandEmailHtml({
          preheader: "Activez votre compte Balad'indice.",
          headline: "Bienvenue — confirmez votre e-mail",
          blocks: [
            {
              type: "p",
              text: u.name?.trim() ? `Bonjour ${u.name.trim()},` : "Bonjour,",
            },
            {
              type: "p",
              text: "Pour activer votre compte et rejoindre les parcours, confirmez votre adresse e-mail.",
            },
            { type: "cta", label: "Confirmer mon adresse e-mail", href: url },
            {
              type: "p",
              text: "Le lien expire après un délai limité. Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.",
            },
          ],
        }),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
    onExistingUserSignUp: async ({ user: u }) => {
      queueTransactionalEmail({
        to: u.email,
        subject: "Tentative d’inscription sur Balad'indice",
        text: `Bonjour,\n\nUne tentative d’inscription a été effectuée avec votre adresse e-mail. Si c’était vous, connectez-vous ou utilisez « mot de passe oublié ». Sinon, vous pouvez ignorer ce message.`,
        html: buildBrandEmailHtml({
          preheader: "Cette adresse e-mail a déjà un compte.",
          headline: "Déjà inscrit ?",
          blocks: [
            {
              type: "p",
              text: "Une tentative d’inscription a été effectuée avec votre adresse e-mail.",
            },
            {
              type: "highlight",
              title: "Que faire ?",
              text: "Si c’était vous : connectez-vous, ou utilisez « mot de passe oublié » sur l’écran de connexion. Sinon, ignorez ce message.",
            },
          ],
        }),
      });
    },
    sendResetPassword: async ({ user, url }) => {
      queueTransactionalEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
        html: buildBrandEmailHtml({
          preheader: "Réinitialisez votre mot de passe Balad'indice.",
          headline: "Mot de passe oublié",
          blocks: [
            { type: "p", text: "Bonjour," },
            {
              type: "p",
              text: "Vous avez demandé un lien pour choisir un nouveau mot de passe. Utilisez le bouton ci-dessous — il est valable pour une durée limitée.",
            },
            { type: "cta", label: "Définir un nouveau mot de passe", href: url },
            {
              type: "p",
              text: "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message en toute sécurité.",
            },
          ],
        }),
      });
    },
    onPasswordReset: async () => {},
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: DEFAULT_MIN_PASSWORD_LENGTH,
    maxPasswordLength: DEFAULT_MAX_PASSWORD_LENGTH,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_TOKEN_EXPIRES_IN_SEC,
  },
  plugins: [
    expo(),
    adminPlugin({
      user: {
        additionalFields: {
          role: {
            type: "string",
            input: false,
          },
          city: {
            type: "string",
            input: false,
          },
        },
      },
      ac,
      roles: {
        admin,
        user,
        myCustomRole,
        superadmin,
        merchant,
      },
      adminRoles: ["admin", "superadmin"],
      defaultBanReason: DEFAULT_ADMIN_BAN_REASON,
      bannedUserMessage:
        "Votre compte a été suspendu sur Balad'indice. Contactez le support si vous pensez qu’il s’agit d’une erreur.",
      impersonationSessionDuration: 60 * 60 * 24,
    }),
    i18n({
      defaultLocale: "fr",
      translations: {
        fr: betterAuthFrMessages,
      },
      detection: ["header", "cookie"],
      localeCookie: "locale",
    }),
    nextCookies(),
  ],
});
