/** Données trésor sérialisables pour le formulaire client (fiche aventure). */
export type TreasureEditPayload = {
  id: string;
  name: string;
  description: unknown;
  mapRevealCode: string;
  mapRevealCodeAlt: string | null;
  chestCode: string;
  chestCodeAlt: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
};
