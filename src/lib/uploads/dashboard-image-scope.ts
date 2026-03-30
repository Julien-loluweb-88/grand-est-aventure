export type DashboardImageScope =
  | "adventure-cover"
  | "adventure-badge"
  | "adventure-editor-image"
  /** Brouillon (création d’aventure) : `uploads/adventures/drafts/{draftId}/editor/…` */
  | "adventure-editor-draft"
  | "enigma"
  | "treasure"
  /** Image publicité (fiche existante) : `uploads/advertisements/{advertisementId}/…` */
  | "advertisement"
  /** Brouillon (création publicité) : `uploads/advertisements/drafts/{draftId}/…` */
  | "advertisement-draft";
