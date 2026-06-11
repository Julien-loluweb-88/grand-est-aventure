import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { token, platform } = body;

  if (!token || !platform) {
    return NextResponse.json(
      { error: "token et platform requis" },
      { status: 400 }
    );
  }

  if (!["android", "ios"].includes(platform)) {
    return NextResponse.json(
      { error: "platform doit être 'android' ou 'ios'" },
      { status: 400 }
    );
  }

  await prisma.pushToken.upsert({
    where: {
      userId_token: {
        userId: session.user.id,
        token,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      token,
      platform,
    },
  });

  return new NextResponse(null, { status: 204 });
}