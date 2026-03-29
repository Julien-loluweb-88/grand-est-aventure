import type { JSONContent } from "@tiptap/core";

export type AdventureDescriptionEditorProps = {
  id?: string;
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
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
