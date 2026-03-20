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
  host: "ssl0.ovh.net",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
      const info = await transporter.sendMail({
        from: `Grand-est aventure" <${process.env.EMAIL_USER}>`,
        to: `${user.email}`,
        subject: "Mot de pass oblier",
        text: "Veuillez définir un nouveau mot de passe.",
        html: "<b>Veuillez définir un nouveau mot de passe.</b>",
      });
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Le mot de passe de l'utilisateur ${user.email} a été réinitialisé`);
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
        adminUserIds: ["user_id_1", "user_id_2"],
        defaultBanReason: "Spam!"
      }),
      nextCookies()
    ]
  }
});

export const authClient = createAuthClient({
  plugins: [
    adminClient()
  ]
})
