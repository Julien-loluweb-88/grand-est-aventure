"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

export type CreateEnigmaInput = {
  name: string;
  number: number;
  question: string;
  uniqueResponse: boolean;
  choice: Prisma.InputJsonValue;
  answer: string;
  answerMessage: string;
  description: Prisma.InputJsonValue;
  latitude: number;
  longitude: number;
  adventureId: string;
}
export async function createEnigma(
  form: CreateEnigmaInput
): Promise<{ success: true; id: string; message: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }
  // Vérifier si l'aventure existe
  const adventure = await prisma.adventure.findUnique({
    where: { id: form.adventureId },
  });
  if (!adventure) {
    return { success: false, error: "Aventure non trouvée." };
  }

  try {
    const result = await prisma.enigma.create({
      data: {
        name: form.name,
        number: form.number,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        answer: form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        adventureId: form.adventureId,
      },
    });
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Enigme créée avec succès." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}

export async function updateEnigma(
  id: string,
  form: CreateEnigmaInput
): Promise<{ success: true; id: string; message: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  try {
    const result = await prisma.enigma.update({
      where: { id },
      data: {
        name: form.name,
        number: form.number,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        answer: form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        adventureId: form.adventureId,
      },
    });
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Enigme modifie avec succès." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}

export type EnigmaListItem = {
  id: string;
  name: string;
  number: number;
  question: string;
  uniqueResponse: boolean;
  choices: string[];
  answer: string;
  answerMessage: string;
  description: string;
  latitude: number;
  longitude: number;
  adventureId: string;
}

export async function listEnigmaForAdmin(params: {
  page: number;
  pageSize: number;
  search: string;
  adventureId: string;
}): Promise<
  { ok: true; enigma: EnigmaListItem[]; total: number } | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  const where =
    q.length > 0
      ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { question: { contains: q, mode: "insensitive" as const } },
          ...(Number.isInteger(Number(q)) ? [{ number: { equals: Number(q) } }] : []),
        ],
      }
      : { adventureId: params.adventureId };

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
        orderBy: { name: "asc" },
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
          description: typeof u.description === "string" ? u.description : "",
          latitude: u.latitude,
          longitude: u.longitude,
          adventureId: u.adventureId,
      })),
      total,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du chargement des aventures.",
    };
  }
}