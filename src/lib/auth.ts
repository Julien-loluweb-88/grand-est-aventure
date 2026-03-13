import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins"
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions"
import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/client"
import { nextCookies } from "better-auth/next-js";
// If your Prisma file is located elsewhere, you can change the path
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        adminPlugin({
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
});

export const authClient = createAuthClient({
    plugins: [
        adminClient()
    ]
})