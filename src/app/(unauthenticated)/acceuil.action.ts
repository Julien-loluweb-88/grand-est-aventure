"use server"

import { prisma } from "@/lib/prisma";

export async function getFiveStarReviews (rating: number ) {
    return await prisma.adventureReview.findMany({
        where: { rating },
            include: {
            user: true,
            },
        orderBy: {
            createdAt: "desc"
        }
    })
}