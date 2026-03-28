import * as z from "zod";
import {
  adventureDescriptionCreateZod,
  adventureDescriptionEditZod,
} from "@/lib/adventure-description-schema";

const treasureSharedFields = {
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(30, "Le code doit être maximum 30 caractères"),
  safeCode: z
    .string()
    .min(2, "Le code de sécurité doit contenir au moins 2 caractères")
    .max(30, "Le code de sécurité ne doit pas dépasser 30 caractères"),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  adventureId: z.string(),
};

export const treasureCreateFormSchema = z.object({
  ...treasureSharedFields,
  description: adventureDescriptionCreateZod,
});

export const treasureEditFormSchema = z.object({
  ...treasureSharedFields,
  description: adventureDescriptionEditZod,
});

export type TreasureCreateFormValues = z.infer<typeof treasureCreateFormSchema>;
export type TreasureEditFormValues = z.infer<typeof treasureEditFormSchema>;
