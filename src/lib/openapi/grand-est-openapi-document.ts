/**
 * Spécification OpenAPI 3.1 de toutes les routes HTTP exposées par l’app Next.js.
 * À maintenir quand vous ajoutez ou modifiez un handler sous src/app/api/ (fichiers route.ts).
 * L’ordre d’affichage Swagger UI suit `swagger-openapi-order.ts` (tags + chemins).
 *
 * Sécurité doc : page /admin-game/dashboard/docs/api (+ JSON /api/openapi) réservées
 * aux sessions avec accès dashboard. Swagger UI active « Try it out » (requêtes même origine,
 * cookies de session). Le JSON /api/openapi exige la même session admin que le dashboard.
 */

export const OPENAPI_DOCUMENT_VERSION = "1.0.0";

const RATE_LIMIT_NOTE =
  "Limite par fenêtre glissante (IP + utilisateur quand session). " +
  "En cas de dépassement : réponse **429** avec en-tête Retry-After (secondes).";

/** Si API_DOCS_ENABLED vaut la chaîne « false », désactive /api/openapi et la page docs. */
export function apiDocsDisabled(): boolean {
  return process.env.API_DOCS_ENABLED === "false";
}

export function buildGrandEstOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Balad'indice — API HTTP",
      version: OPENAPI_DOCUMENT_VERSION,
      description: [
        "Contrat des routes **App Router** Next.js sous `/api` (produit **Balad'indice**).",
        "",
        "### Authentification",
        "La majorité des routes nécessitent une **session Better Auth** (cookies HttpOnly émis après connexion via `/api/auth/...`).",
        "Le nom exact du cookie dépend de la config Better Auth ; envoyez les cookies du navigateur comme pour le front.",
        "",
        "### Rate limiting",
        RATE_LIMIT_NOTE,
        "",
        "### Interface de documentation",
        "La page **`/admin-game/dashboard/docs/api`** utilise Swagger UI avec **exécution des requêtes désactivée** : consultation sans envoi depuis l’UI ; accès réservé aux comptes admin du dashboard.",
        "Pour exporter la spec hors navigateur, appelez GET /api/openapi avec les cookies de session admin (ou désactivez temporairement la garde en dev).",
        "",
        "### Fichiers statiques uploads",
        "Les fichiers sont servis via un catch-all : URL de la forme `/api/uploads/<segment1>/<segment2>/...` " +
          "(réécriture possible depuis `/uploads/...` selon `next.config`).",
      ].join("\n"),
    },
    servers: [{ url: "/", description: "Même origine que l’application" }],
    tags: [
      { name: "Authentification", description: "Handler Better Auth (login, OAuth, session, etc.)." },
      { name: "Jeu", description: "Découverte (catalogue, villes), progression, validation, fin de parcours, avis." },
      { name: "Publicités", description: "Liste des encarts et événements analytics (impressions / clics)." },
      { name: "Utilisateur", description: "Données liées au compte connecté." },
      { name: "Admin", description: "Contexte rôle pour le tableau de bord (proxy d’administration)." },
      { name: "Fichiers", description: "Fichiers publics du dossier `uploads/`." },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description:
            "Cookie de session Better Auth (nom indicatif — peut être préfixé, ex. `__Secure-`, selon l’environnement). " +
            "Obtenu après authentification réussie.",
        },
      },
      schemas: {
        ErrorMessage: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string", description: "Message d’erreur en français." },
          },
        },
        ErrorWithCode: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            code: {
              type: "string",
              description:
                "Exemples côté jeu : `ORDER`, `WRONG_ANSWER`, `ENIGMAS_INCOMPLETE`, `WRONG_CODE` — non exhaustif.",
            },
          },
        },
        GameFinishErrorProgress: {
          type: "object",
          required: ["error", "code"],
          properties: {
            error: { type: "string" },
            code: { type: "string", description: "Code issu de `GameFinishProgressError`." },
            detail: { type: ["string", "null"] },
          },
        },
        ValidateEnigmaOk: {
          type: "object",
          required: ["ok", "stepKey"],
          properties: {
            ok: { type: "boolean", const: true },
            stepKey: { type: "string", example: "enigma:1" },
            alreadyValidated: { type: "boolean", description: "Présent si l’étape était déjà validée." },
          },
        },
        ValidateTreasureOk: {
          type: "object",
          required: ["ok", "stepKey"],
          properties: {
            ok: { type: "boolean", const: true },
            stepKey: {
              type: "string",
              description: "`treasure:map` après révélation sur la carte, puis `treasure` après le code coffre.",
              example: "treasure:map",
            },
            alreadyValidated: { type: "boolean" },
            awardedUserBadgeIds: {
              type: "array",
              items: { type: "string" },
              description:
                "Présent après **code coffre** (ou rattrapage legacy) : ids `UserBadge` attribués.",
            },
            message: {
              type: "string",
              description: "Présent quand l’aventure est finalisée sur cette requête.",
            },
          },
        },
        ProgressPayload: {
          type: "object",
          required: [
            "adventureId",
            "validatedStepKeys",
            "validations",
            "userAdventure",
            "requiredEnigmaNumbers",
            "hasTreasure",
            "missingStepKeysForFinish",
            "serverReadyForSuccessFinish",
          ],
          properties: {
            adventureId: { type: "string" },
            validatedStepKeys: { type: "array", items: { type: "string" } },
            validations: {
              type: "array",
              items: {
                type: "object",
                required: ["stepKey", "validatedAt"],
                properties: {
                  stepKey: { type: "string" },
                  validatedAt: { type: "string", format: "date-time" },
                },
              },
            },
            userAdventure: {
              type: ["object", "null"],
              properties: {
                success: { type: "boolean" },
                giftNumber: { type: ["integer", "null"] },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
            requiredEnigmaNumbers: { type: "array", items: { type: "integer" } },
            hasTreasure: { type: "boolean" },
            missingStepKeysForFinish: { type: "array", items: { type: "string" } },
            serverReadyForSuccessFinish: { type: "boolean" },
          },
        },
        AdventureReviewOk: {
          type: "object",
          required: ["ok", "id", "message"],
          properties: {
            ok: { type: "boolean", const: true },
            id: { type: "string" },
            message: { type: "string" },
          },
        },
        AdventureReviewPublicItem: {
          type: "object",
          required: ["id", "createdAt"],
          properties: {
            id: { type: "string" },
            rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
            content: { type: ["string", "null"] },
            imageUrl: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
            authorDisplayName: { type: ["string", "null"], description: "Prénom ou premier mot du nom affiché." },
          },
        },
        AdventureReviewPublicListResponse: {
          type: "object",
          required: ["total", "limit", "offset", "reviews"],
          properties: {
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
            reviews: { type: "array", items: { $ref: "#/components/schemas/AdventureReviewPublicItem" } },
          },
        },
        AdventureReviewPublicDetail: {
          type: "object",
          required: ["id", "adventureId", "adventureName", "createdAt"],
          properties: {
            id: { type: "string" },
            adventureId: { type: "string" },
            adventureName: { type: "string" },
            rating: { type: ["integer", "null"] },
            content: { type: ["string", "null"] },
            imageUrl: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
            authorDisplayName: { type: ["string", "null"] },
          },
        },
        AdvertisementListResponse: {
          type: "object",
          required: ["advertisements"],
          properties: {
            advertisements: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "title", "body", "imageUrl", "targetUrl", "advertiserName", "sortOrder"],
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  body: { type: "string" },
                  imageUrl: { type: ["string", "null"] },
                  targetUrl: { type: ["string", "null"] },
                  advertiserName: { type: ["string", "null"] },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        UserBadgesResponse: {
          type: "object",
          required: ["badges"],
          properties: {
            badges: {
              type: "array",
              items: {
                type: "object",
                description: "Ligne Prisma `UserBadge` avec relation `badgeDefinition` (champs sélectionnés par la route).",
                additionalProperties: true,
              },
            },
          },
        },
        PermissionContextOk: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", description: "Rôle du sujet permission (admin / superadmin / …)." },
          },
        },
      },
    },
    paths: {
      "/api/auth/{path}": {
        get: {
          tags: ["Authentification"],
          summary: "Better Auth (GET)",
          description:
            "Catch-all Better Auth : OAuth callbacks, vérifications, etc. " +
            "Le détail des chemins dépend de la librairie **better-auth** ; référez-vous à [la doc Better Auth](https://www.better-auth.com/docs).",
          parameters: [{ name: "path", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Selon l’opération auth." },
            "302": { description: "Redirection OAuth / flow." },
            "400": { description: "Requête invalide." },
            "401": { description: "Non autorisé." },
          },
        },
        post: {
          tags: ["Authentification"],
          summary: "Better Auth (POST)",
          description: "Connexion, inscription, déconnexion, etc. — voir doc Better Auth.",
          parameters: [{ name: "path", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": { schema: { type: "object", additionalProperties: true } },
              "application/x-www-form-urlencoded": { schema: { type: "object", additionalProperties: true } },
            },
          },
          responses: {
            "200": { description: "Succès (JSON ou cookie de session)." },
            "400": { description: "Données invalides." },
            "401": { description: "Échec d’authentification." },
          },
        },
      },
      "/api/game/adventures": {
        get: {
          tags: ["Jeu"],
          summary: "Catalogue mobile des aventures actives",
          description:
            "Liste publique \"safe\" pour app mobile (sans réponses d’énigmes ni codes trésor). " +
            "Filtres disponibles : ville, recherche textuelle, géolocalisation + rayon, pagination.",
          parameters: [
            { name: "cityId", in: "query", required: false, schema: { type: "string" } },
            { name: "q", in: "query", required: false, schema: { type: "string" } },
            { name: "latitude", in: "query", required: false, schema: { type: "number" } },
            { name: "longitude", in: "query", required: false, schema: { type: "number" } },
            {
              name: "radiusKm",
              in: "query",
              required: false,
              schema: { type: "number", minimum: 0.001 },
              description: "Nécessite latitude + longitude.",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 0, default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Liste paginée des aventures actives.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["total", "limit", "offset", "adventures"],
                    properties: {
                      total: { type: "integer" },
                      limit: { type: "integer" },
                      offset: { type: "integer" },
                      adventures: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["id", "name", "enigmaCount", "hasTreasure", "updatedAt"],
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            coverImageUrl: { type: ["string", "null"] },
                            city: {
                              type: "object",
                              required: ["id", "name", "postalCodes"],
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                postalCodes: { type: "array", items: { type: "string" } },
                              },
                            },
                            latitude: { type: "number" },
                            longitude: { type: "number" },
                            distanceKm: { type: ["number", "null"] },
                            distanceFromUserKm: { type: ["number", "null"] },
                            enigmaCount: { type: "integer" },
                            hasTreasure: { type: "boolean" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Paramètres géoloc invalides." },
          },
        },
      },
      "/api/game/adventures/{id}": {
        get: {
          tags: ["Jeu"],
          summary: "Détail mobile \"safe\" d’une aventure",
          description:
            "Détail public d’une aventure active, incluant énigmes et trésor " +
            "sans exposer les champs sensibles : réponses d’énigmes (`answer`), ni les codes trésor " +
            "(`mapRevealCode`, `chestCode`, variantes — validés uniquement via POST `/api/game/validate-treasure`).",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Détail aventure.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["id", "name", "city", "enigmas", "updatedAt"],
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { description: "JSON riche stocké en base." },
                      city: { type: "object", additionalProperties: true },
                      coverImageUrl: { type: ["string", "null"] },
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                      distanceKm: { type: ["number", "null"] },
                      physicalBadgeStockCount: { type: "integer" },
                      enigmas: { type: "array", items: { type: "object", additionalProperties: true } },
                      treasure: { type: ["object", "null"], additionalProperties: true },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "id manquant ou invalide." },
            "404": { description: "Aventure introuvable ou inactive." },
          },
        },
      },
      "/api/game/cities": {
        get: {
          tags: ["Jeu"],
          summary: "Référentiel villes pour app mobile",
          description:
            "Liste de villes pour filtres/autocomplete. " +
            "`activeOnly=true` (défaut) limite aux villes ayant au moins une aventure active.",
          parameters: [
            { name: "q", in: "query", required: false, schema: { type: "string" } },
            {
              name: "activeOnly",
              in: "query",
              required: false,
              schema: { type: "boolean", default: true },
            },
          ],
          responses: {
            "200": {
              description: "Liste des villes.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["cities"],
                    properties: {
                      cities: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["id", "name", "postalCodes", "activeAdventureCount"],
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            inseeCode: { type: ["string", "null"] },
                            postalCodes: { type: "array", items: { type: "string" } },
                            latitude: { type: ["number", "null"] },
                            longitude: { type: ["number", "null"] },
                            population: { type: ["integer", "null"] },
                            activeAdventureCount: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/game/progress": {
        get: {
          tags: ["Jeu"],
          summary: "État serveur de progression",
          description:
            "Retourne les étapes validées, les métadonnées d’aventure utilisateur et ce qui manque pour une terminaison en succès. " +
            "Aucun secret de jeu (codes, réponses) n’est exposé.\n\n" +
            `**Rate limit** : ~120 requêtes / minute / clé. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "adventureId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Identifiant Prisma de l’aventure.",
            },
          ],
          responses: {
            "200": {
              description: "État de synchro pour l’utilisateur courant.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ProgressPayload" } } },
            },
            "400": {
              description: "`adventureId` manquant.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } } },
            },
            "401": { description: "Non connecté." },
            "404": { description: "Aventure introuvable ou inactive (`status === false`)." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/game/validate-enigma": {
        post: {
          tags: ["Jeu"],
          summary: "Valider une réponse d’énigme",
          description:
            "Valide dans l’ordre (1…n). Enregistre `UserAdventureStepValidation` en cas de succès.\n\n" +
            "**Corps JSON** : `adventureId`, `userId` (doit correspondre à la session), `enigmaNumber` (entier ≥ 1), `submission` (≤ 500 car.).\n\n" +
            `**Rate limit** : ~80 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId", "enigmaNumber", "submission"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    enigmaNumber: {
                      oneOf: [{ type: "integer", minimum: 1 }, { type: "string", description: "Entier parsable" }],
                    },
                    submission: { type: "string", maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Énigme validée (ou déjà validée).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ValidateEnigmaOk" } } },
            },
            "400": {
              description: "Corps invalide, ordre des énigmes, réponse incorrecte, soumission trop longue.",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session absente ou `userId` ≠ utilisateur connecté." },
            "404": { description: "Aventure ou énigme introuvable / inactive." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/game/validate-treasure": {
        post: {
          tags: ["Jeu"],
          summary: "Valider le trésor (carte puis coffre)",
          description:
            "**Prérequis** : toutes les énigmes doivent être validées (`validate-enigma`).\n\n" +
            "**Deux étapes** (même route, soumissions successives) :\n" +
            "1. **Révélation sur la carte** : le joueur envoie le code de **fin d’énigme** (`Treasure.mapRevealCode`, variante `mapRevealCodeAlt`). Réponse `stepKey` : `treasure:map`.\n" +
            "2. **Code dans le coffre** : ensuite le code **physique** (`Treasure.chestCode`, variante `chestCodeAlt`). Réponse `stepKey` : `treasure`.\n\n" +
            "**Corps** : `adventureId`, `userId`, `code` (≤ 120 car.), optionnellement `phase` : `\"map\"` | `\"chest\"`, et **`giftNumber`** (entier ≥ 0) au moment du **code coffre** : nombre indiqué par le joueur.\n\n" +
            "À l’étape coffre, la route exécute **`processGameFinish`** (succès, `giftNumber`, badges virtuels, instance badge physique si stock).\n\n" +
            "Si `phase` est omis, le serveur en déduit une : carte d’abord, puis coffre.\n\n" +
            "**Anciennes parties** (seule clé `treasure`) : une reprise envoie `giftNumber` si la ligne `UserAdventures` n’était pas encore en succès.\n\n" +
            "Chaque aventure prévue avec **trésor** : la finalisation (badges, `UserAdventures`) se fait **uniquement** à l’étape coffre de cette route.\n\n" +
            `**Rate limit** : ~40 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId", "code"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    phase: {
                      type: "string",
                      enum: ["map", "chest"],
                      description:
                        "Optionnel : force l’étape. Sinon déduction automatique (carte si pas encore `treasure:map`, sinon coffre).",
                    },
                    code: {
                      type: "string",
                      maxLength: 120,
                      description:
                        "Saisie joueur comparée aux codes trésor attendus pour l’étape (carte ou coffre), avec normalisation.",
                    },
                    giftNumber: {
                      type: "integer",
                      minimum: 0,
                      description:
                        "À fournir avec le **code coffre** (ou legacy) : nombre de badge(s) / cadeau côté joueur (voir logique stock physique dans `processGameFinish`).",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Carte : `treasure:map` seulement. Coffre : `treasure` + finalisation (`awardedUserBadgeIds`, `message` si première fois).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ValidateTreasureOk" } } },
            },
            "400": {
              description: "Énigmes incomplètes, code faux, pas de trésor configuré, code trop long, etc.",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session ou concordance `userId`." },
            "404": { description: "Aventure introuvable ou inactive." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-review": {
        post: {
          tags: ["Jeu"],
          summary: "Avis et signalements fin de parcours",
          description:
            "Crée ou met à jour un avis (unicité logique utilisateur × aventure). " +
            "URL réelle du handler App Router : dossier `adventure-review` (kebab-case).\n\n" +
            "**JSON** (`application/json`) : `adventureId`, `userId`, `rating` (1–5, optionnel), `content`, `image` (URL optionnelle), " +
            "`consentCommunicationNetworks`, `reportsMissingBadge`, `reportsStolenTreasure` (booléens stricts : `true` seulement compte comme vrai).\n\n" +
            "**Multipart** (`multipart/form-data`) : mêmes champs en champs texte + fichier **`photo`** (ou **`image`**) pour envoyer **photo + avis en une requête** ; " +
            "JPEG, PNG ou WebP, max 5 Mo ; l’URL publique est renvoyée côté serveur (`/uploads/reviews/...`). " +
            "Optionnel : **`imageUrl`** si l’image est déjà hébergée ailleurs.\n\n" +
            "Les avis **affichés publiquement** via `GET /api/game/adventure-reviews` le sont uniquement lorsque `moderationStatus` est `APPROVED` (côté base / modération).\n\n" +
            `**Rate limit** : selon déploiement. ${RATE_LIMIT_NOTE}`,
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    rating: { description: "1–5 ou omis / null pour pas de note." },
                    content: { type: "string", maxLength: 10000 },
                    image: { type: ["string", "null"], description: "Optionnel — URL ou identifiant selon implémentation." },
                    consentCommunicationNetworks: { type: "boolean" },
                    reportsMissingBadge: { type: "boolean" },
                    reportsStolenTreasure: { type: "boolean" },
                  },
                  additionalProperties: true,
                },
              },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    rating: { type: "string", description: "1–5 ou vide pour pas de note." },
                    content: { type: "string", maxLength: 10000 },
                    photo: {
                      type: "string",
                      format: "binary",
                      description: "Photo d’avis (alias accepté : champ `image`).",
                    },
                    imageUrl: {
                      type: "string",
                      description: "Si l’image n’est pas envoyée en fichier mais déjà en URL.",
                    },
                    consentCommunicationNetworks: {
                      type: "string",
                      description: "Vrai si `true`, `1`, `on`, `yes` (insensible à la casse).",
                    },
                    reportsMissingBadge: { type: "string" },
                    reportsStolenTreasure: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Avis enregistré.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AdventureReviewOk" } } },
            },
            "400": {
              description: "Validation avis (note, contenu trop long, avis vide).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } } },
            },
            "404": { description: "Aventure introuvable." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-reviews": {
        get: {
          tags: ["Jeu"],
          summary: "Liste des avis publics (modérés)",
          description:
            "Retourne uniquement les avis avec **moderationStatus = APPROVED** pour une aventure active. " +
            "Pas d’identifiant utilisateur brut : `authorDisplayName` est dérivé du prénom / premier mot du nom.",
          parameters: [
            {
              name: "adventureId",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 0, default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Liste paginée.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/AdventureReviewPublicListResponse" } },
              },
            },
            "400": { description: "`adventureId` manquant." },
            "404": { description: "Aventure introuvable ou inactive." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-reviews/{id}": {
        get: {
          tags: ["Jeu"],
          summary: "Détail d’un avis public",
          description: "Uniquement si l’avis est **APPROVED** et l’aventure encore active.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/AdventureReviewPublicDetail" } },
              },
              description: "Avis publié.",
            },
            "404": { description: "Avis introuvable, non approuvé ou aventure inactive." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/advertisements": {
        get: {
          tags: ["Publicités"],
          summary: "Liste des publicités éligibles",
          description:
            "**Publique** (pas de session requise). Filtre actif / dates / placement / géolocalisation via `filterEligibleAdvertisements`.",
          parameters: [
            {
              name: "placement",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Clé d’emplacement configurée côté admin.",
            },
            {
              name: "cityId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "latitude",
              in: "query",
              required: false,
              schema: { type: "number" },
            },
            {
              name: "longitude",
              in: "query",
              required: false,
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": {
              content: { "application/json": { schema: { $ref: "#/components/schemas/AdvertisementListResponse" } } },
              description: "Liste filtrée et ordonnée.",
            },
            "400": {
              description: "`placement` manquant ou coordonnées non numériques.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } } },
            },
          },
        },
      },
      "/api/advertisements/events": {
        post: {
          tags: ["Publicités"],
          summary: "Événement impression ou clic",
          description:
            "**Sans session obligatoire** : `userId` en base peut être null. " +
            "Enregistre une ligne analytics si la publicité existe et est `active`.\n\n" +
            `**Rate limit** : ~200 req/min (IP + user si connecté). ${RATE_LIMIT_NOTE}`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["advertisementId", "type"],
                  properties: {
                    advertisementId: { type: "string" },
                    type: { type: "string", enum: ["IMPRESSION", "CLICK"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Événement stocké.",
              content: {
                "application/json": {
                  schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean", const: true } } },
                },
              },
            },
            "400": { description: "Corps invalide ou publicité inactive." },
            "404": { description: "Publicité introuvable." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/user/badges": {
        get: {
          tags: ["Utilisateur"],
          summary: "Badges du joueur connecté",
          description: "Collection `UserBadge` avec définitions associées, tri décroissant par `earnedAt`.",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": {
              content: { "application/json": { schema: { $ref: "#/components/schemas/UserBadgesResponse" } } },
              description: "Liste des badges.",
            },
            "401": { description: "Non connecté." },
          },
        },
      },
      "/api/admin-game/permission-context": {
        get: {
          tags: ["Admin"],
          summary: "Rôle du sujet « permission »",
          description:
            "Utilisé par le proxy dashboard : retourne le `role` Prisma du **permission subject** " +
            "(compte réel sous impersonation é eventuelle). Ne remplace pas les contrôles d’autorisation sur chaque action.",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": {
              content: { "application/json": { schema: { $ref: "#/components/schemas/PermissionContextOk" } } },
              description: "Rôle disponible.",
            },
            "401": {
              description: "`unauthorized` — pas de sujet permission ou utilisateur sans rôle.",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { error: { type: "string", example: "unauthorized" } } },
                },
              },
            },
          },
        },
      },
      "/api/uploads/{path}": {
        get: {
          tags: ["Fichiers"],
          summary: "Servir un fichier uploadé",
          description:
            "**Important** : la route Next.js est un **catch-all** `[...path]`. " +
            "L’URL réelle peut comporter **plusieurs** segments après `/api/uploads/` (ex. `branding/logo.png`). " +
            "Ce modèle OpenAPI ne montre qu’un paramètre unique pour simplifier ; concaténez les segments dans l’URL HTTP réelle.\n\n" +
            "Réponses binaires avec `Content-Type` selon l’extension (.jpg, .png, .webp, …). " +
            "Chemins avec `..`, caractères nuls ou traversée hors `uploads/` → **400**.",
          parameters: [
            {
              name: "path",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Voir note ci-dessus (catch-all multi-segments).",
            },
          ],
          responses: {
            "200": { description: "Contenu fichier.", content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } } },
            "400": { description: "Segments invalides." },
            "404": { description: "Fichier absent." },
          },
        },
      },
    },
  };
}

export type GrandEstOpenApiDocument = ReturnType<typeof buildGrandEstOpenApiDocument>;
