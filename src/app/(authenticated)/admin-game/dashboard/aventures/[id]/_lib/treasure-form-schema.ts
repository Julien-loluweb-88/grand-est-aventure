import * as z from "zod";
import {
  adventureDescriptionCreateZod,
  adventureDescriptionEditZod,
} from "@/lib/adventure-description-schema";
import { TREASURE_NAME_MAX_CHARS } from "@/lib/dashboard-text-limits";

const optionalAlt = z
  .string()
  .max(30, "30 caractères maximum")
  .optional()
  .default("");

const treasureSharedFields = {
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(
      TREASURE_NAME_MAX_CHARS,
      `Le nom ne doit pas dépasser ${TREASURE_NAME_MAX_CHARS} caractères.`
    ),
  mapRevealCode: z
    .string()
    .min(2, "Le code de révélation carte doit contenir au moins 2 caractères")
    .max(30, "Le code de révélation carte ne doit pas dépasser 30 caractères"),
  mapRevealCodeAlt: optionalAlt,
  chestCode: z
    .string()
    .min(2, "Le code coffre doit contenir au moins 2 caractères")
    .max(30, "Le code coffre ne doit pas dépasser 30 caractères"),
  chestCodeAlt: optionalAlt,
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  adventureId: z.string(),
  imageUrl: z.string().max(2048).optional().default(""),
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
