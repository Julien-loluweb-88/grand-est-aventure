import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logProspectUnsubscribed } from "@/lib/prospect-events";
import { getPublicAppOrigin } from "@/lib/public-app-url";

function redirectTo(request: NextRequest, path: string): NextResponse {
  const origin = getPublicAppOrigin() || request.nextUrl.origin;
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return redirectTo(request, "/desinscription?status=invalid");

  const prospect = await prisma.prospect.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, status: true },
  });
  if (!prospect) return redirectTo(request, "/desinscription?status=invalid");

  if (prospect.status === "UNSUBSCRIBED") {
    return redirectTo(request, "/desinscription?status=already");
  }

  await prisma.prospect.update({
    where: { id: prospect.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      nextFollowUpAt: null,
    },
  });

  await logProspectUnsubscribed(prospect.id);

  await prisma.emailCampaignRecipient.updateMany({
    where: {
      prospectId: prospect.id,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
      error: "Destinataire désinscrit.",
    },
  });

  return redirectTo(request, "/desinscription?status=ok");
}
