import { NextRequest, NextResponse } from "next/server";
import { roleHasRoutePermission } from "@/lib/permissions";

async function getSessionFromAuthApi(request: NextRequest) {
  const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!sessionResponse.ok) {
    return null;
  }

  return sessionResponse.json();
}

export default async function proxy(request: NextRequest) {
  const session = await getSessionFromAuthApi(request);
  const role = session?.user?.role;
  const pathname = request.nextUrl.pathname;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!["admin", "superadmin"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/admin-game", request.url));
  }

  // Adventure management routes
  if (pathname.startsWith("/admin-game/dashboard/aventures/create")) {
    if (!roleHasRoutePermission(role, "adventure", "create")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin-game/dashboard/aventures")) {
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Superadmin: adventure creation requests inbox
  if (pathname.startsWith("/admin-game/dashboard/demandes-aventures")) {
    if (role !== "superadmin") {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Superadmin: audit log
  if (pathname.startsWith("/admin-game/dashboard/journal-admin")) {
    if (role !== "superadmin") {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // User management routes
  if (pathname.startsWith("/admin-game/dashboard/utilisateurs")) {
    if (!roleHasRoutePermission(role, "user", "get")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Tableau de bord, page d’erreur, etc. : uniquement ces chemins hors préfixes ci‑dessus
  const dashboardRoot = "/admin-game/dashboard";
  const isDashboardHome =
    pathname === dashboardRoot || pathname === `${dashboardRoot}/`;
  const isAccesRefuse = pathname.startsWith(`${dashboardRoot}/acces-refuse`);
  if (isDashboardHome || isAccesRefuse) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
}

export const config = {
  matcher: ["/admin-game/dashboard/:path*"],
};
