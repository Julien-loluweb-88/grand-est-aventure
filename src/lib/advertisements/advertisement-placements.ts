/** Emplacements publicitaires reconnus par l’app mobile (query `placement` de `GET /api/advertisements`). */
export const ADVERTISEMENT_PLACEMENT_VALUES = ["home", "library"] as const;

export type AdvertisementPlacement = (typeof ADVERTISEMENT_PLACEMENT_VALUES)[number];

export type AdvertisementPlacementOption = {
  value: AdvertisementPlacement;
  /** Libellé affiché dans l’admin. */
  label: string;
  /** Écran mobile concerné. */
  screen: string;
  /** Appel API côté app (référence intégration). */
  apiCall: string;
};

export const ADVERTISEMENT_PLACEMENTS: AdvertisementPlacementOption[] = [
  {
    value: "home",
    label: "Accueil",
    screen: "Écran d’accueil (carte, carrousel, stats)",
    apiCall: "GET /api/game/home (`advertisements[]`) ou GET /api/advertisements?placement=home",
  },
  {
    value: "library",
    label: "Bibliothèque",
    screen: "Catalogue / bibliothèque d’aventures",
    apiCall: "GET /api/advertisements?placement=library",
  },
];

export const DEFAULT_ADVERTISEMENT_PLACEMENT: AdvertisementPlacement = "home";

/** Constante utilisée par `GET /api/game/home`. */
export const HOME_ADVERTISEMENT_PLACEMENT: AdvertisementPlacement = "home";

export function isAdvertisementPlacement(value: string): value is AdvertisementPlacement {
  return (ADVERTISEMENT_PLACEMENT_VALUES as readonly string[]).includes(value);
}

export function normalizeAdvertisementPlacement(
  raw: string | null | undefined
): AdvertisementPlacement {
  const trimmed = (raw ?? "").trim();
  if (isAdvertisementPlacement(trimmed)) {
    return trimmed;
  }
  return DEFAULT_ADVERTISEMENT_PLACEMENT;
}

export function getAdvertisementPlacementOption(
  value: string
): AdvertisementPlacementOption | undefined {
  return ADVERTISEMENT_PLACEMENTS.find((p) => p.value === value);
}

export function labelForAdvertisementPlacement(value: string): string {
  const option = getAdvertisementPlacementOption(value);
  return option ? `${option.label} (${option.value})` : value;
}
