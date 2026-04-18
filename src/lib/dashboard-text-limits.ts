/**
 * Limites de texte alignées entre Zod (formulaires admin), validations server actions
 * et compteurs UI. PostgreSQL `String` sans `@db.VarChar` : pas de migration Prisma nécessaire.
 */

export const ADVENTURE_NAME_MAX_CHARS = 100;

export const ENIGMA_NAME_MAX_CHARS = 80;
export const ENIGMA_QUESTION_MAX_CHARS = 500;

export const TREASURE_NAME_MAX_CHARS = 100;

/** Texte brut (TipTap) pour le message après bonne réponse (énigme). */
export const ENIGMA_ANSWER_MESSAGE_PLAIN_MAX_CHARS = 500;

/** Descriptions riches (aventure, énigme, trésor) : longueur texte visible. */
export const RICH_TEXT_PLAIN_MAX_CHARS = 50_000;

export const DISCOVERY_POINT_TITLE_MAX_CHARS = 300;
export const DISCOVERY_POINT_TEASER_MAX_CHARS = 2000;

export const ADVENTURE_REQUEST_MESSAGE_MAX_CHARS = 2000;

export const ADVERTISEMENT_INTERNAL_NAME_MAX_CHARS = 200;
export const ADVERTISEMENT_PARTNER_NAME_MAX_CHARS = 200;
export const ADVERTISEMENT_TITLE_MAX_CHARS = 500;
export const ADVERTISEMENT_BODY_MAX_CHARS = 10_000;
export const ADVERTISEMENT_PARTNER_BADGE_TITLE_MAX_CHARS = 200;

/** Badge palier global (admin). */
export const MILESTONE_BADGE_TITLE_MAX_CHARS = 200;

/** Ville (admin). */
export const CITY_NAME_MAX_CHARS = 120;
export const CITY_INSEE_CODE_MAX_CHARS = 5;
export const CITY_POSTAL_CODES_RAW_MAX_CHARS = 2000;
export const CITY_COORDINATE_STRING_MAX_CHARS = 32;
export const CITY_POPULATION_STRING_MAX_CHARS = 16;

/** Type de demande admin (superadmin). */
export const ADMIN_REQUEST_TYPE_KEY_MAX_CHARS = 64;
export const ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS = 120;
export const ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS = 500;
