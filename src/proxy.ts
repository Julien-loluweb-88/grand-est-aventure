import { NextRequest, NextResponse } from "next/server";
import { roleHasRoutePermission } from "@/lib/permissions";

/**
 * Origine pour les fetch serveur→serveur (middleware → routes API).
 * En prod derrière un reverse proxy, `request.nextUrl.origin` peut être incohérent (TLS) ;
 * définir `INTERNAL_APP_ORIGIN` (ex. `http://127.0.0.1:3000`) pour pointer vers l’écoute HTTP locale de Next.
 */
function getInternalFetchOrigin(request: NextRequest): string {
  const raw = process.env.INTERNAL_APP_ORIGIN?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return request.nextUrl.origin;
}

async function getSessionFromAuthApi(request: NextRequest, internalOrigin: string) {
  const sessionResponse = await fetch(`${internalOrigin}/api/auth/get-session`, {
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
  const internalOrigin = getInternalFetchOrigin(request);
  const session = await getSessionFromAuthApi(request, internalOrigin);
  const pathname = request.nextUrl.pathname;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const permCtxRes = await fetch(
    `${internalOrigin}/api/admin-game/permission-context`,
    {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    }
  );
  if (!permCtxRes.ok) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  const permCtx = (await permCtxRes.json()) as { role?: string };
  const role = permCtx.role;

  if (!role || !["admin", "superadmin", "merchant"].includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const dashboardRoot = "/admin-game/dashboard";
  const isDashboardHome =
    pathname === dashboardRoot || pathname === `${dashboardRoot}/`;
  const isAccesRefuse = pathname.startsWith(`${dashboardRoot}/acces-refuse`);
  const isParametres = pathname.startsWith(`${dashboardRoot}/parametres`);
  const isCommercant = pathname.startsWith(`${dashboardRoot}/commercant`);

  if (role === "merchant") {
    if (isDashboardHome || isAccesRefuse || isParametres || isCommercant) {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL("/admin-game/dashboard/commercant", request.url)
    );
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

  // Référentiel villes (CRUD côté action = `adventure.update`, liste = `adventure.read`)
  if (pathname.startsWith("/admin-game/dashboard/villes")) {
    if (pathname.startsWith("/admin-game/dashboard/villes/create")) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (/^\/admin-game\/dashboard\/villes\/[^/]+$/.test(pathname)) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Publicités (liste / stats = adventure.read, CRUD = adventure.update)
  if (pathname.startsWith("/admin-game/dashboard/publicites")) {
    if (pathname.startsWith("/admin-game/dashboard/publicites/create")) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (/^\/admin-game\/dashboard\/publicites\/[^/]+$/.test(pathname)) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Badges globaux / paliers (liste = adventure.read, CRUD = adventure.update)
  if (pathname.startsWith("/admin-game/dashboard/badges-globaux")) {
    if (pathname.startsWith("/admin-game/dashboard/badges-globaux/create")) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (/^\/admin-game\/dashboard\/badges-globaux\/[^/]+$/.test(pathname)) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Avatars compagnons (liste = adventure.read, création / édition = adventure.update)
  if (pathname.startsWith("/admin-game/dashboard/avatars")) {
    if (pathname.startsWith("/admin-game/dashboard/avatars/create")) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (/^\/admin-game\/dashboard\/avatars\/[^/]+$/.test(pathname)) {
      if (!roleHasRoutePermission(role, "adventure", "update")) {
        return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
      }
      return NextResponse.next();
    }
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }

  // Superadmin : boîte de réception des demandes admin (tous types)
  if (pathname.startsWith("/admin-game/dashboard/demandes")) {
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
  const isApiDocs = pathname.startsWith(`${dashboardRoot}/docs`);
  if (isApiDocs) {
    if (!roleHasRoutePermission(role, "adventure", "read")) {
      return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
    }
    return NextResponse.next();
  }
  if (isDashboardHome || isAccesRefuse || isParametres || isCommercant) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin-game/dashboard/acces-refuse", request.url));
}

export const config = {
  matcher: ["/admin-game/dashboard/:path*"],
};
