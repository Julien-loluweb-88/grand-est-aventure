"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { durationToSeconds } from "@/utils/durationToSeconds";
import { dateToSeconds } from "@/utils/dateToSeconds";
import { revalidatePath } from "next/cache";
import { ac } from "@/lib/permissions";
import { success } from "better-auth";

export async function getUserById(id: string) {
  const user = await auth.api.getUser({
    query: {
      id,
    },
    headers: await headers(),
  });

  console.log("user", user);
  return user
}

export async function updateUser(data: {
  id: string
  name?: string
  address?: string
  postalCode?: string
  city?: string
  country?: string
  phone?: string
}) {
  console.log("data", data);
  // Exemple si tu utilises Better Auth côté API
  const result = await auth.api.adminUpdateUser({
    body: {
      userId: data.id,
      data: {
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        phone: data.phone,
      }

    },
    headers: await headers(),
  })

  console.log("result", result)
  return result
}

export async function banUser(
  userId: string,
  motif: string,
  duration: string,
  customEndDate?: string
) {
  const banExpiresIn =
    duration === "other" && customEndDate
      ? dateToSeconds(customEndDate)
      : durationToSeconds(duration);
  await auth.api.banUser({
    body: {
      userId,
      banReason: motif,
      ...(banExpiresIn && { banExpiresIn }),
    },
    headers: await headers(),
  });
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`)
}
export async function unBanUser(
  userId: string,
) {

  await auth.api.unbanUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`)
}

export async function roleUser(
  userId: string,
  role: "user" | "admin" | "superadmin"
) {
  try {
    await auth.api.setRole({
      body: {
        userId,
        role,
      },
      headers: await headers(),
    });
    revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
    return {
      success: true,
      message: "Rôle mis à jour",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du rôle",
    };
  }
}

export async function removeUser(userId: string) {
  const session = await auth.api.getSession({headers: await headers() });
  const currentUser = session?.user;
  if(!currentUser){
    return {
      success: false,
      message: "Vous n'avez pas le droit de supprimer des utilisaterus !",
    };
  }
  const { success: canDelete } = await auth.api.userHasPermission({
    body: {
      userId: currentUser.id,
      permissions: {
        user: ["delete"],
      },
    },
  });
  console.log("canDelete:", canDelete);
  if(!canDelete){
    return{
       success: false,
      message: "Vous n'avez pas le droit de supprimer des utilisaterus !",
    }
  }
  try{
 await auth.api.removeUser({
    body: {
      userId
    },
    headers: await headers(),
  });
  revalidatePath(`/admin-game/dashboard/utilisateurs`);
  return {
      success: true,
      message: "L&apos;utilisateur a été suprrimé",
    }; 
  } catch (error) {
    console.log("removeUser error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de suprrimer l&apos;utilisateur",
    };
  }
}