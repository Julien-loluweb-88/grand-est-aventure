import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
export async function POST(request: NextRequest) {
    const { adventureId, userId, success, giftNumber } = await request.json()
    console.log(adventureId, userId, success, giftNumber)
    const userAdventure = await prisma.userAdventures.findFirst({
        where: {
            adventureId,
            userId,
        },
    })

    if (userAdventure) {
        await prisma.userAdventures.update({
            where: { id: userAdventure.id },
            data: { success, giftNumber },
        })
    } else {
        await prisma.userAdventures.create({
            data: { adventureId, userId, success, giftNumber },
        })
    }




    return NextResponse.json({ message: "Aventure terminée avec succès" })
}