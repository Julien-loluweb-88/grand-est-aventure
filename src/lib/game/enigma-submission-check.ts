import type { Prisma } from "../../../generated/prisma/client";
import { normalizeGameSubmission } from "./normalize-game-submission";

function parseChoiceStrings(choice: Prisma.JsonValue | null | undefined): string[] {
  if (choice == null) return [];
  if (!Array.isArray(choice)) return [];
  return choice.flatMap((x) => (typeof x === "string" ? [x] : []));
}

/**
 * Vérifie la réponse joueur contre `answer` / choix QCM (aligné sur les formulaires admin).
 */
export function enigmaSubmissionIsCorrect(
  enigma: {
    uniqueResponse: boolean;
    answer: string;
    choice: Prisma.JsonValue | null;
  },
  submissionRaw: string
): boolean {
  const submission = normalizeGameSubmission(submissionRaw);
  if (!submission) return false;

  const expected = normalizeGameSubmission(enigma.answer ?? "");
  const choices = parseChoiceStrings(enigma.choice);

  if (choices.length > 0) {
    if (!expected) return false;
    return submission === expected;
  }

  if (!expected) return false;

  if (enigma.uniqueResponse) {
    return submission === expected;
  }

  return submission === expected;
}
