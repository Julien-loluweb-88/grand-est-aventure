/**
 * Spécification OpenAPI 3.1 de toutes les routes HTTP exposées par l’app Next.js.
 * À maintenir quand vous ajoutez ou modifiez un handler sous src/app/api/ (fichiers route.ts).
 *
 * Sécurité doc : page /admin-game/dashboard/docs/api (+ JSON /api/openapi) réservées
 * aux sessions avec accès dashboard ; Swagger UI avec « Try it out » désactivé
 * pour éviter toute exécution accidentelle vers la prod. Le JSON /api/openapi exige
 * la même session admin que le dashboard.
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
      { name: "Jeu", description: "Progression aventure, validation énigmes / trésor, fin de parcours, avis." },
      { name: "Publicités", description: "Liste des encarts et événements analytics (impressions / clics)." },
      { name: "Utilisateur", description: "Données liées au compte connecté." },
      { name: "Admin", description: "Contexte rôle pour le tableau de bord (proxy d’administration)." },
      { name: "Fichiers", description: "Fichiers publics du dossier `uploads/`." },
      { name: "Authentification", description: "Handler Better Auth (login, OAuth, session, etc.)." },
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
            stepKey: { type: "string", example: "treasure" },
            alreadyValidated: { type: "boolean" },
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
        FinishOk: {
          type: "object",
          required: ["message", "awardedUserBadgeIds"],
          properties: {
            message: { type: "string", example: "Aventure terminée avec succès" },
            awardedUserBadgeIds: { type: "array", items: { type: "string" } },
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
      "/api/game/progress": {
        get: {
          tags: ["Jeu"],
          summary: "État serveur de progression",
          description:
            "Retourne les étapes validées, les métadonnées d’aventure utilisateur et ce qui manque pour un finish en succès. " +
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
          summary: "Valider le code trésor",
          description:
            "Exige que toutes les énigmes soient validées au préalable. Compare le code normalisé avec `code` et éventuellement `safeCode` côté trésor.\n\n" +
            "**Corps** : `adventureId`, `userId`, `code` (≤ 120 car.).\n\n" +
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
                    code: { type: "string", maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Trésor validé.",
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
      "/api/game/finish": {
        post: {
          tags: ["Jeu"],
          summary: "Terminer une aventure (badges, état userAdventure)",
          description:
            "Transaction serveur via `processGameFinish`. Exige que la progression serveur soit complète avant un `success: true` " +
            "(sinon erreur avec code métier).\n\n" +
            "**Corps** : `adventureId`, `userId`, `success` (booléen), `giftNumber` (optionnel, nombre).\n\n" +
            `**Rate limit** : ~40 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId", "success"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    success: { type: "boolean" },
                    giftNumber: { type: "number", description: "Optionnel — cadeau côté client si applicable." },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Traitement terminé.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/FinishOk" } } },
            },
            "400": {
              description: "Paramètres invalides ou progression incomplète (`GameFinishProgressError`).",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/GameFinishErrorProgress" }],
                  },
                },
              },
            },
            "401": { description: "Session / `userId`." },
            "404": { description: "Aventure introuvable." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/AdventureReview": {
        post: {
          tags: ["Jeu"],
          summary: "Avis et signalements fin de parcours",
          description:
            "Crée ou met à jour un avis (unicité logique utilisateur × aventure). " +
            "**Champs** : `adventureId`, `userId`, `rating` (1–5, chaîne ou nombre, optionnel), `content` (string), " +
            "`consentCommunicationNetworks`, `reportsMissingBadge`, `reportsStolenTreasure` (booléens JSON stricts : `true` seulement compte comme vrai).\n\n" +
            `**Rate limit** : ~20 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
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
                    consentCommunicationNetworks: { type: "boolean" },
                    reportsMissingBadge: { type: "boolean" },
                    reportsStolenTreasure: { type: "boolean" },
                  },
                  additionalProperties: true,
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
            "401": { description: "Session / `userId`." },
            "404": { description: "Aventure introuvable." },
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
    },
  };
}

export type GrandEstOpenApiDocument = ReturnType<typeof buildGrandEstOpenApiDocument>;
