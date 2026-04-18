import type { JSONContent } from "@tiptap/core";
import * as z from "zod";
import { tiptapJsonPlainTextLength } from "@/lib/adventure-description-tiptap";
import {
  ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS,
  RICH_TEXT_PLAIN_MAX_CHARS,
} from "@/lib/dashboard-text-limits";

const tiptapDoc = z.custom<JSONContent>(
  (v): v is JSONContent =>
    typeof v === "object" &&
    v !== null &&
    "type" in v &&
    (v as JSONContent).type === "doc"
);

/** Création d’aventure : au moins 20 caractères de texte. */
export const adventureDescriptionCreateZod = tiptapDoc.superRefine((doc, ctx) => {
  const len = tiptapJsonPlainTextLength(doc);
  if (len < 20) {
    ctx.addIssue({
      code: "custom",
      message: "La description doit contenir au moins 20 caractères.",
    });
  }
  if (len > RICH_TEXT_PLAIN_MAX_CHARS) {
    ctx.addIssue({
      code: "custom",
      message: `La description est trop longue (${RICH_TEXT_PLAIN_MAX_CHARS.toLocaleString("fr-FR")} caractères maximum).`,
    });
  }
});

/** Édition : au moins 1 caractère. */
export const adventureDescriptionEditZod = tiptapDoc.superRefine((doc, ctx) => {
  const len = tiptapJsonPlainTextLength(doc);
  if (len < 1) {
    ctx.addIssue({
      code: "custom",
      message: "La description ne peut pas être vide.",
    });
  }
  if (len > RICH_TEXT_PLAIN_MAX_CHARS) {
    ctx.addIssue({
      code: "custom",
      message: `La description est trop longue (${RICH_TEXT_PLAIN_MAX_CHARS.toLocaleString("fr-FR")} caractères maximum).`,
    });
  }
});

/** Message affiché après une bonne réponse (énigme). */
export const enigmaAnswerMessageCreateZod = tiptapDoc.superRefine((doc, ctx) => {
  const len = tiptapJsonPlainTextLength(doc);
  if (len < 3) {
    ctx.addIssue({
      code: "custom",
      message: "Le message doit contenir au moins 3 caractères.",
    });
  }
  if (len > ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS) {
    ctx.addIssue({
      code: "custom",
      message: `Le message ne doit pas dépasser ${ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS} caractères.`,
    });
  }
});

export const enigmaAnswerMessageEditZod = tiptapDoc.superRefine((doc, ctx) => {
  const len = tiptapJsonPlainTextLength(doc);
  if (len < 1) {
    ctx.addIssue({
      code: "custom",
      message: "Le message ne peut pas être vide.",
    });
  }
  if (len > ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS) {
    ctx.addIssue({
      code: "custom",
      message: `Le message ne doit pas dépasser ${ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS} caractères.`,
    });
  }
});
