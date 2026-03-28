/** Données trésor sérialisables pour le formulaire client (fiche aventure). */
export type TreasureEditPayload = {
  id: string;
  name: string;
  description: unknown;
  code: string;
  safeCode: string | null;
  latitude: number;
  longitude: number;
};
