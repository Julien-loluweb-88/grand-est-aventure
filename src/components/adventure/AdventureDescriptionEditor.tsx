"use client";

import dynamic from "next/dynamic";
import type { AdventureDescriptionEditorProps } from "./adventure-description-editor.types";

const AdventureDescriptionEditorInner = dynamic(
  () =>
    import("./AdventureDescriptionEditor.inner").then(
      (m) => m.AdventureDescriptionEditorInner
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[152px] rounded-md border border-input bg-muted/30 animate-pulse"
        aria-hidden
      />
    ),
  }
);

export function AdventureDescriptionEditor(props: AdventureDescriptionEditorProps) {
  return <AdventureDescriptionEditorInner {...props} />;
}

export type {
  AdventureDescriptionEditorProps,
  AdventureDescriptionEditorialRewriteConfig,
} from "./adventure-description-editor.types";
