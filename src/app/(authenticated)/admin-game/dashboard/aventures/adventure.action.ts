"use server"

import { prisma } from "@/lib/prisma"
import { getUser

 } from "@/lib/auth/auth-user"
export async function createAdventure(form) {
console.log("create user data",form)
const user = await getUser()
if (!user) {
    return
}

const result = await prisma.adventure.create({
    data: {
        name: form.name as string,
        description: form.description as string,
        city: form.city as string,
        latitude: parseFloat(form.latitude) as number,
        longitude: parseFloat(form.longitude) as number,
        distance: parseFloat(form.distance) as number,
        creatorId: user.id
    }
})
console.log("result",result)
}