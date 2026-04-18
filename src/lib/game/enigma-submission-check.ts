import type { Prisma } from "../../../generated/prisma/client";
import { normalizeGameSubmission } from "./normalize-game-submission";

function parseChoiceStrings(choice: Prisma.JsonValue | null | undefined): string[] {
  if (choice == null) return [];
  if (!Array.isArray(choice)) return [];
  return choice.flatMap((x) => (typeof x === "string" ? [x] : []));
}

function parseCorrectAnswersJson(raw: Prisma.JsonValue | null | undefined): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x) => (typeof x === "string" ? [x] : []));
}

function normalizedSet(strings: string[]): Set<string> {
  const s = new Set<string>();
  for (const x of strings) {
    const n = normalizeGameSubmission(x);
    if (n) s.add(n);
  }
  return s;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

export type EnigmaForSubmissionCheck = {
  multiSelect: boolean;
  answer: string;
  choice: Prisma.JsonValue | null;
  correctAnswers: Prisma.JsonValue | null;
};

/**
 * - QCM une seule bonne réponse : `submission` (chaîne) = un des `choice` (comme `answer`).
 * - QCM plusieurs bonnes réponses : `submissions` (tableau) ; doit coïncider avec `correctAnswers` (ensemble, ordre indifférent).
 * - Sans choix : réponse libre, `submission` comparée à `answer`.
 */
export function enigmaSubmissionIsCorrect(
  enigma: EnigmaForSubmissionCheck,
  input: { submission: string; submissions: string[] | null }
): boolean {
  const choices = parseChoiceStrings(enigma.choice);
  const hasChoices = choices.length > 0;

  if (hasChoices && enigma.multiSelect) {
    const raw = input.submissions;
    if (raw == null || !Array.isArray(raw)) return false;
    const player = raw.filter((x): x is string => typeof x === "string");
    if (player.length === 0) return false;
    const expected = parseCorrectAnswersJson(enigma.correctAnswers);
    if (expected.length === 0) return false;
    return setsEqual(normalizedSet(player), normalizedSet(expected));
  }

  const submission = normalizeGameSubmission(input.submission);
  if (!submission) return false;

  if (hasChoices && !enigma.multiSelect) {
    const primary = normalizeGameSubmission(enigma.answer ?? "");
    if (!primary) return false;
    return submission === primary;
  }

  const expected = normalizeGameSubmission(enigma.answer ?? "");
  if (!expected) return false;
  return submission === expected;
}
