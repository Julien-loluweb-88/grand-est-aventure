import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "superadmin"];

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname === "/admin") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session) {
            return NextResponse.redirect(new URL("/admin-game/dashboard", request.url));
        }
    }

    if (pathname.startsWith("/admin-game/dashboard")) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
            return NextResponse.redirect(new URL("/admin-game", request.url));
        }
        const role = session.user?.role;
        if (!role || !ADMIN_ROLES.includes(role)) {
            return NextResponse.redirect(new URL("/admin-game", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin-game/:path*"],
};