import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins"
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions"
import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/client"
import { nextCookies } from "better-auth/next-js";
// If your Prisma file is located elsewhere, you can change the path
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST as string,
  port: parseInt(process.env.NODEMAILER_PORT as string),
  secure: false, // Use true for port 465, false for port 587
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
    sendResetPassword: async ({ user, url, token }, request) => {
      console.log(user, url, token, request);
      console.log(`Le mail de réinitialisation de mot de passe a été envoyé à ${user.email}`);
      await transporter.sendMail({
        from: process.env.NODEMAILER_USER,
        to: user.email,
        subject: "Mot de passe oublier",
        text: "Clicker sur ce lien pour changer de mot de passe : ${url}",
        html: `<b>Clicker sur ce lien pour changer de mot de passe : ${url}</b>`,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Le mot de passe de l'utilisateur ${user.email} a été réinitialisé`);
    },

  },
  plugins: [
    adminPlugin({
      user: {
        additionalFields: {
          role: {
            type: "string",
            input: false
          },
          city: {
            type: "string",
            input: false
          }
        }
      },
      ac,
      roles: {
        admin,
        user,
        myCustomRole,
        superadmin
      },
      adminRoles: ["admin", "superadmin"],
      defaultBanReason: "Spam!"
    }),
    nextCookies()
  ]
});

export const authClient = createAuthClient({
  plugins: [
    adminClient()
  ]
})
