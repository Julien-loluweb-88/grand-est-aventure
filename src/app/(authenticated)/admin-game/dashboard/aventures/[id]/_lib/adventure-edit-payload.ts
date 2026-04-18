import type { LocationPickerContextMarker } from "@/components/location/location-picker-types"

/** Même forme que les repères `LocationPicker` (énigmes / trésor). */
export type AdventureMapContextMarker = LocationPickerContextMarker

export type AdventureEditFormPayload = {
  id: string
  name: string
  description: unknown
  cityId: string
  cityName: string
  latitude: number
  longitude: number
  /** Km (itinéraire OpenRouteService) ou non calculé. */
  distance: number | null
  /** Secondes — estimation temps de parcours (sync itinéraire). */
  estimatedPlayDurationSeconds: number | null
  /** Secondes — moyenne temps réel (≥ 5 parties) ; `null` sinon. */
  averagePlayDurationSeconds: number | null
  playDurationSampleCount: number
  /** Dernière mise à jour des stats temps réel (cron). */
  playDurationStatsUpdatedAt: string | null
  /** Énigmes + trésor à afficher sur la carte (couleurs / numéros distincts du point départ). */
  mapContextMarkers: AdventureMapContextMarker[]
  /**
   * Tracé routier OpenRouteService (même ordre que la distance) : paires [lat, lng].
   * `null` sans clé API, erreur ORS, ou moins de deux étapes.
   */
  routePolyline: [number, number][] | null
  coverImageUrl: string | null
  badgeImageUrl: string | null
  physicalBadgeStockCount: number
  /** PUBLIC = catalogue ; DEMO = réservé admins + liste blanche. */
  audience: "PUBLIC" | "DEMO"
}
