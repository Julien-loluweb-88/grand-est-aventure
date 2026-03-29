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
  badgeImageUrl?: string | null;
  /** Réservé au superadmin : ids utilisateurs `role === "admin"`. */
  assignedAdminIds?: string[];
  /** UUID client : images TipTap (`drafts/{id}/editor/`) migrées vers l’aventure créée. */
  descriptionDraftId?: string | null;
};
