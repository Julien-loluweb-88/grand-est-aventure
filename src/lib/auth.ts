import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { admin as adminPlugin } from "better-auth/plugins";
import { i18n } from "@better-auth/i18n";
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";
import { betterAuthFrMessages } from "@/lib/better-auth-i18n-fr";
import { getExpoTrustedOrigins } from "@/lib/better-auth-expo-trusted-origins";
import {
  DEFAULT_ADMIN_BAN_REASON,
  DEFAULT_MAX_PASSWORD_LENGTH,
  DEFAULT_MIN_PASSWORD_LENGTH,
  RESET_PASSWORD_TOKEN_EXPIRES_IN_SEC,
} from "@/lib/better-auth-shared-constants";

function escapeHtmlForEmail(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(betterAuthBaseUrl ? { baseURL: betterAuthBaseUrl } : {}),
  /** Deep links Expo (`scheme://`) + motifs `exp://` en dev. Voir docs/expo-better-auth.md */
  trustedOrigins: getExpoTrustedOrigins(),
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user: u, newEmail, url }) => {
        const safeNew = escapeHtmlForEmail(newEmail);
        queueTransactionalEmail({
          to: u.email,
          subject: "Confirmez le changement d’adresse e-mail",
          text: `Bonjour,\n\nUne demande a été faite pour utiliser cette nouvelle adresse sur votre compte : ${newEmail}\n\nSi c’est bien vous, ouvrez ce lien depuis la boîte de l’adresse actuelle (${u.email}) :\n${url}\n\nSans confirmation, l’adresse ne sera pas modifiée.`,
          html: `<p>Bonjour,</p><p>Une demande a été faite pour utiliser cette nouvelle adresse : <strong>${safeNew}</strong>.</p><p>Si c’est bien vous, <a href="${url}">confirmez le changement</a> (e-mail actuel : ${escapeHtmlForEmail(u.email)}).</p><p>Sans action de votre part, l’adresse ne sera pas modifiée.</p>`,
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
        html: `<p>Bonjour${u.name ? ` ${escapeHtmlForEmail(u.name)}` : ""},</p><p>Pour activer votre compte, <a href="${url}">confirmez votre adresse e-mail</a>.</p><p>Le lien expire après un délai limité. Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.</p>`,
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
        html: `<p>Bonjour,</p><p>Une tentative d’inscription a été effectuée avec votre adresse e-mail. Si c’était vous, connectez-vous ou utilisez la réinitialisation du mot de passe. Sinon, vous pouvez ignorer ce message.</p>`,
      });
    },
    sendResetPassword: async ({ user: u, url }) => {
      queueTransactionalEmail({
        to: u.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
        html: `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, <a href="${url}">cliquez sur ce lien</a>.</p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>`,
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
