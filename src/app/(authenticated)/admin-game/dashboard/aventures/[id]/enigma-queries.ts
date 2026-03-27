import "server-only";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import type { EnigmaOrderRow } from "./enigma-order-types";

export type { EnigmaOrderRow } from "./enigma-order-types";

export type EnigmaListItem = {
  id: string;
  name: string;
  number: number;
  question: string;
  uniqueResponse: boolean;
  choices: string[];
  answer: string;
  answerMessage: unknown;
  description: unknown;
  latitude: number;
  longitude: number;
  adventureId: string;
};

export async function listEnigmaForAdmin(params: {
  page: number;
  pageSize: number;
  search: string;
  adventureId: string;
}): Promise<
  | { ok: true; enigma: EnigmaListItem[]; total: number }
  | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return { ok: false, error: "Non autorisé." };
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId: params.adventureId,
    }))
  ) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  const where = {
    adventureId: params.adventureId,
    ...(q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { question: { contains: q, mode: "insensitive" as const } },
            ...(Number.isInteger(Number(q))
              ? [{ number: { equals: Number(q) } }]
              : []),
          ],
        }
      : {}),
  };

  try {
    const [enigma, total] = await Promise.all([
      prisma.enigma.findMany({
        where,
        select: {
          id: true,
          name: true,
          number: true,
          question: true,
          uniqueResponse: true,
          choice: true,
          answer: true,
          answerMessage: true,
          description: true,
          latitude: true,
          longitude: true,
          adventureId: true,
        },
        orderBy: [{ number: "asc" }, { name: "asc" }],
        skip,
        take: params.pageSize,
      }),
      prisma.enigma.count({ where }),
    ]);

    return {
      ok: true,
      enigma: enigma.map((u) => ({
        id: u.id,
        name: u.name,
        number: u.number,
        question: u.question,
        uniqueResponse: u.uniqueResponse,
        choices: Array.isArray(u.choice)
          ? u.choice.filter((c): c is string => typeof c === "string")
          : [],
        answer: u.answer ?? "",
        answerMessage: u.answerMessage,
        description: u.description,
        latitude: u.latitude,
        longitude: u.longitude,
        adventureId: u.adventureId,
      })),
      total,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Erreur lors du chargement des aventures.",
    };
  }
}

/** Toutes les énigmes d’une aventure, triées par numéro (réordonnancement admin). */
export async function listEnigmaOrderForAdmin(
  adventureId: string
): Promise<
  | { ok: true; rows: EnigmaOrderRow[] }
  | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return { ok: false, error: "Non autorisé." };
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId,
    }))
  ) {
    return { ok: false, error: "Non autorisé." };
  }

  try {
    const rows = await prisma.enigma.findMany({
      where: { adventureId },
      select: { id: true, name: true, number: true },
      orderBy: [{ number: "asc" }, { name: "asc" }],
    });
    return { ok: true, rows };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Erreur lors du chargement des énigmes.",
    };
  }
}
