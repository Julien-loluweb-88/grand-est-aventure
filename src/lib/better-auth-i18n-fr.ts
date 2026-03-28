/**
 * Traductions des codes d’erreur Better Auth (@better-auth/core).
 * Utilisé par le plugin `@better-auth/i18n`.
 */
export const betterAuthFrMessages: Record<string, string> = {
  USER_NOT_FOUND: "Utilisateur introuvable.",
  FAILED_TO_CREATE_USER: "Impossible de créer l’utilisateur.",
  FAILED_TO_CREATE_SESSION: "Impossible de créer la session.",
  FAILED_TO_UPDATE_USER: "Impossible de mettre à jour l’utilisateur.",
  FAILED_TO_GET_SESSION: "Impossible de récupérer la session.",
  INVALID_PASSWORD: "Mot de passe invalide.",
  INVALID_EMAIL: "Adresse e-mail invalide.",
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  INVALID_USER: "Utilisateur invalide.",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Ce compte social est déjà lié à un autre utilisateur.",
  PROVIDER_NOT_FOUND: "Fournisseur d’identification introuvable.",
  INVALID_TOKEN: "Jeton invalide ou expiré.",
  TOKEN_EXPIRED: "Le jeton a expiré.",
  ID_TOKEN_NOT_SUPPORTED: "Le jeton d’identité n’est pas pris en charge.",
  FAILED_TO_GET_USER_INFO: "Impossible de récupérer les informations utilisateur.",
  USER_EMAIL_NOT_FOUND: "Aucun compte associé à cette adresse e-mail.",
  EMAIL_NOT_VERIFIED: "L’adresse e-mail n’est pas encore vérifiée.",
  PASSWORD_TOO_SHORT: "Le mot de passe est trop court.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Cette adresse e-mail est déjà utilisée. Choisissez-en une autre.",
  EMAIL_CAN_NOT_BE_UPDATED: "L’adresse e-mail ne peut pas être modifiée.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Aucun compte identifiant-mot de passe trouvé.",
  ACCOUNT_NOT_FOUND: "Compte introuvable.",
  SESSION_EXPIRED: "La session a expiré. Veuillez vous reconnecter.",
  FAILED_TO_UNLINK_LAST_ACCOUNT:
    "Impossible de retirer le dernier moyen de connexion du compte.",
  USER_ALREADY_HAS_PASSWORD: "Ce compte a déjà un mot de passe.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    "Connexion bloquée pour des raisons de sécurité (navigation inter-sites).",
  VERIFICATION_EMAIL_NOT_ENABLED:
    "La vérification par e-mail n’est pas activée sur ce service.",
  EMAIL_ALREADY_VERIFIED: "L’adresse e-mail est déjà vérifiée.",
  EMAIL_MISMATCH: "L’adresse e-mail ne correspond pas.",
  SESSION_NOT_FRESH: "Une nouvelle authentification est requise pour cette action.",
  LINKED_ACCOUNT_ALREADY_EXISTS: "Ce compte est déjà lié.",
  INVALID_ORIGIN: "Origine de la requête non autorisée.",
  INVALID_CALLBACK_URL: "URL de retour invalide.",
  INVALID_REDIRECT_URL: "URL de redirection invalide.",
  INVALID_ERROR_CALLBACK_URL: "URL de retour en cas d’erreur invalide.",
  INVALID_NEW_USER_CALLBACK_URL: "URL de retour pour nouvel utilisateur invalide.",
  MISSING_OR_NULL_ORIGIN: "Origine de la requête manquante.",
  CALLBACK_URL_REQUIRED: "Une URL de retour est requise.",
  FAILED_TO_CREATE_VERIFICATION: "Impossible de créer la vérification.",
  FIELD_NOT_ALLOWED: "Ce champ n’est pas autorisé.",
  ASYNC_VALIDATION_NOT_SUPPORTED: "La validation asynchrone n’est pas prise en charge.",
  VALIDATION_ERROR: "Données invalides.",
  MISSING_FIELD: "Un champ obligatoire est manquant.",
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED:
    "Méthode non autorisée (session différée requise).",
  BODY_MUST_BE_AN_OBJECT: "Le corps de la requête doit être un objet JSON.",
  PASSWORD_ALREADY_SET: "Un mot de passe est déjà défini pour ce compte.",
};
