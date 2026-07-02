import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { i18nClient } from "@better-auth/i18n/client"
import { ac, admin, user, myCustomRole, superadmin } from "@/lib/permissions"
import { getPublicAppOrigin } from "@/lib/public-app-url"

/** Origine publique (`NEXT_PUBLIC_APP_URL` ou legacy `NEXT_PUBLIC_BETTER_AUTH_URL`). */
export const authClient = createAuthClient({
    baseURL: getPublicAppOrigin(),
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
