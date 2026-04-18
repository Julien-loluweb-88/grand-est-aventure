# Balad'indice

**Balad'indice** est une plateforme **Next.js** pour des **quêtes et balades** (familles, ville, nature) : **back-office d’administration** (web), **API HTTP** consommée par **l’application mobile** (parcours joueur, publicités, badges, offres partenaires), authentification **Better Auth**, base **PostgreSQL** avec **Prisma**. Logo : `public/logo.png`.

> Tout le jeu « terrain » et la **validation des offres partenaires** passent par **l’app mobile** ; ce dépôt n’expose pas d’interface joueur ou commerçant complète dans le navigateur. Les comptes **commerçant** disposent d’un **espace web minimal** (`/admin-game/dashboard/commercant`) pour les informations et paramètres.

## Sommaire

1. [Prérequis & installation](#prérequis)  
2. [Variables d’environnement](#variables-denvironnement)  
3. [Scripts npm](#scripts-npm)  
4. [Utilisation locale](#utilisation-locale)  
5. [Architecture](#architecture)  
6. [Administration (`/admin-game`)](#administration-admingame)  
7. [Rôles et accès dashboard](#rôles-et-accès-au-dashboard-admingame)  
8. [API HTTP — vue d’ensemble](#api-http--vue-densemble)  
9. [Parcours joueur (référence mobile)](#parcours-joueur-référence-mobile)  
10. [Diagrammes (Mermaid)](#diagrammes--auth--parcours-mermaid)  
11. [Checklist intégration mobile](#checklist-intégration-mobile)  
12. [Badges](#badges)  
13. [Points de découverte — admin & app mobile](#points-de-decouverte-admin-app-mobile)  
14. [Publicités & offres partenaires](#publicités--offres-partenaires)  
15. [Fichiers & uploads](#fichiers--uploads)  
16. [Tâches planifiées (cron)](#tâches-planifiées-cron)  
17. [Documentation OpenAPI](#documentation-openapi)  
18. [Limites & pistes](#limites--pistes)  
19. [Stack & déploiement](#stack--déploiement)  
20. [Documentation complémentaire](#documentation-complémentaire)

---

## Prérequis

- Node.js (compatible Next 16 / React 19)
- PostgreSQL
- npm (ou équivalent)

## Installation

```bash
git clone <url-du-depot>
cd <dossier-du-projet>
npm install
```

### Variables d’environnement

Créez un fichier `.env` à la racine (ne le versionnez pas).

```env
# Base de données
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/NOM_BASE?schema=public"

# Better Auth
BETTER_AUTH_SECRET="votre-secret-long-et-aleatoire"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# E-mails (reset mot de passe, etc.)
NODEMAILER_HOST=smtp.example.com
NODEMAILER_PORT=465
NODEMAILER_USER=
NODEMAILER_PASS=

# Optionnel : cartes / routage
OPENROUTESERVICE_API_KEY=

# Optionnel : OAuth (providers utilisés uniquement)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXT_PUBLIC_DISCORD_CLIENT_ID=

# Cron production : expiration des demandes partenaires (Bearer)
CRON_SECRET=

# Optionnel : masquer OpenAPI en prod
# API_DOCS_ENABLED=false
```

### Base de données et client Prisma

```bash
npm run generate
```

Ce script exécute `prisma generate` et `prisma db push`. En équipe, préférez les **migrations** (`prisma migrate`) selon votre processus.

---

## Scripts npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Lance le build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (ex. heuristique durée de parcours — `src/lib/adventure-estimated-play-duration.test.ts`) |
| `npm run generate` | Prisma generate + db push |

---

## Utilisation locale

```bash
npm run dev
```

- **Site public** : [http://localhost:3000](http://localhost:3000)  
- **Administration** : [http://localhost:3000/admin-game](http://localhost:3000/admin-game)

Les fichiers sous **`uploads/`** sont servis en **`/uploads/...`** (réécriture vers l’API dédiée).

---

## Architecture

| Élément | Emplacement |
|---------|-------------|
| Pages App Router | `src/app/` |
| Routes API | `src/app/api/` |
| Logique métier, auth, jeu, badges, publicités | `src/lib/` |
| Schéma Prisma | `prisma/` |
| Client généré | `generated/prisma/` |

---

## Administration (`/admin-game`)

Connexion sur `/admin-game` ; le dashboard est sous **`/admin-game/dashboard/*`**, protégé par le **proxy** (`src/proxy.ts`) et la session Better Auth.

### Tableau de bord

- **Accueil** (`/admin-game/dashboard`) : shell (widgets placeholder possibles).  
- **Accès refusé** (`/acces-refuse`), **paramètres** (`/parametres`).  
- **Menu latéral** : entrées séparées **Aventures**, **Villes** (référentiel) et **Publicités** (encarts & offres partenaires).

### Aventures

| Chemin | Fonctionnalité |
|--------|----------------|
| Liste | Parcours, statut, **visibilité** (publique / **démo**), accès |
| Création | Nouvelle aventure (ville, géoloc, créateur, assignation admins) — **`superadmin`** (matrice) ; choix **Publique** ou **Démo** |
| Fiche `[id]` | Métadonnées, **énigmes**, **trésor**, **points de découverte** (POI / badges hors quête, carte interactive), couverture, **stock badge physique**, badges virtuels liés, **modération avis**, **UserAdventures** ; si **démo** : carte **comptes invités** (e-mails autorisés à jouer hors catalogue) |

**Visibilité (`Adventure.audience` en base)** :

- **Publique** (`PUBLIC`) : aventure listée dans le **catalogue API** mobile / comptage « ville active », jouable par tout le monde (si `status` actif).
- **Démo** (`DEMO`) : **pas** dans le catalogue ni dans le comptage de villes actives ; **admins / superadmins** y accèdent toujours ; les **joueurs** uniquement s’ils sont ajoutés sur la fiche (**liste blanche** `AdventureDemoAccess`). Les routes jeu renvoient **404** si l’accès est refusé (voir [OpenAPI](#documentation-openapi) et `src/lib/adventure-public-access.ts`).

### Villes (référentiel)

| Chemin | Fonctionnalité |
|--------|----------------|
| Liste, création, édition | Communes (INSEE, postaux, coords, population) — lient **aventures** et **ciblage publicités** ; édition d’une ville : **points de découverte « toute la ville »** (carte + téléversement image) |

### Publicités

| Chemin | Fonctionnalité |
|--------|----------------|
| Liste | Impressions / clics (événements API) |
| Création / édition | Contenu, **placement** (`home`, `library`, …), dates, ordre, ciblage villes / disque lat-lon-rayon |
| **Offre partenaire** | Titre badge, **image du badge** (optionnelle ; sinon image campagne), plafond validations / joueur, ouverture demandes, **commerçants validateurs** (`role = merchant`, table de liaison) |

**Permissions** : liste / stats → `adventure.read` ; CRUD fiches → `adventure.update` (voir [Rôles](#rôles-et-accès-au-dashboard-admingame)).

### Badges globaux (paliers)

| Chemin | Fonctionnalité |
|--------|----------------|
| `/admin-game/dashboard/badges-globaux` | Liste des badges **MILESTONE_*** (aventures réussies / km cumulés) ; slug généré automatiquement à la création |
| Création / édition | Libellé, type, seuil, ordre, image (`uploads/badges/milestone/`) |

### Points de découverte (admin — rappel)

Configurés sur la **fiche ville** (POI ouverts à toute la ville) et sur la **fiche aventure** (POI réservés aux joueurs ayant **démarré** cette aventure). Édition : **carte Leaflet** (clic / glisser l’épingle, aperçu du rayon), champs lat/lon, téléversement image → `uploads/badges/discovery/`. Détail API et mobile : [Points de découverte — admin & app mobile](#points-de-decouverte-admin-app-mobile).

### Utilisateurs (`superadmin` / droits étendus)

Liste, fiche `[id]` : rôle (`user`, `admin`, `superadmin`, `merchant`, …), bannissement, mot de passe, sessions, droits sur aventures, impersonation, suppression.

### Demandes admin & journal (`superadmin`)

- **Journal** : `AdminAuditLog` (traçabilité).

#### Types de demandes configurables (`AdminRequestType`)

Ce mécanisme sert à la **boîte de réception superadmin** (`/admin-game/dashboard/demandes`) : chaque demande (`AdminRequest`) référence un **type** avec une **`key` stable** (identifiant technique pour le code et les intégrations). Le **libellé** et la **description** sont affichés dans l’UI ; la **key** ne doit pratiquement **jamais changer** après adoption par le code.

| Key | Rôle dans l’app |
|-----|-----------------|
| `adventure_creation` | Demande d’un admin **sans** droit de créer une aventure : formulaire « demander une création » (`submitAdventureCreationRequest`). |
| `badge_restock` | Demande de réassort de **badges physiques** sur une aventure (`submitBadgeRestockRequest`) — réservé aux admins de périmètre, pas au superadmin (qui gère le stock directement). |

D’autres types peuvent être ajoutés par un superadmin depuis la même page ; le code qui doit en tenir compte utilisera leur **`key`** (comme pour les deux ci-dessus).

**Initialisation en base** : il **n’y a pas de seed Prisma obligatoire** pour ces deux types. Ils sont assurés par **`ensureDefaultAdminRequestTypes`** (`upsert` sur la `key`) : à l’ouverture de la page **Demandes** par un superadmin, et **avant** les soumissions de demande création d’aventure / réassort badges — ainsi une base vide reste utilisable sans étape manuelle.

#### Publicités — pas de type `AdminRequestType`

Les **campagnes publicitaires** et les **offres partenaires** ne passent **pas** par `AdminRequest` : ce sont des fiches **`Advertisement`** (et flux **`PartnerOfferClaim`**) gérées par les comptes avec **`adventure.update`** / `read`. Aucune entrée « pub » n’est requise dans `AdminRequestType`.

### Documentation API intégrée

**`/admin-game/dashboard/docs/api`** : Swagger UI (spec OpenAPI), session admin avec `adventure.read`.

---

## Rôles et accès au dashboard (`/admin-game`)

### Vue d’ensemble

| Rôle | Usage principal |
|------|-----------------|
| `user` | Joueur (app / site) |
| `admin` | Contenu : aventures assignées, **villes**, **publicités** (`adventure.read` / `update`) |
| `superadmin` | Tout le dashboard + utilisateurs + demandes + journal + création / suppression d’aventures |
| `merchant` | **Espace web réduit** (`commercant`, accueil, paramètres) + validations via **app** et **`/api/merchant/*`** |

### Tableau d’accès (pages web)

Référence : `src/proxy.ts`, `getAdminSessionCapabilities` (`src/lib/admin-session-capabilities.ts`), matrice `src/lib/permissions.ts`.

| Zone | `admin` | `superadmin` | `merchant` |
|------|---------|--------------|------------|
| Accueil dashboard | Oui | Oui | Oui |
| **Compte commerçant** `…/commercant` | Oui (aide) | Oui | Oui (accueil après login) |
| Paramètres | Oui | Oui | Oui |
| Aventures (liste / fiche) | Oui | Oui | **Non** → `commercant` |
| Création aventure | **Non** | Oui | **Non** |
| Villes | `read` / `update` | Oui | **Non** |
| Publicités | `read` / `update` | Oui | **Non** |
| OpenAPI UI | Si `adventure.read` | Oui | **Non** |
| Utilisateurs | **Non** | Oui | **Non** |
| Demandes / journal | **Non** | Oui | **Non** |

L’API commerçant exige **`role = merchant`** + rattachement **`MerchantAdvertisement`** à la publicité.

---

## API HTTP — vue d’ensemble

Référence détaillée : **`src/lib/openapi/grand-est-openapi-document.ts`** et **`GET /api/openapi`**.

### Jeu & catalogue (souvent sans session complète pour le catalogue)

**Aventures démo** (`audience = DEMO`) : exclues du **catalogue** (`GET …/adventures`) et du **comptage** des villes actives (`GET …/cities` avec `activeOnly` par défaut). Pour ouvrir une démo dans l’app : **session** + compte **admin / superadmin** ou **liste blanche** (fiche admin). Détail : spec **OpenAPI** (section *Aventures publiques vs démo*) et implémentation `src/lib/adventure-public-access.ts`.

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/game/cities` | Référentiel villes |
| GET | `/api/game/adventures` | Catalogue (**uniquement** aventures `PUBLIC` + actives) |
| GET | `/api/game/adventures/{id}` | Détail + **`discoveryPoints`** ; démo → session + droit requis |
| GET | `/api/game/progress` | Progression joueur (`adventureId`) |
| POST | `/api/game/validate-enigma` | Validation énigme ordonnée |
| POST | `/api/game/validate-treasure` | Carte puis coffre ; fin de parcours, badges, stock physique |
| POST | `/api/game/adventure-review` | Avis fin de partie |
| GET | `/api/game/adventure-reviews` | Liste avis publics |
| GET | `/api/game/adventure-reviews/{id}` | Détail avis approuvé |
| GET | `/api/game/discovery-points` | POI « découverte » d’une ville (`?cityId=`) ; POI liés à une **démo** filtrés selon la session |
| POST | `/api/game/claim-discovery` | Réclamer le badge d’un POI (session + position GPS) |

**Rate limiting** : plusieurs routes utilisent `src/lib/api/simple-rate-limit.ts` (mémoire par instance).

### Utilisateur connecté

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/user/badges` | Badges du joueur |
| POST | `/api/user/advertisement-dismissals` | Masquer une pub pour le compte (persistant) ; corps `{ "advertisementId" }` ; rate limit |

### Publicités (souvent sans session)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/advertisements` | Comme ci‑dessous ; **avec session**, les pubs masquées via `advertisement-dismissals` sont exclues |
| POST | `/api/advertisements/events` | IMPRESSION / CLICK (rate limit) |

<a id="ciblage-publicites"></a>

#### Filtrage géographique — `GET /api/advertisements`

Implémentation : **`src/lib/advertisement-eligibility.ts`** (`filterEligibleAdvertisements`), après chargement des pubs **actives**, **placement** et **fenêtre de dates** côté requête Prisma.

| Paramètre | Obligatoire | Rôle |
|-----------|-------------|------|
| `placement` | **Oui** | Doit correspondre au champ configuré en admin (`home`, `library`, …). |
| `cityId` | Non | Identifiant **`City`** du référentiel (`GET /api/game/cities`). |
| `latitude` / `longitude` | Non (mais voir disque) | Position actuelle du joueur (WGS84, nombres finis). Les deux doivent être envoyés si vous voulez passer le filtre « disque ». |

**Règles de géolocalisation (cumulatives sur une même publicité) :**

1. **Ciblage par villes** — Si la publicité a au moins une ville cible dans l’admin : le joueur doit envoyer un **`cityId`** qui figure dans cette liste. Sinon la pub est **exclue**.
2. **Ciblage par disque** — Si la publicité a un **centre** (lat/lon) et un **rayon en mètres** renseignés : le joueur doit envoyer **`latitude` et `longitude`** ; la distance (Haversine, mètres) doit être **≤ rayon**. Si la pub a un disque mais que l’app **n’envoie pas les deux coordonnées**, la pub est **exclue**.
3. **Les deux à la fois** — Si une pub a **villes ET disque**, il faut **satisfaire les deux** conditions.
4. **Aucun ciblage** — Si la pub n’a **ni** ville **ni** disque complet en base, elle n’est filtrée que par placement / dates / actif.

Réponse : liste triée ; chaque encart peut inclure `partnerOffer` (`badgeTitle`, **`badgeImageUrl`** avec repli sur l’image de l’encart, `open`, `maxRedemptionsPerUser`). **Joueur connecté** : envoyez les cookies de session ; les encarts déjà masqués (`POST /api/user/advertisement-dismissals`) n’apparaissent plus.

### Offres partenaires (app mobile)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/api/partner-offers/claims` | Joueur : demande `PENDING` (`advertisementId`) |
| GET | `/api/partner-offers/claims` | Historique ; chaque ligne : `badgeTitle`, **`badgeImageUrl`** (même règle que ci-dessus) |
| GET | `/api/merchant/partner-claims` | Commerçant : file par statut ; `advertisement.badgeTitle` / **`badgeImageUrl`** |
| POST | `/api/merchant/partner-claims/{id}/resolve` | `approve` / `reject` ; `awardedUserBadge` si première attribution |

### Cron

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/cron/expire-partner-claims` | Passe en `EXPIRED` les `PENDING` > **24 h** ; **`Authorization: Bearer $CRON_SECRET`** |
| GET | `/api/cron/recompute-adventure-durations` | Ferme les sessions **`IN_PROGRESS`** de plus de **30 jours** (`ABANDONED`), remet à zéro puis recalcule **`averagePlayDurationSeconds`** / **`playDurationSampleCount`** / **`playDurationStatsUpdatedAt`** pour chaque aventure (moyenne affichée à partir de **5** succès) ; **`Authorization: Bearer $CRON_SECRET`** — réponse `{ ok, stalePlaySessionsClosed, adventuresUpdated }` |

### Dashboard / technique

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/admin-game/permission-context` | Rôle effectif (proxy) |
| GET | `/api/openapi` | JSON OpenAPI (`API_DOCS_ENABLED`) |
| GET | `/api/uploads/...` | Fichiers sous `uploads/` |

---

## Parcours joueur (référence mobile)

1. **Auth** — Better Auth (voir `docs/expo-better-auth.md`).  
2. **Découverte** — `GET /api/game/cities`, `adventures`, **`adventures/{id}`** (inclut **`discoveryPoints`** pour la ville de l’aventure — pas d’appel séparé obligatoire pour la carte des badges « découverte » pendant un parcours ; champs **`estimatedDurationSeconds`**, **`averagePlayDurationSeconds`**, **`playDurationSampleCount`** pour afficher une durée indicative / moyenne réelle). **Parcours démo** : pas dans le catalogue ; ouvrir l’URL avec un compte autorisé (session).  
3. **État** — `GET /api/game/progress?adventureId=…`.  
4. **Énigmes** — `POST /api/game/validate-enigma` (ordre strict).  
5. **Trésor** — `POST /api/game/validate-treasure` : phase **carte** puis **coffre** ; succès, `giftNumber`, badges, stock physique si configuré.  
6. **Après victoire** — `POST /api/game/adventure-review`, `GET /api/user/badges`, **publicités** (même requête avec session pour respecter les masquages) + éventuellement **`POST /api/partner-offers/claims`** ou **`POST /api/user/advertisement-dismissals`** si l’utilisateur ferme un encart.  
7. **Hors quête (optionnel)** — Utiliser **`discoveryPoints`** déjà renvoyés avec **`adventures/{id}`**, ou `GET /api/game/discovery-points?cityId=` (écran « toute la ville » sans parcours) ; puis **`POST /api/game/claim-discovery`** sur place — [Points de découverte — admin & app mobile](#points-de-decouverte-admin-app-mobile).

---

## Diagrammes — auth & parcours (Mermaid)

Rendu sur GitHub ; ailleurs : extension Mermaid ou [mermaid.live](https://mermaid.live).

### Joueur

```mermaid
flowchart TB
  subgraph mobile["App mobile"]
    A([Démarrage]) --> B{Session valide ?}
    B -->|Non| C["/api/auth/*"]
    C --> B
    B -->|Oui| D["GET /api/game/cities — optionnel"]
    D --> E["GET /api/game/adventures"]
    E --> F["GET /api/game/adventures/{id}"]
    F --> G["GET /api/game/progress"]
    G --> H{Énigmes restantes ?}
    H -->|Oui| I["POST validate-enigma"]
    I --> H
    H -->|Non| J["POST validate-treasure — carte"]
    J --> K["POST validate-treasure — coffre"]
    K --> L["Succès, badges…"]
    L --> M["POST adventure-review — optionnel"]
    M --> N["GET /api/user/badges"]
    N --> O["GET /api/advertisements + POST …/events"]
    O --> P{partnerOffer.open ?}
    P -->|Oui| Q["POST /api/partner-offers/claims"]
    P -->|Non| R([Fin])
    Q --> R
  end
```

### Commerçant — validations

```mermaid
flowchart LR
  M1([Session commerçant]) --> M2["GET /api/merchant/partner-claims"]
  M2 --> M3{Action}
  M3 --> M4["POST …/resolve — approve"]
  M3 --> M5["POST …/resolve — reject"]
```

---

## Checklist intégration mobile

### Publicités

- [ ] `GET /api/advertisements` : **`placement`** obligatoire ; **`cityId`** si le joueur a une ville (requis pour les campagnes avec villes cibles) ; **`latitude` + `longitude`** si le GPS est dispo (requis pour les campagnes avec disque centre + rayon).  
- [ ] Même appel **avec session** pour exclure les encarts masqués ; **`POST /api/user/advertisement-dismissals`** quand l’utilisateur ferme un encart (401 si non connecté).  
- [ ] `partnerOffer` : si `null`, pas d’offre ; si `open: false`, pas de bouton demande ; visuel **`badgeImageUrl`**.  
- [ ] `POST /api/advertisements/events` — IMPRESSION / CLICK (rate limit).

### Offres partenaires (joueur)

- [ ] `POST /api/partner-offers/claims` — gérer 400 / 429 + `Retry-After`.  
- [ ] `GET /api/partner-offers/claims` — statuts + **`badgeTitle` / `badgeImageUrl`**.

### Commerçant

- [ ] `GET /api/merchant/partner-claims` — **`advertisement.badgeImageUrl`**.  
- [ ] `POST …/resolve` — approve / reject ; gérer 403 si non rattaché à la pub.

### Points de découverte (joueur)

- [ ] Après `GET /api/game/cities`, conserver le **`cityId`** choisi pour la carte / filtres.  
- [ ] Sur la fiche parcours : utiliser le tableau **`discoveryPoints`** de **`GET /api/game/adventures/{id}`** (même structure que la liste ci‑dessous) pour afficher les badges « découverte » de la **ville** sans requête supplémentaire.  
- [ ] Hors fiche parcours (ex. carte globale ville) : `GET /api/game/discovery-points?cityId=…` — afficher marqueurs (`latitude`, `longitude`, `radiusMeters`, `title`, `teaser`, `imageUrl`) ; distinguer **`adventureId === null`** (toute la ville) vs **`adventureId` renseigné** (réservé aux joueurs ayant une ligne **`UserAdventures`** sur cette aventure — à masquer ou griser si pas encore démarré).  
- [ ] `POST /api/game/claim-discovery` avec **cookies de session** (même mécanisme que `validate-enigma`) : corps JSON `userId` (= id session), `discoveryPointId`, `latitude`, `longitude` = **position actuelle** (WGS84). Gérer **400** (`TOO_FAR`, `ADVENTURE_REQUIRED`), **404**, **429** + `Retry-After`. Réponse **200** : `{ ok: true, userBadgeId }` ou `{ …, alreadyHad: true }` si déjà obtenu.  
- [ ] Rafraîchir la collection avec **`GET /api/user/badges`** ; filtrer ou badger les entrées dont `badgeDefinition.kind === "DISCOVERY"` (et éventuellement corréler avec la liste des POI).

---

## Badges

| Type (`BadgeDefinitionKind`) | Attribution |
|------------------------------|-------------|
| (virtuels liés aventure) | Config admin aventure |
| `MILESTONE_ADVENTURES` / `MILESTONE_KM` | **Paliers globaux** : admin **Badges globaux** (`/admin-game/dashboard/badges-globaux`) ; le **slug** est généré automatiquement à partir du libellé (suffixe si collision). Évaluation à la **fin d’une aventure réussie** (`src/lib/badges/award-on-finish.ts`) : km = somme des `Adventure.distance` des parcours **distincts** terminés avec succès. |
| `PARTNER_OFFER` | Validation offre partenaire par commerçant (lié à une **publicité**) |
| `DISCOVERY` | **Point de découverte** — voir [section détaillée](#points-de-decouverte-admin-app-mobile). |

**Stock physique** : `AdventureBadgeInstance`, événements — géré depuis l’admin aventure.

---

<a id="points-de-decouverte-admin-app-mobile"></a>

## Points de découverte — admin & app mobile

Les **points de découverte** incitent à visiter un lieu **hors fil d’énigmes** : chaque point a un **badge virtuel** (`BadgeDefinitionKind.DISCOVERY`), une position, un **rayon en mètres** (géofence Haversine côté serveur) et des champs d’affichage (`title`, `teaser`, `imageUrl`).

### Comportement métier

| Champ `DiscoveryPoint` | Effet |
|------------------------|--------|
| `cityId` | Ville de rattachement (obligatoire). Tous les POI d’une ville sont listés par une seule route API. |
| `adventureId` **null** | POI **ville** : tout utilisateur **connecté** peut réclamer le badge s’il est **dans le rayon**. |
| `adventureId` **renseigné** | POI **aventure** : le joueur doit avoir **au moins une** entrée `UserAdventures` pour cette aventure (peu importe succès / échec à ce stade) ; l’aventure doit être **active**. |

La réclamation **ne consomme pas** d’étape de quête ; elle crée ou confirme un `UserBadge` lié au `BadgeDefinition` du point.

### Administration (web)

| Emplacement | Contenu |
|-------------|---------|
| **Ville** — `/admin-game/dashboard/villes/[id]` | POI avec `adventureId` vide : visibles pour toute la ville. Carte centrée sur les coords de la ville (ou repli Grand Est si absentes). |
| **Aventure** — `/admin-game/dashboard/aventures/[id]` | POI liés à cette aventure. Carte avec **même repères** que l’éditeur (départ, énigmes, trésor) + **tracé parcours** si présent. |
| **Image** | Téléversement dashboard → `uploads/badges/discovery/{uuid}.(jpg|png|webp)` ; URL publique `/uploads/...` (ou URL externe collée). |

Permissions : comme le reste du référentiel — lecture liste **`adventure.read`**, création / édition / suppression **`adventure.update`**.

### API — liste des POI (catalogue carte)

**Inclus dans le détail aventure** — **`GET /api/game/adventures/{id}`** renvoie un champ **`discoveryPoints`** : liste des mêmes objets que ci‑dessous pour **`city.id`** de l’aventure. L’app mobile peut donc tracer les POI **dès le chargement du parcours** sans appeler `discovery-points` (sauf pour un écran « carte ville » sans `adventureId`).

**`GET /api/game/discovery-points?cityId=<id>`**

- **Authentification** : non requise (données non secrètes).
- **Réponse 200** : `{ "points": [ … ] }` chaque élément contient au minimum :  
  `id`, `cityId`, `adventureId` (`null` ou id aventure), `title`, `teaser`, `latitude`, `longitude`, `radiusMeters`, `imageUrl`, `sortOrder`.
- **Erreurs** : `400` si `cityId` manquant ; `404` si ville inconnue.

**Intégration mobile recommandée**

1. Le joueur choisit une ville (`GET /api/game/cities`) → récupérer `cityId`.  
2. **Pendant un parcours** : utiliser **`discoveryPoints`** dans la réponse **`GET /api/game/adventures/{id}`**. **Carte ville sans parcours** : appeler **`discovery-points?cityId=`**.  
3. Afficher les marqueurs sur une carte (ex. même stack carte que le reste de l’app).  
4. Filtrer l’UI : pour les entrées avec `adventureId != null`, n’afficher le marqueur « réclamable » (ou le badge « bonus parcours ») que si le joueur a **déjà démarré** cette aventure (vous connaissez l’état via `GET /api/game/progress?adventureId=…` ou une liste locale des parties). Sinon masquer ou afficher en grisé avec libellé du type « Démarrez l’aventure X pour débloquer ».

### API — réclamer le badge (sur place)

**`POST /api/game/claim-discovery`**

- **Authentification** : **session Better Auth** (cookies, comme `POST /api/game/validate-enigma`).
- **Corps JSON** (tous requis) :

```json
{
  "userId": "<même id que session.user.id>",
  "discoveryPointId": "<id du point, champ id de la liste>",
  "latitude": 48.123456,
  "longitude": 7.123456
}
```

- **`latitude` / `longitude`** : position **actuelle** du terminal (WGS84). Le serveur calcule la distance au point ; si elle dépasse **`radiusMeters`**, la requête est refusée.

**Réponse 200**

```json
{ "ok": true, "userBadgeId": "…" }
```

ou, si le joueur avait déjà le badge :

```json
{ "ok": true, "userBadgeId": "…", "alreadyHad": true }
```

**Erreurs** (corps souvent `{ "error": "…", "code": "…" }`) :

| HTTP | `code` (si présent) | Situation |
|------|---------------------|-----------|
| 401 | — | Non connecté ou `userId` ≠ utilisateur de la session. |
| 400 | `TOO_FAR` | Hors du disque autour du POI. |
| 400 | `ADVENTURE_REQUIRED` | POI lié à une aventure mais pas de `UserAdventures` pour ce joueur et cette aventure. |
| 404 | `NOT_FOUND` | `discoveryPointId` inconnu. |
| 404 | `INACTIVE_ADVENTURE` | Aventure liée inactive. |
| 500 | `NO_BADGE` (ou sans code) | Configuration incohérente du point (peu courant). |
| 429 | — | Trop de requêtes ; en-tête **`Retry-After`** (secondes). |

**Flux UX suggéré**

1. Quand la distance utilisateur ↔ POI &lt; rayon (calcul **côté app** pour l’UX, le serveur refait le calcul), proposer un bouton « Obtenir le badge ».  
2. Au tap : `POST claim-discovery` avec la position fraîche du GPS.  
3. Succès → toast + mise à jour **`GET /api/user/badges`**.

**Rate limit** : ordre de grandeur **40 requêtes / minute / (IP + utilisateur)** — à respecter surtout si vous appelez la route en boucle ; éviter le spam au chargement d’écran.

### Collection badges joueur

**`GET /api/user/badges`** — déjà utilisée après une aventure ; les badges `DISCOVERY` apparaissent comme les autres avec `badgeDefinition.kind === "DISCOVERY"`, `title`, `imageUrl`, `slug`, etc. Vous pouvez croiser `badgeDefinition.id` avec les définitions créées pour chaque point si besoin d’URLs profondes.

### Références code

- Requête publique partagée : `src/lib/game/discovery-points-public-query.ts`  
- Réclamation : `src/lib/game/claim-discovery-point.ts`  
- Routes : `src/app/api/game/adventures/[id]/route.ts`, `discovery-points/route.ts`, `claim-discovery/route.ts`  
- OpenAPI : chemins documentés dans `src/lib/openapi/grand-est-openapi-document.ts`

---

## Publicités & offres partenaires

- **Publicité** : contenu, ciblage, analytics.  
- **Offre partenaire** : badge (titre + visuel), plafond, ouverture / fermeture des **nouvelles** demandes (badges déjà obtenus conservés).  
- **`GET /api/advertisements`** : `partnerOffer.badgeImageUrl` pour l’UI avant obtention du badge ; **ciblage** par liste de **villes** (`cityId`) et/ou **disque** (position joueur vs centre + rayon en mètres) — détail : [ciblage des publicités](#ciblage-publicites). Avec **session**, exclusion des pubs masquées via **`POST /api/user/advertisement-dismissals`**.  
- **Image badge (admin)** : champ distinct ; vide = même image que l’encart. Création : brouillon partagé ; finalisation → `uploads/advertisements/{id}/partner-badge.{ext}` puis `image.{ext}`.  
- **Commerçants** : `merchant` rattachés à la publicité ; traitement via **app** + API merchant.

---

## Fichiers & uploads

- Racine **`uploads/`** (aventures, énigmes, trésors, brouillons pubs, `advertisements/{id}/image.*`, `partner-badge.*`, `badges/milestone/`, `badges/discovery/`, …).  
- URL publique **`/uploads/...`**.

---

## Tâches planifiées (cron)

**`vercel.json`** :  
- **`GET /api/cron/expire-partner-claims`** (toutes les heures) — expiration des demandes partenaires.  
- **`GET /api/cron/recompute-adventure-durations`** (tous les jours à 03:00 UTC) — mises à jour des **durées moyennes de jeu** par aventure (sessions `UserAdventurePlaySession` terminées avec succès).

Configurer **`CRON_SECRET`** côté hébergeur et en **`Authorization: Bearer …`** pour chaque route cron.

### Durées côté aventure (résumé)

- **`estimatedPlayDurationSeconds`** (API : `estimatedDurationSeconds`) : **estimation éditoriale** recalculée à chaque **sync d’itinéraire** (création / édition des points départ → énigmes → trésor) : temps de marche (distance ORS ou, à défaut de clé API, **ligne droite** entre les points / vitesse de marche supposée), + temps par énigme, + marge trésor si présent. Voir `src/lib/adventure-estimated-play-duration.ts` et `syncAdventureRouteDistance`.
- **`averagePlayDurationSeconds`** : **moyenne temps réel** une fois assez de parties en base (alimentée par le cron ci-dessus ; seuil **5** sessions dans `src/lib/game/recompute-adventure-play-duration-stats.ts`). Chaque passage cron **réinitialise** d’abord les compteurs sur toutes les aventures puis réécrit depuis les données (évite une moyenne obsolète si les sessions disparaissent).
- **Sessions joueur** : première validation d’étape ouvre une ligne `UserAdventurePlaySession` ; la fin d’aventure (`processGameFinish`) la clôture et enregistre la durée. Les sessions restées **`IN_PROGRESS`** plus de **30 jours** passent en **`ABANDONED`** au cron (`src/lib/game/expire-stale-adventure-play-sessions.ts`).

---

## Documentation OpenAPI

- Source : `src/lib/openapi/grand-est-openapi-document.ts`.  
- **Swagger UI** : `/admin-game/dashboard/docs/api`.  
- **JSON** : `GET /api/openapi`.

---

## Limites & pistes

- **Rate limiting** : en mémoire par instance ; pas un plafond global en serverless multi-instances.  
- **Tests** : peu de tests contractuels sur les routes — à renforcer si besoin.  
- **Client mobile** : hors dépôt ; session OAuth : `docs/expo-better-auth.md`.  
- **ROADMAP** : `ROADMAP-RESTE-A-FAIRE.md`.

---

## Stack & déploiement

**Stack** : Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL, Better Auth, Radix / shadcn, TipTap, Leaflet, Zod.

**Déploiement** : `npm run build` puis `npm run start`. Variables : `DATABASE_URL`, `BETTER_AUTH_*`, URL publique, SMTP, OAuth, **`CRON_SECRET`** si cron. Persistance **`uploads/`** ou stockage objet.

---

## Documentation complémentaire

- **[Better Auth + Expo](docs/expo-better-auth.md)** — session cookies pour les routes jeu (`validate-enigma`, `claim-discovery`, etc.).  
- **[ROADMAP-RESTE-A-FAIRE.md](ROADMAP-RESTE-A-FAIRE.md)**

---

*Projet privé — Balad'indice.*
