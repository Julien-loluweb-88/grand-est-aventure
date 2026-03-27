"use client";

import dynamic from "next/dynamic";
import type { AdventureEditFormPayload } from "./adventure-edit-payload";

const AdventureEditForm = dynamic(
  () => import("./AdventureEditForm").then((m) => m.AdventureEditForm),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[320px] animate-pulse rounded-md bg-muted/40"
        aria-hidden
      />
    ),
  }
);

export function AdventureEditFormClient({
  adventure,
}: {
  adventure: AdventureEditFormPayload;
}) {
  return <AdventureEditForm adventure={adventure} />;
}
