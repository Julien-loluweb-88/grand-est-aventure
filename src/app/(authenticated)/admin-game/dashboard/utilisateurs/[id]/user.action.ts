"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { durationToSeconds } from "@/utils/durationToSeconds";
import { dateToSeconds } from "@/utils/dateToSeconds";
import { revalidatePath } from "next/cache";

export async function getUserById(id: string) {
  const user = await auth.api.getUser({
    query: {
      id,
    },
    headers: await headers(),
  });

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
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
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
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
}

export async function roleUser(
  userId: string,
  role: "user" | "admin" | "superadmin" | "myCustomRole"
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
    revalidatePath("/admin-game/dashboard/utilisateurs");
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
      message: "Vous n'avez pas le droit de supprimer des utilisateurs.",
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
  if(!canDelete){
    return{
       success: false,
      message: "Vous n'avez pas le droit de supprimer des utilisateurs.",
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
      message: "L'utilisateur a été supprimé.",
    }; 
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur.",
    };
  }
}