import * as z from "zod";
import {
  adventureDescriptionCreateZod,
  adventureDescriptionEditZod,
  enigmaAnswerMessageCreateZod,
  enigmaAnswerMessageEditZod,
} from "@/lib/adventure-description-schema";
import {
  ENIGMA_NAME_MAX_CHARS,
  ENIGMA_QUESTION_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import { normalizeGameSubmission } from "@/lib/game/normalize-game-submission";

const enigmaSharedFields = {
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(ENIGMA_NAME_MAX_CHARS, `Le nom ne doit pas dépasser ${ENIGMA_NAME_MAX_CHARS} caractères.`),
  question: z
    .string()
    .min(10, "La question doit comporter au moins 10 caractères")
    .max(
      ENIGMA_QUESTION_MAX_CHARS,
      `La question ne doit pas dépasser ${ENIGMA_QUESTION_MAX_CHARS} caractères.`
    ),
  uniqueResponse: z.boolean().optional(),
  /** Plusieurs réponses correctes (QCM cases à cocher côté joueur). */
  multiSelect: z.boolean().optional(),
  choices: z.array(z.string()),
  /** Une entrée par ligne de choix : case « bonne réponse » si `multiSelect`. */
  correctChoiceFlags: z.array(z.boolean()).optional().default([]),
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
    multiSelect?: boolean;
    answer?: string;
    choices: string[];
    correctChoiceFlags?: boolean[];
  },
  ctx: z.RefinementCtx
) {
  const hasUnique = data.uniqueResponse === true;
  const hasAnswer = data.answer && data.answer.trim() !== "";
  const nonEmptyChoices = data.choices.map((c) => c.trim()).filter((c) => c !== "");
  const hasChoices = nonEmptyChoices.length > 0;
  const multi = data.multiSelect === true;

  if (!hasUnique && !hasAnswer && !hasChoices) {
    ctx.addIssue({
      code: "custom",
      message: "Vous devez remplir uniqueResponse ou answer ou des choix",
      path: ["answer"],
    });
  }

  if (multi && !hasChoices) {
    ctx.addIssue({
      code: "custom",
      message: "Ajoutez des choix pour activer la sélection multiple.",
      path: ["multiSelect"],
    });
  }

  if (multi && hasChoices) {
    const flags = data.correctChoiceFlags ?? [];
    let marked = 0;
    for (let i = 0; i < data.choices.length; i++) {
      const t = data.choices[i]?.trim() ?? "";
      if (t !== "" && flags[i] === true) {
        marked += 1;
      }
    }
    if (marked === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Cochez au moins une bonne réponse.",
        path: ["correctChoiceFlags"],
      });
    }
  }

  if (!multi && hasChoices && !hasAnswer) {
    ctx.addIssue({
      code: "custom",
      message: "Sélectionnez une bonne réponse parmi les choix.",
      path: ["answer"],
    });
  }

  if (!multi && hasAnswer && hasChoices && !nonEmptyChoices.includes(data.answer!.trim())) {
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

/** Libellés corrects pour l’action serveur (QCM multi-sélection). */
export function computeEnigmaCorrectAnswersFromForm(plain: {
  multiSelect?: boolean;
  choices: string[];
  correctChoiceFlags?: boolean[];
}): string[] {
  if (!plain.multiSelect) return [];
  return plain.choices
    .map((c, i) => ({ c: c.trim(), ok: plain.correctChoiceFlags?.[i] === true }))
    .filter((x) => x.c !== "" && x.ok)
    .map((x) => x.c);
}

/** Aligne les cases « bonne réponse » avec les libellés stockés en base. */
export function buildCorrectChoiceFlagsForEdit(
  choices: string[],
  correctAnswers: string[] | null | undefined
): boolean[] {
  const expected = new Set(
    (correctAnswers ?? []).map((s) => normalizeGameSubmission(s)).filter(Boolean)
  );
  return choices.map((c) => expected.has(normalizeGameSubmission(c.trim())));
}
