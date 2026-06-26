/** Informations légales de l’éditeur (Loluweb / Balad'indice). Source : déclarations publiques Loluweb. */

export const LEGAL_LAST_UPDATED = "1er juin 2026";

export const SITE_PUBLISHER = {
  /** Nom commercial de l’éditeur */
  tradeName: "Loluweb",
  /** Nom du service */
  serviceName: "Balad'indice",
  /** Entrepreneur individuel */
  legalName: "Julien PIERRAT-LABOLLE",
  legalForm: "Entrepreneur individuel",
  addressLine1: "1 bis rue de Viombois",
  postalCode: "88110",
  city: "Raon-l'Étape",
  country: "France",
  email: "julien.pierrat-labolle@loluweb.fr",
  phone: "06 01 22 77 30",
  directorOfPublication: "Julien PIERRAT-LABOLLE",
  siret: "984 175 943 00013",
  siren: "984 175 943",
  vatNumber: "FR34 984 175 943",
  rcs: "RCS Épinal",
  naf: "6201Z — Programmation informatique",
  publisherWebsite: "https://loluweb.fr",
} as const;

/** Hébergement assuré par l’éditeur (LCEN) — formulation publique, sans détail d’infrastructure. */
export const SITE_HOSTING = {
  name: "Loluweb — Julien PIERRAT-LABOLLE",
  website: SITE_PUBLISHER.publisherWebsite,
  country: "France",
  /** Texte réutilisable dans les pages légales */
  publicDescription:
    "Infrastructure technique située en France, opérée sous la responsabilité de l’éditeur.",
} as const;

export const MOBILE_APP = {
  androidPackage: "com.loluweb.baladindices",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.loluweb.baladindices",
} as const;

export function getPublicSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://baladindices.fr";
}

export function formatPublisherAddress(): string {
  const p = SITE_PUBLISHER;
  return `${p.addressLine1}, ${p.postalCode} ${p.city}, ${p.country}`;
}
