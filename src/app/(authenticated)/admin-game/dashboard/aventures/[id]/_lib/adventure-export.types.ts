export const ADVENTURE_EXPORT_OPTIONAL_SECTIONS = [
  "enigmas",
  "treasure",
  "reviews",
  "discoveryPoints",
  "partnerLots",
] as const;

export type AdventureExportOptionalSection =
  (typeof ADVENTURE_EXPORT_OPTIONAL_SECTIONS)[number];

export type AdventureExportSections = {
  /** Toujours inclus. */
  general: true;
} & Partial<Record<AdventureExportOptionalSection, boolean>>;

export type AdventureExportAvailability = Record<
  AdventureExportOptionalSection,
  boolean
>;

export type AdventureExportPayload = {
  exportedAt: string;
  adventure: {
    id: string;
    name: string;
    cityName: string;
    description: string;
    latitude: number;
    longitude: number;
    distanceKm: number | null;
    estimatedDurationLabel: string;
    averageDurationLabel: string;
    audience: string;
    status: boolean;
    coverImageUrl: string | null;
    enigmaCount: number;
    hasTreasure: boolean;
  };
  enigmas?: Array<{
    number: number;
    name: string;
    question: string;
    description: string;
    answer: string;
    latitude: number;
    longitude: number;
  }>;
  treasure?: {
    name: string;
    description: string;
    finishMessage: string;
    latitude: number;
    longitude: number;
    chestCode: string;
    chestCodeAlt: string | null;
  } | null;
  reviews?: Array<{
    authorName: string;
    rating: number | null;
    content: string | null;
    createdAt: string;
    consentCommunicationNetworks: boolean;
  }>;
  discoveryPoints?: Array<{
    title: string;
    teaser: string | null;
    latitude: number;
    longitude: number;
  }>;
  partnerLots?: Array<{
    partnerName: string;
    title: string;
    description: string | null;
    redemptionHint: string | null;
    active: boolean;
    quantityRemaining: number | null;
  }>;
};
