"use server";

import { revalidatePath } from "next/cache";
import { bridgeCreateUser } from "@/lib/better-auth-admin-bridge";
import { requireRoutePermission } from "../[id]/_lib/user-admin-guard";

export async function createUserAsAdmin(input: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "myCustomRole";
}): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  try {
    await requireRoutePermission("user", "create");
  } catch {
    return { ok: false, message: "Non autorisé." };
  }

  try {
    const res = await bridgeCreateUser({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
      data: { emailVerified: true },
    });
    const userId = res?.user?.id;
    if (!userId) {
      return { ok: false, message: "Utilisateur créé mais identifiant manquant." };
    }
    revalidatePath("/admin-game/dashboard/utilisateurs");
    return { ok: true, userId };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Impossible de créer l’utilisateur.",
    };
  }
}
