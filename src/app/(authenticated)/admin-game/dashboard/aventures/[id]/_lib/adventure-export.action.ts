"use server";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";
import { tiptapStoredValueToPlainText } from "@/lib/adventure-description-tiptap";
import { formatDurationFr } from "@/lib/format-duration-fr";
import {
  ADVENTURE_EXPORT_OPTIONAL_SECTIONS,
  type AdventureExportOptionalSection,
  type AdventureExportPayload,
} from "./adventure-export.types";

function normalizeSections(
  sections: AdventureExportOptionalSection[]
): Set<AdventureExportOptionalSection> {
  const allowed = new Set<AdventureExportOptionalSection>(
    ADVENTURE_EXPORT_OPTIONAL_SECTIONS
  );
  return new Set(sections.filter((s) => allowed.has(s)));
}

export async function getAdventureExportPayload(
  adventureId: string,
  sections: AdventureExportOptionalSection[]
): Promise<
  | { success: true; payload: AdventureExportPayload }
  | { success: false; error: string }
> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const selected = normalizeSections(sections);

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      distance: true,
      estimatedPlayDurationSeconds: true,
      averagePlayDurationSeconds: true,
      audience: true,
      status: true,
      coverImageUrl: true,
      cityId: true,
      city: { select: { name: true } },
      _count: { select: { enigmas: true } },
      treasure: { select: { id: true } },
    },
  });

  if (!adventure) {
    return { success: false, error: "Aventure introuvable." };
  }

  const payload: AdventureExportPayload = {
    exportedAt: new Date().toISOString(),
    adventure: {
      id: adventure.id,
      name: adventure.name,
      cityName: adventure.city.name,
      description: tiptapStoredValueToPlainText(adventure.description),
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      distanceKm: adventure.distance ?? null,
      estimatedDurationLabel: formatDurationFr(
        adventure.estimatedPlayDurationSeconds
      ),
      averageDurationLabel: formatDurationFr(
        adventure.averagePlayDurationSeconds
      ),
      audience: adventure.audience,
      status: adventure.status !== false,
      coverImageUrl: adventure.coverImageUrl,
      enigmaCount: adventure._count.enigmas,
      hasTreasure: Boolean(adventure.treasure),
    },
  };

  if (selected.has("enigmas")) {
    const enigmas = await prisma.enigma.findMany({
      where: { adventureId },
      orderBy: { number: "asc" },
      select: {
        number: true,
        name: true,
        question: true,
        description: true,
        answer: true,
        latitude: true,
        longitude: true,
      },
    });
    payload.enigmas = enigmas.map((e) => ({
      number: e.number,
      name: e.name,
      question: e.question,
      description: tiptapStoredValueToPlainText(e.description),
      answer: e.answer,
      latitude: e.latitude,
      longitude: e.longitude,
    }));
  }

  if (selected.has("treasure")) {
    const treasure = await prisma.treasure.findUnique({
      where: { adventureId },
      select: {
        name: true,
        description: true,
        finishMessage: true,
        latitude: true,
        longitude: true,
        chestCode: true,
        chestCodeAlt: true,
      },
    });
    payload.treasure = treasure
      ? {
          name: treasure.name,
          description: tiptapStoredValueToPlainText(treasure.description),
          finishMessage: tiptapStoredValueToPlainText(treasure.finishMessage),
          latitude: treasure.latitude,
          longitude: treasure.longitude,
          chestCode: treasure.chestCode,
          chestCodeAlt: treasure.chestCodeAlt,
        }
      : null;
  }

  if (selected.has("reviews")) {
    const reviews = await prisma.adventureReview.findMany({
      where: {
        adventureId,
        moderationStatus: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        rating: true,
        content: true,
        createdAt: true,
        consentCommunicationNetworks: true,
        user: { select: { name: true } },
      },
    });
    payload.reviews = reviews.map((r) => ({
      authorName: r.user.name?.trim() || "Anonyme",
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      consentCommunicationNetworks: r.consentCommunicationNetworks,
    }));
  }

  if (selected.has("discoveryPoints")) {
    const points = await prisma.discoveryPoint.findMany({
      where: { adventureId },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        title: true,
        teaser: true,
        latitude: true,
        longitude: true,
      },
    });
    payload.discoveryPoints = points.map((p) => ({
      title: p.title,
      teaser: p.teaser,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
  }

  if (selected.has("partnerLots")) {
    const lots = await prisma.adventurePartnerLot.findMany({
      where: {
        OR: [
          { adventureId },
          { adventureId: null, cityId: adventure.cityId },
        ],
      },
      orderBy: [{ partnerName: "asc" }, { title: "asc" }],
      select: {
        partnerName: true,
        title: true,
        description: true,
        redemptionHint: true,
        active: true,
        quantityRemaining: true,
      },
    });
    payload.partnerLots = lots.map((lot) => ({
      partnerName: lot.partnerName,
      title: lot.title,
      description: lot.description,
      redemptionHint: lot.redemptionHint,
      active: lot.active,
      quantityRemaining: lot.quantityRemaining,
    }));
  }

  return { success: true, payload };
}
