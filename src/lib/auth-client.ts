import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { ac, admin, user, myCustomRole } from "@/lib/permissions"

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: process.env.BETTER_AUTH_URL

})

export const { signIn, signUp, useSession } = authClient

export const client = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: {
                admin,
                user,
                myCustomRole
            }
        })
    ]
})
