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
