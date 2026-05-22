import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listUserBadgeCatalog } from "@/lib/badges/list-user-badge-catalog";
import { getUserRoleForAccess } from "@/lib/adventure-public-access";

/** Catalogue badges + état acquis pour le joueur connecté. */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = await getUserRoleForAccess(session.user.id);
  const catalog = await listUserBadgeCatalog({
    userId: session.user.id,
    role,
  });

  return NextResponse.json(catalog);
}
