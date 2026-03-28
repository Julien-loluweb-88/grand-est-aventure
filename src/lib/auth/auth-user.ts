import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "@/lib/prisma";

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const getUser = async () => {
  const session = await getSession();
  return session?.user;
};

export const isAdmin = async () => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    redirect("/admin-game");
  }

  const impersonatedBy =
    session.session &&
    typeof session.session === "object" &&
    "impersonatedBy" in session.session
      ? (session.session as { impersonatedBy?: string | null }).impersonatedBy
      : undefined;

  if (impersonatedBy) {
    const actor = await prisma.user.findUnique({
      where: { id: impersonatedBy },
      select: { role: true },
    });
    if (actor?.role && ["admin", "superadmin"].includes(actor.role)) {
      return true;
    }
    redirect("/admin-game");
  }

  if (!["admin", "superadmin"].includes(user.role ?? "")) {
    redirect("/admin-game");
  }
  return true;
};