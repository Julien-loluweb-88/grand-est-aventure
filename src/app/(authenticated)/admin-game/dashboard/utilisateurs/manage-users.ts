
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAllUsers() {
    const users = await auth.api.listUsers({
        query: {
            searchValue: "some name",
            searchField: "name",
            searchOperator: "contains",
            limit: 100,
            offset: 100,
            sortBy: "name",
            sortDirection: "desc",
            filterField: "email",
            filterValue: "hello@example.com",
            filterOperator: "eq",
        },
        // This endpoint requires session cookies.
        headers: await headers(),
    });
    console.log("tous les utilisateurs", users)
    return users
}


