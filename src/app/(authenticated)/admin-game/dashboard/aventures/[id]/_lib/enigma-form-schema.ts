import * as z from "zod";
import {
  adventureDescriptionCreateZod,
  adventureDescriptionEditZod,
  enigmaAnswerMessageCreateZod,
  enigmaAnswerMessageEditZod,
} from "@/lib/adventure-description-schema";

const enigmaSharedFields = {
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  question: z
    .string()
    .min(10, "La question doit comporter au moins 10 caractères")
    .max(250, "La question ne doit pas dépasser 250 caractères"),
  uniqueResponse: z.boolean().optional(),
  choices: z.array(z.string()),
  answer: z.string().optional(),
  adventureId: z.string(),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  imageUrl: z.string().max(2048).optional().default(""),
};

function enigmaAnswerRefinement(
  data: {
    uniqueResponse?: boolean;
    answer?: string;
    choices: string[];
  },
  ctx: z.RefinementCtx
) {
  const hasUnique = data.uniqueResponse === true;
  const hasAnswer = data.answer && data.answer.trim() !== "";
  const nonEmptyChoices = data.choices.map((c) => c.trim()).filter((c) => c !== "");
  const hasChoices = nonEmptyChoices.length > 0;

  if (!hasUnique && !hasAnswer && !hasChoices) {
    ctx.addIssue({
      code: "custom",
      message: "Vous devez remplir uniqueResponse ou answer ou des choix",
      path: ["answer"],
    });
  }

  if (hasChoices && !hasAnswer) {
    ctx.addIssue({
      code: "custom",
      message: "Sélectionnez une bonne réponse parmi les choix.",
      path: ["answer"],
    });
  }

  if (hasAnswer && hasChoices && !nonEmptyChoices.includes(data.answer!.trim())) {
    ctx.addIssue({
      code: "custom",
      message: "La bonne réponse doit correspondre à un choix.",
      path: ["answer"],
    });
  }
}

export const enigmaCreateFormSchema = z
  .object({
    ...enigmaSharedFields,
    answerMessage: enigmaAnswerMessageCreateZod,
    description: adventureDescriptionCreateZod,
  })
  .superRefine(enigmaAnswerRefinement);

export const enigmaEditFormSchema = z
  .object({
    ...enigmaSharedFields,
    number: z.coerce.number().refine((v) => !isNaN(v), {
      message: "Numéro invalide",
    }),
    answerMessage: enigmaAnswerMessageEditZod,
    description: adventureDescriptionEditZod,
  })
  .superRefine(enigmaAnswerRefinement);

export type EnigmaCreateFormValues = z.infer<typeof enigmaCreateFormSchema>;
export type EnigmaEditFormValues = z.infer<typeof enigmaEditFormSchema>;
