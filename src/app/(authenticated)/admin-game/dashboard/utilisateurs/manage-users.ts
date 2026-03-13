
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAllUsers() {
    const users = await auth.api.listUsers({
        query: {},
        // This endpoint requires session cookies.
        headers: await headers(),
    });
    console.log("tous les utilisateurs", users)
    return users
}


