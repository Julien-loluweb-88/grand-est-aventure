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
        data:{
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

    console.log("result",result)
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
