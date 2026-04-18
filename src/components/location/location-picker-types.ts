/**
 * Marqueurs de contexte sur les cartes d’édition / consultation.
 * Union discriminée : les énigmes portent `id` + `number` (tracé ORS, filtres édition).
 */
export type LocationPickerContextMarker =
  | {
      kind: "departure";
      latitude: number;
      longitude: number;
      /** Absent sur certains jeux de repères admin ; la carte affiche un libellé fixe pour D. */
      name?: string;
      /** Plusieurs parcours sur une même carte (ex. accueil public). */
      adventureId?: string;
      /** Distance du parcours en km (itinéraire), si calculée. */
      distanceKm?: number | null;
      /** Note moyenne (1–5) des avis publics approuvés ; `null` si pas assez de données. */
      averageRating?: number | null;
      /** Secondes — estimation durée de parcours (héuristique serveur). */
      estimatedDurationSeconds?: number | null;
      /** Secondes — moyenne durée réelle joueurs (si assez de données). */
      averagePlayDurationSeconds?: number | null;
    }
  | {
      kind: "enigma";
      id: string;
      number: number;
      name: string;
      latitude: number;
      longitude: number;
    }
  | {
      kind: "treasure";
      name: string;
      latitude: number;
      longitude: number;
    };
