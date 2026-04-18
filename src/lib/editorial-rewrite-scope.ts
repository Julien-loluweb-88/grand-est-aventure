/** Périmètre d’autorisation pour `editorialRewriteAction` (sérialisable client → serveur). */
export type EditorialRewriteScope =
  | { type: "adventure-create" }
  | { type: "adventure"; adventureId: string }
  | { type: "city-editorial" }
  /** Demande « nouvelle aventure » (admins sans droit de création directe). */
  | { type: "adventure-creation-request" };
