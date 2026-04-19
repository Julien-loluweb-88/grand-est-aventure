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

/** Audience `PUBLIC` / `DEMO` sur `Adventure` — rappel pour les routes jeu. */
const ADVENTURE_AUDIENCE_DEMO =
  " **Aventures démo** (`Adventure.audience = DEMO`) : absentes du catalogue et du comptage villes « actives » ; " +
  "accès détail / jeu / avis / POI découverte filtrés réservés aux **admin / superadmin** ou aux comptes autorisés (`AdventureDemoAccess`). Sinon **404**.";

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
        "### Aventures publiques vs démo (audience)",
        "Chaque aventure a un champ **`audience`** en base : `PUBLIC` ou `DEMO` (voir Prisma `AdventureAudience`).",
        "- **`PUBLIC`** et **`status: true`** : visibles dans **`GET /api/game/adventures`**, comptées pour **`activeAdventureCount`** dans **`GET /api/game/cities`** (`activeOnly` par défaut), détail **`GET /api/game/adventures/{id}`** accessible **sans session**.",
        "- **`DEMO`** : **hors catalogue** ; le détail, la progression, les validations, les avis publics et les points de découverte (filtrage côté serveur) exigent une **session** et un **accès autorisé** : rôles **admin** ou **superadmin**, ou compte présent dans la table **`AdventureDemoAccess`** (gérée depuis la fiche admin). Sinon les réponses sont **404** (comportement « introuvable »).",
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
      {
        name: "Jeu",
        description:
          "Découverte (catalogue, villes), progression, validation, fin de parcours, avis. " +
          "Les aventures **démo** (`audience = DEMO`) sont exclues du catalogue ; accès restreint (voir section **Aventures publiques vs démo** dans la description OpenAPI).",
      },
      { name: "Publicités", description: "Liste des encarts et événements analytics (impressions / clics)." },
      {
        name: "Offres partenaires",
        description:
          "Demandes joueur et validation commerçant (badges partenaires) — en pratique consommé par l’app mobile avec session Better Auth.",
      },
      { name: "Utilisateur", description: "Données liées au compte connecté." },
      { name: "Cron", description: "Tâches planifiées (secret Bearer)." },
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
        PartnerOfferClaimCreateResponse: {
          type: "object",
          required: ["claimId"],
          properties: { claimId: { type: "string" } },
        },
        MerchantPartnerClaimResolveOkResponse: {
          type: "object",
          required: ["status", "awardedUserBadge"],
          properties: {
            status: { type: "string", enum: ["APPROVED", "REJECTED"] },
            awardedUserBadge: {
              type: "boolean",
              description: "Vrai si une nouvelle ligne `UserBadge` a été créée (première fois pour ce badge).",
            },
          },
        },
        MerchantPartnerClaimsListResponse: {
          type: "object",
          required: ["claims"],
          properties: {
            claims: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "id",
                  "advertisementId",
                  "status",
                  "createdAt",
                  "resolvedAt",
                  "rejectionReason",
                  "player",
                  "advertisement",
                ],
                properties: {
                  id: { type: "string" },
                  advertisementId: { type: "string" },
                  status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] },
                  createdAt: { type: "string", format: "date-time" },
                  resolvedAt: { type: ["string", "null"], format: "date-time" },
                  rejectionReason: { type: ["string", "null"] },
                  player: {
                    type: "object",
                    required: ["id", "name", "email"],
                    properties: {
                      id: { type: "string" },
                      name: { type: ["string", "null"] },
                      email: { type: ["string", "null"] },
                    },
                  },
                  advertisement: {
                    type: "object",
                    required: [
                      "id",
                      "name",
                      "advertiserName",
                      "title",
                      "badgeTitle",
                      "badgeImageUrl",
                    ],
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      advertiserName: { type: ["string", "null"] },
                      title: { type: ["string", "null"] },
                      badgeTitle: { type: ["string", "null"] },
                      badgeImageUrl: {
                        type: ["string", "null"],
                        description: "Comme `partnerOffer.badgeImageUrl` sur `GET /api/advertisements`.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        PartnerOfferClaimsListResponse: {
          type: "object",
          required: ["claims", "summaryByAdvertisementId"],
          properties: {
            claims: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "id",
                  "advertisementId",
                  "status",
                  "createdAt",
                  "resolvedAt",
                  "rejectionReason",
                  "advertiserName",
                  "advertisementTitle",
                  "badgeTitle",
                  "badgeImageUrl",
                ],
                properties: {
                  id: { type: "string" },
                  advertisementId: { type: "string" },
                  status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] },
                  createdAt: { type: "string", format: "date-time" },
                  resolvedAt: { type: ["string", "null"], format: "date-time" },
                  rejectionReason: { type: ["string", "null"] },
                  advertiserName: { type: ["string", "null"] },
                  advertisementTitle: { type: ["string", "null"] },
                  badgeTitle: { type: ["string", "null"] },
                  badgeImageUrl: {
                    type: ["string", "null"],
                    description: "Même règle que `partnerOffer.badgeImageUrl` sur `GET /api/advertisements`.",
                  },
                },
              },
            },
            summaryByAdvertisementId: {
              type: "object",
              additionalProperties: {
                type: "object",
                required: ["pending", "approvedCount"],
                properties: {
                  pending: { type: "boolean" },
                  approvedCount: { type: "integer" },
                },
              },
            },
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
                required: [
                  "id",
                  "title",
                  "body",
                  "imageUrl",
                  "targetUrl",
                  "advertiserName",
                  "sortOrder",
                  "partnerOffer",
                ],
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  body: { type: "string" },
                  imageUrl: { type: ["string", "null"] },
                  targetUrl: { type: ["string", "null"] },
                  advertiserName: { type: ["string", "null"] },
                  sortOrder: { type: "integer" },
                  partnerOffer: {
                    type: ["object", "null"],
                    description:
                      "Présent si un badge partenaire est configuré : `open` = nouvelles demandes acceptées.",
                    properties: {
                      open: { type: "boolean" },
                      maxRedemptionsPerUser: { type: "integer" },
                      badgeTitle: { type: ["string", "null"] },
                      badgeImageUrl: {
                        type: ["string", "null"],
                        description:
                          "URL du visuel du badge (dédié ou, à défaut, même valeur que `imageUrl` de l’encart).",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        GameAvatarItem: {
          type: "object",
          required: ["id", "slug", "name", "sortOrder"],
          properties: {
            id: { type: "string", description: "Identifiant Prisma (à envoyer dans PATCH préférence)." },
            slug: {
              type: "string",
              description:
                "Clé stable pour le bundle app (ex. `companion_fox` → fichier local `…/companion_fox.glb`).",
            },
            name: { type: "string", description: "Libellé affiché dans les paramètres." },
            thumbnailUrl: { type: ["string", "null"], description: "Aperçu optionnel (URL)." },
            modelUrl: {
              type: ["string", "null"],
              description:
                "URL absolue ou chemin `/uploads/…` du **.glb** hébergé par l’admin ; si `null`, l’app utilise le modèle embarqué (`slug`).",
            },
            sortOrder: { type: "integer" },
          },
        },
        GameAvatarsResponse: {
          type: "object",
          required: ["avatars"],
          properties: {
            avatars: { type: "array", items: { $ref: "#/components/schemas/GameAvatarItem" } },
          },
        },
        UserAvatarPreferenceResponse: {
          type: "object",
          required: ["selectedAvatarId"],
          properties: {
            selectedAvatarId: { type: ["string", "null"] },
            selectedAvatar: { oneOf: [{ type: "null" }, { $ref: "#/components/schemas/GameAvatarItem" }] },
          },
        },
        UserAvatarPatchBody: {
          type: "object",
          required: ["selectedAvatarId"],
          properties: {
            selectedAvatarId: {
              oneOf: [{ type: "string" }, { type: "null" }],
              description: "Id Prisma d’un avatar actif, ou `null` pour effacer le choix.",
            },
          },
        },
        UserAvatarPatchOk: {
          type: "object",
          required: ["ok", "selectedAvatarId", "selectedAvatar"],
          properties: {
            ok: { type: "boolean", const: true },
            selectedAvatarId: { type: ["string", "null"] },
            selectedAvatar: { oneOf: [{ type: "null" }, { $ref: "#/components/schemas/GameAvatarItem" }] },
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
            "Filtres disponibles : ville, recherche textuelle, géolocalisation + rayon, pagination. " +
            "Inclut uniquement les aventures **`status: true`** et **`audience: PUBLIC`**. " +
            "Chaque entrée peut inclure **`estimatedDurationSeconds`** (heuristique admin : marche + énigmes + trésor), " +
            "**`averagePlayDurationSeconds`** et **`playDurationSampleCount`** (moyenne temps réel après assez de parties — alimentées par le cron). " +
            ADVENTURE_AUDIENCE_DEMO,
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
                            estimatedDurationSeconds: {
                              type: ["integer", "null"],
                              description:
                                "Secondes — estimation éditoriale (itinéraire + énigmes + trésor), recalculée côté serveur au sync parcours.",
                            },
                            averagePlayDurationSeconds: {
                              type: ["integer", "null"],
                              description:
                                "Secondes — moyenne des durées de sessions joueurs terminées avec succès (≥ 5 parties) ; null sinon.",
                            },
                            playDurationSampleCount: {
                              type: "integer",
                              description: "Nombre de sessions terminées avec succès prises en compte pour la moyenne.",
                            },
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
            "sans exposer les champs sensibles : pas de `answer` / `correctAnswers` ; les codes trésor " +
            "(`mapRevealCode`, `chestCode`, variantes) ne sont jamais renvoyés — validés uniquement via POST `/api/game/validate-treasure`. " +
            "Chaque énigme inclut notamment **`choice`** (libellés QCM), **`uniqueResponse`**, **`multiSelect`** : si `multiSelect` est true, " +
            "le joueur envoie **`submissions`** (tableau) à POST `/api/game/validate-enigma` ; sinon **`submission`** (chaîne). " +
            "Inclut **`discoveryPoints`** : tous les POI / badges « découverte » de la **ville** de l’aventure " +
            "(équivalent à `GET /api/game/discovery-points?cityId=` avec l’id ville renvoyé dans `city.id`). " +
            "**Durées** : `estimatedDurationSeconds` (heuristique), `averagePlayDurationSeconds` / `playDurationSampleCount` (stats réelles via cron). " +
            "Pour une aventure **`DEMO`**, session requise + droit d’accès ; sinon **404**." +
            ADVENTURE_AUDIENCE_DEMO,
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
                    required: ["id", "name", "city", "enigmas", "discoveryPoints", "updatedAt"],
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { description: "JSON riche stocké en base." },
                      city: { type: "object", additionalProperties: true },
                      coverImageUrl: { type: ["string", "null"] },
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                      distanceKm: { type: ["number", "null"] },
                      estimatedDurationSeconds: {
                        type: ["integer", "null"],
                        description: "Estimation durée de parcours (secondes), même règle que le catalogue.",
                      },
                      averagePlayDurationSeconds: {
                        type: ["integer", "null"],
                        description: "Moyenne durée réelle (secondes) si assez de données.",
                      },
                      playDurationSampleCount: {
                        type: "integer",
                        description: "Nombre de parties terminées avec succès dans le calcul moyenne.",
                      },
                      physicalBadgeStockCount: { type: "integer" },
                      enigmas: { type: "array", items: { type: "object", additionalProperties: true } },
                      treasure: { type: ["object", "null"], additionalProperties: true },
                      discoveryPoints: {
                        type: "array",
                        description:
                          "POI découverte de la ville (`city.id`) — même structure que les éléments de `GET /api/game/discovery-points`.",
                        items: {
                          type: "object",
                          required: [
                            "id",
                            "cityId",
                            "adventureId",
                            "title",
                            "latitude",
                            "longitude",
                            "radiusMeters",
                            "imageUrl",
                            "sortOrder",
                          ],
                          properties: {
                            id: { type: "string" },
                            cityId: { type: "string" },
                            adventureId: { type: ["string", "null"] },
                            title: { type: "string" },
                            teaser: { type: ["string", "null"] },
                            latitude: { type: "number" },
                            longitude: { type: "number" },
                            radiusMeters: { type: "integer" },
                            imageUrl: { type: ["string", "null"] },
                            sortOrder: { type: "integer" },
                          },
                        },
                      },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "id manquant ou invalide." },
            "404": {
              description:
                "Aventure introuvable, inactive, ou **démo** sans session / sans accès autorisé.",
            },
          },
        },
      },
      "/api/game/cities": {
        get: {
          tags: ["Jeu"],
          summary: "Référentiel villes pour app mobile",
          description:
            "Liste de villes pour filtres/autocomplete. " +
            "`activeOnly=true` (défaut) limite aux villes ayant au moins une aventure **publique** active (`audience: PUBLIC` et `status: true`). " +
            "Les seules aventures **démo** ne font pas passer une ville en « active » pour ce compteur.",
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
      "/api/game/avatars": {
        get: {
          tags: ["Jeu"],
          summary: "Catalogue avatars (compagnon 3D)",
          description:
            "Liste **publique** des avatars **`isActive`** (métadonnées). Si **`modelUrl`** est renseigné, l’app peut charger ce **.glb** depuis le serveur ; sinon repli sur le bundle local via **`slug**.",
          responses: {
            "200": {
              description: "Liste triée par `sortOrder`.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/GameAvatarsResponse" } },
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
            "Aucun secret de jeu (codes, réponses) n’est exposé. " +
            "Aventure **démo** : accès réservé aux utilisateurs autorisés (même règle que le détail aventure).\n\n" +
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
            "404": {
              description:
                "Aventure introuvable, inactive, ou **démo** sans droit d’accès pour l’utilisateur connecté.",
            },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/game/start-adventure": {
        post: {
          tags: ["Jeu"],
          summary: "Démarrer une partie (session de jeu)",
          description:
            "Crée une session `UserAdventurePlaySession` en **IN_PROGRESS** si aucune n’existe encore — à appeler au clic « Commencer » **avant** la première `validate-enigma`.\n\n" +
            "Idempotent : si une session est déjà ouverte, **200** avec `sessionCreated: false`, `alreadyInProgress: true`.\n\n" +
            "**Corps** : `adventureId`, `userId` (= session).\n\n" +
            "Refusé (**400** `EMPTY_ADVENTURE`) si l’aventure n’a **ni** énigme **ni** trésor.\n\n" +
            "Aventure **démo** : même contrôle d’accès que `validate-enigma`.\n\n" +
            `**Rate limit** : ~40 req/min. ${RATE_LIMIT_NOTE}`,
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
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "`sessionCreated` : nouvelle ligne créée ; `alreadyInProgress` : session déjà en cours.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "sessionCreated", "alreadyInProgress"],
                    properties: {
                      ok: { type: "boolean", const: true },
                      sessionCreated: { type: "boolean" },
                      alreadyInProgress: { type: "boolean" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Corps invalide ou aventure vide (`EMPTY_ADVENTURE`).",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session absente ou `userId` ≠ utilisateur connecté." },
            "404": {
              description:
                "Aventure introuvable / inactive, ou aventure **démo** sans accès pour ce compte.",
            },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/game/discovery-points": {
        get: {
          tags: ["Jeu"],
          summary: "Points de découverte (carte)",
          description:
            "Liste les POI d’exploration pour une ville (`cityId`). " +
            "Inclut les points **ville seule** et ceux **rattachés à une aventure** (`adventureId` non null dans chaque élément). " +
            "Les POI liés à une aventure **démo** ne sont renvoyés que si la session a le **droit** de voir cette aventure (sinon exclus de la liste). " +
            "Sans session : uniquement POI ville et POI d’aventures **publiques** actives.",
          parameters: [
            {
              name: "cityId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Identifiant `City`.",
            },
          ],
          responses: {
            "200": {
              description: "Liste ordonnée des points.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["points"],
                    properties: {
                      points: {
                        type: "array",
                        items: {
                          type: "object",
                          required: [
                            "id",
                            "cityId",
                            "adventureId",
                            "title",
                            "latitude",
                            "longitude",
                            "radiusMeters",
                            "imageUrl",
                            "sortOrder",
                          ],
                          properties: {
                            id: { type: "string" },
                            cityId: { type: "string" },
                            adventureId: { type: ["string", "null"] },
                            title: { type: "string" },
                            teaser: { type: ["string", "null"] },
                            latitude: { type: "number" },
                            longitude: { type: "number" },
                            radiusMeters: { type: "integer" },
                            imageUrl: { type: ["string", "null"] },
                            sortOrder: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "`cityId` manquant.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorMessage" } } },
            },
            "404": { description: "Ville inconnue." },
          },
        },
      },
      "/api/game/claim-discovery": {
        post: {
          tags: ["Jeu"],
          summary: "Réclamer un badge de point de découverte",
          description:
            "Vérifie la **proximité** (Haversine, rayon `radiusMeters`) et les règles : " +
            "point sans aventure = tout joueur connecté ; point lié à une aventure = au moins une ligne `UserAdventures` pour cette aventure ; " +
            "si l’aventure est **démo**, le compte doit aussi avoir le **droit** d’y accéder (admin / liste blanche).\n\n" +
            "**Corps** : `userId` (= session), `discoveryPointId`, `latitude`, `longitude` (position client).\n\n" +
            `**Rate limit** : ~40 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "discoveryPointId", "latitude", "longitude"],
                  properties: {
                    userId: { type: "string" },
                    discoveryPointId: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "`ok`, `userBadgeId`, éventuellement `alreadyHad`.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "userBadgeId"],
                    properties: {
                      ok: { type: "boolean", const: true },
                      userBadgeId: { type: "string" },
                      alreadyHad: { type: "boolean" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Trop loin, aventure non démarrée, corps invalide.",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session ou `userId` incohérent." },
            "404": {
              description:
                "Point introuvable, aventure inactive, ou **démo** sans accès pour ce compte.",
            },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/validate-enigma": {
        post: {
          tags: ["Jeu"],
          summary: "Valider une réponse d’énigme",
          description:
            "Valide dans l’ordre (1…n). Enregistre `UserAdventureStepValidation` en cas de succès.\n\n" +
            "Si l’énigme a **`multiSelect: true`** (QCM à cases à cocher) : corps avec **`submissions`** (tableau de libellés de choix sélectionnés) ; l’ensemble doit coïncider avec les bonnes réponses (ordre indifférent, normalisation casse / espaces).\n\n" +
            "Sinon : **`submission`** (chaîne, ≤ 500 car.) — une bonne réponse ou saisie libre.\n\n" +
            "**Corps JSON** : `adventureId`, `userId` (session), `enigmaNumber` (entier ≥ 1), puis `submission` **ou** `submissions` selon `GET …/adventures/{id}` → `enigmas[].multiSelect`.\n\n" +
            "Aventure **démo** : même contrôle d’accès que le détail (`audience = DEMO`).\n\n" +
            `**Rate limit** : ~80 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["adventureId", "userId", "enigmaNumber"],
                  properties: {
                    adventureId: { type: "string" },
                    userId: { type: "string" },
                    enigmaNumber: {
                      oneOf: [{ type: "integer", minimum: 1 }, { type: "string", description: "Entier parsable" }],
                    },
                    submission: {
                      type: "string",
                      maxLength: 500,
                      description: "Réponse simple (QCM une option ou texte libre).",
                    },
                    submissions: {
                      type: "array",
                      maxItems: 30,
                      items: { type: "string", maxLength: 500 },
                      description: "Obligatoire si `multiSelect` sur l’énigme : libellés exacts des choix cochés.",
                    },
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
              description:
                "Corps invalide, ordre des énigmes, mauvais champ `submission` / `submissions`, réponse incorrecte (`WRONG_ANSWER`), codes `SUBMISSIONS_ARRAY_REQUIRED` / `SUBMISSION_STRING_REQUIRED`.",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session absente ou `userId` ≠ utilisateur connecté." },
            "404": {
              description:
                "Aventure ou énigme introuvable / inactive, ou aventure **démo** sans accès pour ce compte.",
            },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/game/validate-finish": {
        post: {
          tags: ["Jeu"],
          summary: "Finaliser une aventure sans trésor",
          description:
            "À appeler **après** la dernière énigme validée lorsque l’aventure **n’a pas** de trésor.\n\n" +
            "**Corps JSON** : `adventureId`, `userId` (= session).\n\n" +
            "Exécute `processGameFinish` (badges, `UserAdventures`, durée de session) comme le code coffre de `validate-treasure`.\n\n" +
            "Si l’aventure a un trésor : **400** `TREASURE_REQUIRED` — utiliser `validate-treasure`.\n\n" +
            "Si la partie est déjà en succès : **200** avec `alreadyFinished: true`.\n\n" +
            "Aventure **démo** : même contrôle d’accès que `validate-enigma`.\n\n" +
            `**Rate limit** : ~30 req/min. ${RATE_LIMIT_NOTE}`,
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
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Succès : `stepKey` : `finish`, `awardedUserBadgeIds` si première finalisation, `alreadyFinished` si déjà terminé.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      stepKey: { type: "string" },
                      alreadyFinished: { type: "boolean" },
                      awardedUserBadgeIds: {
                        type: "array",
                        items: { type: "string" },
                      },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description:
                "Corps invalide, aventure vide (`EMPTY_ADVENTURE`), progression incomplète (`INCOMPLETE_SERVER_PROGRESS`), ou trésor présent (`TREASURE_REQUIRED`).",
              content: {
                "application/json": {
                  schema: { oneOf: [{ $ref: "#/components/schemas/ErrorMessage" }, { $ref: "#/components/schemas/ErrorWithCode" }] },
                },
              },
            },
            "401": { description: "Session absente ou `userId` ≠ utilisateur connecté." },
            "404": {
              description:
                "Aventure introuvable / inactive, ou aventure **démo** sans accès pour ce compte.",
            },
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
            "Aventure **démo** : même contrôle d’accès que `validate-enigma`.\n\n" +
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
            "404": {
              description:
                "Aventure introuvable, inactive, ou **démo** sans accès pour ce compte.",
            },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-partner-lots": {
        get: {
          tags: ["Jeu"],
          summary: "Roue partenaires — état (fin d’aventure)",
          description:
            "Après **succès** sur l’aventure (`UserAdventures.success`), indique si des **lots** actifs existent pour la roue " +
            "(lots liés à **cette aventure** ou à **sa ville** sans aventure).\n\n" +
            "**Réponse** : `legalNotice` (règlement texte : aventure puis repli ville) ; `adventureFinished` ; si `true`, `wheel` vaut `none` (pas de lot), `ready` (segments pour animer la roue), ou `done` (gain déjà tiré, `won` avec dates `validUntil` / `redeemed`).\n\n" +
            `**Rate limit** : ~120 req/min. ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "adventureId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Identifiant de l’aventure jouée.",
            },
          ],
          responses: {
            "200": {
              description: "État roue / lots.",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        type: "object",
                        required: ["adventureFinished", "legalNotice"],
                        properties: {
                          adventureFinished: { type: "boolean", enum: [false] },
                          legalNotice: { type: "string", nullable: true },
                        },
                      },
                      {
                        type: "object",
                        required: [
                          "adventureFinished",
                          "legalNotice",
                          "wheel",
                          "segments",
                          "won",
                        ],
                        properties: {
                          adventureFinished: { type: "boolean", enum: [true] },
                          legalNotice: { type: "string", nullable: true },
                          wheel: {
                            type: "string",
                            enum: ["none", "ready", "done"],
                          },
                          segments: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["id", "title", "partnerName"],
                              properties: {
                                id: { type: "string" },
                                title: { type: "string" },
                                partnerName: { type: "string" },
                              },
                            },
                          },
                          won: {
                            nullable: true,
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              winId: { type: "string" },
                              title: { type: "string" },
                              partnerName: { type: "string" },
                              description: { type: "string", nullable: true },
                              redemptionHint: { type: "string", nullable: true },
                              validFrom: { type: "string", nullable: true },
                              validUntil: { type: "string", nullable: true },
                              redeemedAt: { type: "string", nullable: true },
                              redeemed: { type: "boolean" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": { description: "`adventureId` manquant." },
            "401": { description: "Session requise." },
            "404": { description: "Aventure introuvable, inactive, ou accès refusé." },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-partner-lots/spin": {
        post: {
          tags: ["Jeu"],
          summary: "Roue partenaires — tirage",
          description:
            "Tire **un** lot pour l’utilisateur sur cette aventure (succès requis). **Idempotent** : un second appel renvoie le même gain (`alreadyHadSpin: true`).\n\n" +
            "**Corps** : `adventureId`, `userId` (identique à la session).\n\n" +
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
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Gain attribué ou déjà obtenu.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "alreadyHadSpin", "won"],
                    properties: {
                      ok: { type: "boolean", enum: [true] },
                      alreadyHadSpin: { type: "boolean" },
                      won: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          winId: { type: "string" },
                          title: { type: "string" },
                          partnerName: { type: "string" },
                          description: { type: "string", nullable: true },
                          redemptionHint: { type: "string", nullable: true },
                          validFrom: { type: "string", nullable: true },
                          validUntil: { type: "string", nullable: true },
                          redeemedAt: { type: "string", nullable: true },
                          redeemed: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description:
                "`ADVENTURE_NOT_FINISHED`, `NO_PARTNER_LOTS`, corps invalide, ou concordance `userId`.",
            },
            "401": { description: "Session requise." },
            "404": { description: "Aventure introuvable, inactive, ou accès refusé." },
            "429": { description: "Trop de requêtes." },
            "503": { description: "`SPIN_RETRY` — conflit stock, réessayer." },
          },
        },
      },
      "/api/game/adventure-partner-lots/redeem": {
        post: {
          tags: ["Jeu"],
          summary: "Roue partenaires — validation en magasin",
          description:
            "Le joueur confirme **une fois** en boutique (souvent après accord du commerçant). " +
            "Si déjà validé, **200** avec `alreadyRedeemed: true` (idempotent).\n\n" +
            "**Corps** : `adventureId`, `userId` (identique à la session).\n\n" +
            `**Rate limit** : ~30 req/min. ${RATE_LIMIT_NOTE}`,
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
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Utilisation enregistrée ou déjà enregistrée.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "redeemedAt", "alreadyRedeemed"],
                    properties: {
                      ok: { type: "boolean", enum: [true] },
                      redeemedAt: { type: "string" },
                      alreadyRedeemed: { type: "boolean" },
                    },
                  },
                },
              },
            },
            "400": { description: "`NO_WIN` ou corps invalide." },
            "401": { description: "Session requise." },
            "404": { description: "Aventure introuvable, inactive, ou accès refusé." },
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
            "Route protégée : session requise, et `userId` doit correspondre à l’utilisateur connecté.\n\n" +
            "**JSON** (`application/json`) : `adventureId`, `userId`, `rating` (1–5, optionnel), `content`, `image` (URL optionnelle), " +
            "`consentCommunicationNetworks`, `reportsMissingBadge`, `reportsStolenTreasure` (booléens stricts : `true` seulement compte comme vrai).\n\n" +
            "**Multipart** (`multipart/form-data`) : mêmes champs en champs texte + fichier **`photo`** (ou **`image`**) pour envoyer **photo + avis en une requête** ; " +
            "JPEG, PNG ou WebP, max 5 Mo ; l’URL publique est renvoyée côté serveur (`/uploads/reviews/...`). " +
            "Optionnel : **`imageUrl`** si l’image est déjà hébergée ailleurs.\n\n" +
            "Les avis **affichés publiquement** via `GET /api/game/adventure-reviews` le sont uniquement lorsque `moderationStatus` est `APPROVED` (côté base / modération).\n\n" +
            "Soumission refusée si l’aventure est **démo** et que le compte n’a pas accès.\n\n" +
            `**Rate limit** : selon déploiement. ${RATE_LIMIT_NOTE}`,
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
            "401": { description: "Session absente ou `userId` différent de l’utilisateur connecté." },
            "404": {
              description:
                "Aventure introuvable, ou **démo** sans accès pour ce compte (même message générique que les autres routes jeu).",
            },
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
            "Pas d’identifiant utilisateur brut : `authorDisplayName` est dérivé du prénom / premier mot du nom. " +
            "Pour une aventure **démo**, la session doit avoir le **droit** de voir cette aventure ; sinon **404**.",
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
            "404": {
              description:
                "Aventure introuvable, inactive, ou **démo** sans accès pour l’appelant.",
            },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/game/adventure-reviews/{id}": {
        get: {
          tags: ["Jeu"],
          summary: "Détail d’un avis public",
          description:
            "Uniquement si l’avis est **APPROVED** et l’aventure encore active. " +
            "Si l’aventure est **démo**, session + droit d’accès requis ; sinon **404**.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/AdventureReviewPublicDetail" } },
              },
              description: "Avis publié.",
            },
            "404": {
              description:
                "Avis introuvable, non approuvé, aventure inactive, ou **démo** sans accès.",
            },
            "429": { description: "Trop de requêtes." },
          },
        },
      },
      "/api/advertisements": {
        get: {
          tags: ["Publicités"],
          summary: "Liste des publicités éligibles",
          description:
            "**Publique** (pas de session requise). Pubs `active`, bon `placement`, fenêtre de dates. " +
            "Puis `filterEligibleAdvertisements` : si la pub cible des **villes**, `cityId` doit être dans la liste ; " +
            "si elle définit un **disque** (centre lat/lon + rayon m), le client doit envoyer **latitude et longitude** " +
            "et la distance Haversine doit être ≤ rayon (sinon la pub est exclue). Les deux filtres sont **cumulatifs** si configurés ensemble. " +
            "Si le client envoie la **session** du joueur, les encarts enregistrés comme masqués via `POST /api/user/advertisement-dismissals` sont **exclus**.",
          parameters: [
            {
              name: "placement",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Clé d’emplacement configurée côté admin (ex. home, library).",
            },
            {
              name: "cityId",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Id `City` du référentiel. Requis côté effet si la publicité a des villes cibles : sans `cityId` ou hors liste, la pub est exclue.",
            },
            {
              name: "latitude",
              in: "query",
              required: false,
              schema: { type: "number" },
              description:
                "Latitude joueur (WGS84). Avec `longitude`, sert au filtre disque ; si la pub a un disque et qu’une coordonnée manque, elle est exclue.",
            },
            {
              name: "longitude",
              in: "query",
              required: false,
              schema: { type: "number" },
              description: "Longitude joueur (WGS84). Voir `latitude`.",
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
      "/api/partner-offers/claims": {
        get: {
          tags: ["Offres partenaires"],
          summary: "Mes demandes d’offre",
          description:
            "Joueur connecté : historique récent + résumé par publicité. " +
            `**Rate limit** : ~${120}/min (IP + utilisateur). ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          responses: {
            "200": {
              description:
                "Historique récent : chaque ligne inclut `badgeTitle` et `badgeImageUrl` (repli sur l’image de l’encart) pour l’UI.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/PartnerOfferClaimsListResponse" } },
              },
            },
            "401": { description: "Non authentifié." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
        post: {
          tags: ["Offres partenaires"],
          summary: "Créer une demande de validation",
          description:
            "Corps JSON `{ \"advertisementId\": \"…\" }`. " +
            `**Rate limit** : ~${15}/min (IP + utilisateur). ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["advertisementId"],
                  properties: { advertisementId: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Demande créée.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PartnerOfferClaimCreateResponse" },
                },
              },
            },
            "400": { description: "Offre fermée, plafond atteint ou demande déjà en attente." },
            "401": { description: "Non authentifié." },
            "404": { description: "Publicité introuvable." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/merchant/partner-claims": {
        get: {
          tags: ["Offres partenaires"],
          summary: "Demandes pour mes publicités",
          description:
            "Compte **role = merchant** rattaché à la publicité. Query `status` (défaut PENDING). " +
            "Chaque élément inclut `advertisement.badgeTitle` et `advertisement.badgeImageUrl` (même règle que sur `GET /api/advertisements`).",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] },
            },
          ],
          responses: {
            "200": {
              description: "Liste des demandes (tableau vide si aucune publicité assignée).",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MerchantPartnerClaimsListResponse" },
                },
              },
            },
            "401": { description: "Non authentifié." },
            "403": { description: "Pas un compte commerçant." },
          },
        },
      },
      "/api/merchant/partner-claims/{id}/resolve": {
        post: {
          tags: ["Offres partenaires"],
          summary: "Approuver ou refuser une demande",
          description: "Corps `{ \"action\": \"approve\" | \"reject\", \"rejectionReason\"? }`.",
          security: [{ sessionCookie: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["action"],
                  properties: {
                    action: { type: "string", enum: ["approve", "reject"] },
                    rejectionReason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Traité ; `awardedUserBadge` indique si une nouvelle attribution badge a eu lieu.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MerchantPartnerClaimResolveOkResponse" },
                },
              },
            },
            "400": { description: "Statut ou plafond invalide." },
            "401": { description: "Non authentifié." },
            "403": { description: "Commerçant non autorisé sur cette publicité." },
            "404": { description: "Demande introuvable." },
          },
        },
      },
      "/api/cron/expire-partner-claims": {
        get: {
          tags: ["Cron"],
          summary: "Expire les demandes PENDING > 24 h",
          description: "En-tête `Authorization: Bearer $CRON_SECRET`.",
          parameters: [],
          responses: {
            "200": { description: "`{ expired: number }`" },
            "401": { description: "Secret incorrect." },
            "503": { description: "CRON_SECRET non configuré." },
          },
        },
      },
      "/api/cron/recompute-adventure-durations": {
        get: {
          tags: ["Cron"],
          summary: "Recalcule les durées moyennes de jeu par aventure",
          description:
            "Agrège les sessions `UserAdventurePlaySession` terminées avec succès et met à jour " +
            "`Adventure.averagePlayDurationSeconds`, `playDurationSampleCount`, `playDurationStatsUpdatedAt` " +
            "(moyenne publiée seulement à partir de 5 parties). " +
            "En-tête `Authorization: Bearer $CRON_SECRET`.",
          parameters: [],
          responses: {
            "200": {
              description:
                "`{ ok: true, stalePlaySessionsClosed: number, adventuresUpdated: number }` — " +
                "fermeture des sessions abandonnées, remise à zéro des agrégats puis réécriture depuis les sessions terminées avec succès.",
            },
            "401": { description: "Secret incorrect." },
            "503": { description: "CRON_SECRET non configuré." },
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
      "/api/user/avatar": {
        get: {
          tags: ["Utilisateur"],
          summary: "Préférence avatar du joueur",
          description: "Retourne `selectedAvatarId` et le détail `selectedAvatar` si un choix est enregistré.",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": {
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/UserAvatarPreferenceResponse" } },
              },
              description: "Préférence courante.",
            },
            "401": { description: "Non connecté." },
            "404": { description: "Utilisateur introuvable." },
          },
        },
        patch: {
          tags: ["Utilisateur"],
          summary: "Choisir ou effacer l’avatar",
          description:
            "Corps `{ \"selectedAvatarId\": \"…\" }` pour un avatar **actif**, ou **`null`** pour effacer. " +
            `**Rate limit** : ~${20}/min (IP + utilisateur). ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserAvatarPatchBody" } },
            },
          },
          responses: {
            "200": {
              description: "Mise à jour enregistrée.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/UserAvatarPatchOk" } },
              },
            },
            "400": { description: "Corps invalide." },
            "401": { description: "Non authentifié." },
            "404": { description: "Avatar introuvable ou inactif." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
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
      "/api/user/advertisement-dismissals": {
        post: {
          tags: ["Utilisateur"],
          summary: "Masquer une publicité pour ce compte",
          description:
            "Corps JSON `{ \"advertisementId\": \"…\" }`. Idempotent : plusieurs appels ne créent qu’une entrée. " +
            `**Rate limit** : ~${30}/min (IP + utilisateur). ${RATE_LIMIT_NOTE}`,
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["advertisementId"],
                  properties: { advertisementId: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Masquage enregistré.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok"],
                    properties: { ok: { type: "boolean", const: true } },
                  },
                },
              },
            },
            "400": { description: "Corps invalide." },
            "401": { description: "Non authentifié." },
            "404": { description: "Publicité introuvable." },
            "429": { description: "Trop de requêtes.", headers: { "Retry-After": { schema: { type: "string" } } } },
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
