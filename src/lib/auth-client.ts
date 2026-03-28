import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { i18nClient } from "@better-auth/i18n/client"
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions"

/** Même valeur que `BETTER_AUTH_URL` côté serveur ; requise côté navigateur (préfixe NEXT_PUBLIC_). */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "",
    plugins: [
        i18nClient(),
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
