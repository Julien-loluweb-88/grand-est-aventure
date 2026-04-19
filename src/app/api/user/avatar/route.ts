import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PATCH_PER_WINDOW = 20;

/** Préférence avatar du joueur + détail si renseigné. */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      selectedAvatarId: true,
      selectedAvatar: {
        select: {
          id: true,
          slug: true,
          name: true,
          thumbnailUrl: true,
          modelUrl: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    selectedAvatarId: user.selectedAvatarId,
    selectedAvatar: user.selectedAvatar,
  });
}

/**
 * Corps JSON : `{ "selectedAvatarId": "…" }` ou `{ "selectedAvatarId": null }` pour effacer le choix.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(
    `user-avatar:${ip}:${session.user.id}`,
    MAX_PATCH_PER_WINDOW,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).selectedAvatarId;
  if (!("selectedAvatarId" in (body as Record<string, unknown>))) {
    return NextResponse.json({ error: "selectedAvatarId requis (ou null)." }, { status: 400 });
  }
  if (raw !== null && typeof raw !== "string") {
    return NextResponse.json({ error: "selectedAvatarId doit être une chaîne ou null." }, { status: 400 });
  }

  const selectedAvatarId = raw === null ? null : raw.trim();
  if (selectedAvatarId === "") {
    return NextResponse.json({ error: "selectedAvatarId vide : utilisez null pour effacer." }, { status: 400 });
  }

  if (selectedAvatarId !== null) {
    const avatar = await prisma.avatar.findFirst({
      where: { id: selectedAvatarId, isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        thumbnailUrl: true,
        modelUrl: true,
        sortOrder: true,
      },
    });
    if (!avatar) {
      return NextResponse.json({ error: "Avatar introuvable ou inactif." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedAvatarId: avatar.id },
    });

    return NextResponse.json({
      ok: true as const,
      selectedAvatarId: avatar.id,
      selectedAvatar: avatar,
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { selectedAvatarId: null },
  });

  return NextResponse.json({
    ok: true as const,
    selectedAvatarId: null,
    selectedAvatar: null,
  });
}
