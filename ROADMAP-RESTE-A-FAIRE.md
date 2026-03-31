# Balad'indice — ce qui reste à faire

Document généré à partir du schéma Prisma (`prisma/schema.prisma`), des routes API (`src/app/api/**/route.ts`) et des pages Next (`src/app/**/page.tsx`). Il sert de **backlog indicatif** : à prioriser avec le produit.

---

## 1. Vue d’ensemble du dépôt

| Zone | État |
|------|------|
| **Next.js** | Site public minimal (`/`), login, espace **admin** (`/admin-game`, dashboard). |
| **API HTTP** | Jeu (progression, validation, trésor, avis), publicités, badges joueur, auth Better Auth, uploads, OpenAPI protégé. |
| **Client joueur** | Aucune appli mobile / front « parcours » dans ce dépôt ; les APIs supposent un consommateur externe (ex. Expo). |

---

## 2. Modèle de données vs implémentation

### 2.1 Bien couvert (logique + admin ou API)

- **Auth** : `User`, `Session`, `Account`, `Verification` (Better Auth).
- **Référentiel** : `City`, `Adventure`, `Enigma`, `Treasure` (CRUD admin, uploads images).
- **Progression** : `UserAdventures`, `UserAdventureStepValidation` + routes `/api/game/*`.
- **Badges** : `BadgeDefinition` (virtuel + paliers km / nombre d’aventures dans `award-on-finish`), `UserBadge`, `AdventureBadgeInstance`, `AdventureBadgeStockEvent`, stock physique admin.
- **Publicités** : `Advertisement`, `AdvertisementEvent` — API publique + events ; liste admin avec compteurs impr. / clics.
- **Demandes admin** : `AdminRequest`, `AdminRequestType` (superadmin).
- **Audit** : `AdminAuditLog` + page journal admin.
- **Périmètre admin** : `AdminAdventureAccess` (assignation par aventure / utilisateur côté dashboard).

### 2.2 Partiel ou non exploité côté produit

| Élément schéma | Écart |
|----------------|--------|
| **`AdventureReview.image`** | Colonne présente ; **pas** d’upload ni d’URL renseignée par l’API `POST /api/game/AdventureReview`. |
| **`AdventureReview.moderationStatus`** | Enum `DRAFT` / `PENDING` / `APPROVED` / `REJECTED` : le flux métier décrit dans le schéma (brouillon → modération → publication) **n’est pas implémenté** dans l’API (création/mise à jour sans gestion explicite du statut) **ni** dans l’admin (pas d’écran de modération / liste des avis). |
| **Avis « publics »** | Aucune route de **lecture** des avis approuvés pour un site vitrine ou une fiche aventure publique. |

### 2.3 Catalogue / découverte joueur (hors schéma mais attendu par l’app)

Les tables `Adventure`, `City`, etc. existent, mais il **manque** typiquement (selon le client mobile / futur web joueur) :

- API **liste des aventures** publiques (filtre ville, géoloc, statut `active`).
- API **détail aventure** « safe » pour le joueur (métadonnées, parcours sans divulguer `answer` / codes trésor — aujourd’hui le contenu sensible est surtout servi via l’admin ou l’hypothétique client).

---

## 3. Routes API — lacunes signalées

| Manquant / à clarifier | Détail |
|------------------------|--------|
| **Catalogue & fiche aventure (joueur)** | Pas de `GET /api/...` dédié dans ce dépôt pour équivalent « store » / carte. |
| **Avis** | Pas de `GET` (modération admin ou public), pas d’upload `image`, pas de transition de `moderationStatus`. |
| **Villes** | Référentiel géré en admin ; pas d’API publique **liste villes** si le client en a besoin (ex. autocomplete). |
| **Tests** | Aucun fichier `*.test.ts` repéré ; pas de tests contractuels sur les routes critiques (validations, trésor). |

Les routes **existantes** sont résumées dans la spec OpenAPI :  
`src/lib/openapi/grand-est-openapi-document.ts` + UI `/admin-game/dashboard/docs/api`.

---

## 4. Interface admin — pistes de complétion

- **Modération des avis** : tableau des `AdventureReview`, filtres par statut, actions approuver / refuser, éventuelle édition ou masquage.
- **Statistiques publicités** : la liste affiche déjà des compteurs ; envisager exports, graphiques, ou périodes si besoin métier.
- **Cohérence schéma ↔ API avis** : soit retirer / utiliser `DRAFT`, soit exposer « enregistrer brouillon » vs « soumettre ».
- **Dette UI mineure** : ex. `UserAdventuresComponent` contenait un `console.log` de debug — à nettoyer en passant.

---

## 5. Qualité, build et production

- **Build TypeScript** : corriger les erreurs TS restantes (ex. typages de props sur certaines pages admin) pour que `next build` passe au vert.
- **CI** : lint + build (+ optionnel tests) sur chaque PR.
- **OpenAPI** : tenir le fichier documenté **à jour** quand vous ajoutez des routes ; variable `API_DOCS_ENABLED=false` pour masquer doc + JSON en prod si besoin.
- **Sécurité** : revue des en-têtes CSP si un jour Swagger est servi autrement ; rate limits déjà en place sur le jeu — à harmoniser si nouvelles routes sensibles.

---

## 6. Client joueur (hors ou avec ce repo)

- Brancher l’app mobile (ou futur front) sur les endpoints existants : **auth**, **progress**, **validate-***, **validate-treasure**, **badges**, **publicités**, **avis**.
- Implémenter côté client les écrans manquants (avis + image + consentement déjà partiellement côté API texte).
- Si le client est dans un **autre dépôt**, dupliquer ou partager types / contrats (OpenAPI, codegen).

---

## 7. Synthèse priorisable (suggestions)

1. **P0 — Stabilité** : faire passer le build, retirer les debug logs, migrations Prisma à jour en environnements partagés.  
2. **P1 — Parcours joueur** : APIs catalogue + détail « safe » si le mobile en a besoin.  
3. **P1 — Avis** : flux complet (image, statuts, modération admin, lecture publique éventuelle).  
4. **P2 — Qualité** : tests API ou e2e sur le flux de fin d’aventure.  
5. **P2 — Observabilité** : logs structurés, métriques sur erreurs 4xx/5xx des routes jeu.

---

*Pour toute évolution du schéma, mettre à jour ce fichier ou la section correspondante dans la doc interne.*
