import type { Prisma } from "../../generated/prisma/browser";

/** Données communes création / mise à jour d’une aventure (côté serveur). */
export type AdventureWriteInput = {
  name: string;
  description: Prisma.InputJsonValue;
  cityId: string;
  status?: boolean;
  latitude: number;
  longitude: number;
  coverImageUrl?: string | null;
  /** Visuel du badge virtuel (stocké sur `BadgeDefinition`). */
  badgeImageUrl?: string | null;
  /** Nombre d’exemplaires physiques numérotés (0 = pas de suivi de stock côté trésor). */
  physicalBadgeStockCount?: number;
  /** Réservé au superadmin : ids utilisateurs `role === "admin"`. */
  assignedAdminIds?: string[];
  /** UUID client : images TipTap (`drafts/{id}/editor/`) migrées vers l’aventure créée. */
  descriptionDraftId?: string | null;
  /** PUBLIC = catalogue joueur ; DEMO = réservé aux admins et à la liste blanche. */
  audience?: "PUBLIC" | "DEMO";
};
