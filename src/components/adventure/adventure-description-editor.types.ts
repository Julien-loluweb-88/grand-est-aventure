import type { JSONContent } from "@tiptap/core";
import type { EditorialRewriteScope } from "@/lib/editorial-rewrite-scope";

export type AdventureDescriptionEditorProps = {
  id?: string;
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  /** Assistant Mistral (reformulation) — réservé au dashboard. */
  editorialRewrite?: { scope: EditorialRewriteScope };
  /**
   * Téléversement vers `uploads/adventures/{id}/editor/` (édition d’une aventure existante).
   */
  richTextImageUploadAdventureId?: string;
  /**
   * Téléversement brouillon : `uploads/adventures/drafts/{uuid}/editor/` (formulaire de création).
   * Les fichiers sont migrés vers l’aventure à la création.
   */
  richTextImageUploadDraftId?: string;
};
