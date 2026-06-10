import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { userImagePatchSchema } from "@/lib/dicebear-avatar-url";

const WINDOW_MS = 60_000;
const MAX_PATCH_PER_WINDOW = 20;

const selectedAvatarSelect = {
  id: true,
  slug: true,
  name: true,
  thumbnailUrl: true,
  modelUrl: true,
  sortOrder: true,
} as const;

const userAvatarPatchSchema = z
  .object({
    selectedAvatarId: z.union([z.string(), z.null()]).optional(),
    image: userImagePatchSchema.optional(),
  })
  .strict()
  .refine((value) => "selectedAvatarId" in value || "image" in value, {
    message: "Au moins image ou selectedAvatarId est requis.",
  });

/** Préférences avatar : photo profil DiceBear (`User.image`) + compagnon 3D. */
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
      image: true,
      selectedAvatarId: true,
      selectedAvatar: { select: selectedAvatarSelect },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    image: user.image,
    selectedAvatarId: user.selectedAvatarId,
    selectedAvatar: user.selectedAvatar,
  });
}

/**
 * Corps JSON partiel :
 * - `image` : URL DiceBear complète (`User.image`) ou `null` pour effacer ;
 * - `selectedAvatarId` : id compagnon 3D actif ou `null`.
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

  const parsed = userAvatarPatchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Corps invalide." },
      { status: 400 }
    );
  }

  const data: { image?: string | null; selectedAvatarId?: string | null } = {};

  if ("image" in parsed.data) {
    data.image = parsed.data.image ?? null;
  }

  if ("selectedAvatarId" in parsed.data) {
    const raw = parsed.data.selectedAvatarId;
    if (raw === null) {
      data.selectedAvatarId = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed === "") {
        return NextResponse.json(
          { error: "selectedAvatarId vide : utilisez null pour effacer." },
          { status: 400 }
        );
      }

      const avatar = await prisma.avatar.findFirst({
        where: { id: trimmed, isActive: true },
        select: selectedAvatarSelect,
      });
      if (!avatar) {
        return NextResponse.json({ error: "Avatar introuvable ou inactif." }, { status: 404 });
      }
      data.selectedAvatarId = avatar.id;
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      image: true,
      selectedAvatarId: true,
      selectedAvatar: { select: selectedAvatarSelect },
    },
  });

  return NextResponse.json({
    ok: true as const,
    image: user.image,
    selectedAvatarId: user.selectedAvatarId,
    selectedAvatar: user.selectedAvatar,
  });
}
