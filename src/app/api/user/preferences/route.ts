import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  mergeUserAppPreferences,
  resolveUserAppPreferences,
  userAppPreferencesPatchSchema,
} from "@/lib/user-app-preferences";

const WINDOW_MS = 60_000;
const MAX_PATCH_PER_WINDOW = 30;

/** Préférences app du joueur (thème, carte, sons, accessibilité). */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { appPreferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    preferences: resolveUserAppPreferences(user.appPreferences),
  });
}

/**
 * Corps JSON partiel : une ou plusieurs clés parmi `theme`, `accentHue`, `locale`, etc.
 * `accentHue` : entier 0–360 (échelle app : 0 = jaune, 60 = rouge, …).
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
    `user-preferences:${ip}:${session.user.id}`,
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

  const parsed = userAppPreferencesPatchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Corps invalide." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { appPreferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const current = resolveUserAppPreferences(user.appPreferences);
  const preferences = mergeUserAppPreferences(current, parsed.data);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { appPreferences: preferences },
  });

  return NextResponse.json({
    ok: true as const,
    preferences,
  });
}
