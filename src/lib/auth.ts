import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins";
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST as string,
  port: parseInt(process.env.NODEMAILER_PORT as string, 10),
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: { type: "string", required: false },
      city: { type: "string", required: false },
      address: { type: "string", required: false },
      postalCode: { type: "string", required: false },
      country: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user: u, url }) => {
      await transporter.sendMail({
        from: process.env.NODEMAILER_USER,
        to: u.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
        html: `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, <a href="${url}">cliquez sur ce lien</a>.</p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>`,
      });
    },
    onPasswordReset: async () => {},
  },
  plugins: [
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
      defaultBanReason: "Spam!",
    }),
    nextCookies(),
  ],
});
