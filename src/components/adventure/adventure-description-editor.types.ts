import type { JSONContent } from "@tiptap/core";

export type AdventureDescriptionEditorProps = {
  id?: string;
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
};
