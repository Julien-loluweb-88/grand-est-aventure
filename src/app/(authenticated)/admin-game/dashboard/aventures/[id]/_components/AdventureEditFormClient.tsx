"use client";

import dynamic from "next/dynamic";
import type { AdventureEditFormPayload } from "../_lib/adventure-edit-payload";
import type { CitySelectOption } from "@/lib/city-types";

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
  cities,
}: {
  adventure: AdventureEditFormPayload;
  cities: CitySelectOption[];
}) {
  return <AdventureEditForm adventure={adventure} cities={cities} />;
}
