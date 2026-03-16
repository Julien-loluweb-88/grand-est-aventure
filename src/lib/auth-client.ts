import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions"

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        adminClient({
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
        }),
    ],
})

export const { signIn, signUp, useSession } = authClient
