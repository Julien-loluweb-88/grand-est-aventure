import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { readFileSync } from "fs";

const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

const SIGNATURE_PNG_PATH = path.join(
  process.cwd(),
  "public",
  "signature-baladindices.png"
);

let SIGNATURE_PNG_CACHE: Buffer | null = null;
function getSignaturePng(): Buffer | null {
  if (SIGNATURE_PNG_CACHE) return SIGNATURE_PNG_CACHE;
  try {
    SIGNATURE_PNG_CACHE = readFileSync(SIGNATURE_PNG_PATH);
    return SIGNATURE_PNG_CACHE;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const img = request.nextUrl.searchParams.get("img")?.trim();

  if (token) {
    try {
      const recipient = await prisma.emailCampaignRecipient.findUnique({
        where: { trackingToken: token },
        select: { id: true, prospectId: true, openedAt: true },
      });
      if (recipient) {
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            openCount: { increment: 1 },
            openedAt: recipient.openedAt ?? new Date(),
          },
        });
        if (recipient.prospectId) {
          await prisma.prospect.update({
            where: { id: recipient.prospectId },
            data: { lastOpenedAt: new Date() },
          });
        }
      }
    } catch {
      // Ne jamais casser le pixel en prod : réponse 200 quoi qu'il arrive.
    }
  }

  if (img === "signature") {
    const signaturePng = getSignaturePng();
    if (signaturePng) {
      return new NextResponse(signaturePng, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }
    // Fallback : si l'image signature est introuvable, on renvoie le pixel.
  }

  return new NextResponse(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
