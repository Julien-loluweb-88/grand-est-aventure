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
13. [Publicités & offres partenaires](#publicités--offres-partenaires)  
14. [Fichiers & uploads](#fichiers--uploads)  
15. [Tâches planifiées (cron)](#tâches-planifiées-cron)  
16. [Documentation OpenAPI](#documentation-openapi)  
17. [Limites & pistes](#limites--pistes)  
18. [Stack & déploiement](#stack--déploiement)  
19. [Documentation complémentaire](#documentation-complémentaire)

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
| Liste | Parcours, statut, accès |
| Création | Nouvelle aventure (ville, géoloc, créateur, assignation admins) — **`superadmin`** (matrice) |
| Fiche `[id]` | Métadonnées, **énigmes**, **trésor**, couverture, **stock badge physique**, badges virtuels liés, **modération avis**, **UserAdventures** |

### Villes (référentiel)

| Chemin | Fonctionnalité |
|--------|----------------|
| Liste, création, édition | Communes (INSEE, postaux, coords, population) — lient **aventures** et **ciblage publicités** |

### Publicités

| Chemin | Fonctionnalité |
|--------|----------------|
| Liste | Impressions / clics (événements API) |
| Création / édition | Contenu, **placement** (`home`, `library`, …), dates, ordre, ciblage villes / disque lat-lon-rayon |
| **Offre partenaire** | Titre badge, **image du badge** (optionnelle ; sinon image campagne), plafond validations / joueur, ouverture demandes, **commerçants validateurs** (`role = merchant`, table de liaison) |

**Permissions** : liste / stats → `adventure.read` ; CRUD fiches → `adventure.update` (voir [Rôles](#rôles-et-accès-au-dashboard-admingame)).

### Utilisateurs (`superadmin` / droits étendus)

Liste, fiche `[id]` : rôle (`user`, `admin`, `superadmin`, `merchant`, …), bannissement, mot de passe, sessions, droits sur aventures, impersonation, suppression.

### Demandes admin & journal (`superadmin`)

- **Demandes** : `AdminRequest` (création aventure, réassort badges, …).  
- **Journal** : `AdminAuditLog`.

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

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/game/cities` | Référentiel villes |
| GET | `/api/game/adventures` | Catalogue |
| GET | `/api/game/adventures/{id}` | Détail public |
| GET | `/api/game/progress` | Progression joueur (`adventureId`) |
| POST | `/api/game/validate-enigma` | Validation énigme ordonnée |
| POST | `/api/game/validate-treasure` | Carte puis coffre ; fin de parcours, badges, stock physique |
| POST | `/api/game/adventure-review` | Avis fin de partie |
| GET | `/api/game/adventure-reviews` | Liste avis publics |
| GET | `/api/game/adventure-reviews/{id}` | Détail avis approuvé |

**Rate limiting** : plusieurs routes utilisent `src/lib/api/simple-rate-limit.ts` (mémoire par instance).

### Utilisateur connecté

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/user/badges` | Badges du joueur |

### Publicités (souvent sans session)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/advertisements` | Voir ci‑dessous : **placement**, ciblage **ville** / **disque GPS**, puis champs `partnerOffer` |
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

Réponse : liste triée ; chaque encart peut inclure `partnerOffer` (`badgeTitle`, **`badgeImageUrl`** avec repli sur l’image de l’encart, `open`, `maxRedemptionsPerUser`).

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

### Dashboard / technique

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/admin-game/permission-context` | Rôle effectif (proxy) |
| GET | `/api/openapi` | JSON OpenAPI (`API_DOCS_ENABLED`) |
| GET | `/api/uploads/...` | Fichiers sous `uploads/` |

---

## Parcours joueur (référence mobile)

1. **Auth** — Better Auth (voir `docs/expo-better-auth.md`).  
2. **Découverte** — `GET /api/game/cities`, `adventures`, `adventures/{id}`.  
3. **État** — `GET /api/game/progress?adventureId=…`.  
4. **Énigmes** — `POST /api/game/validate-enigma` (ordre strict).  
5. **Trésor** — `POST /api/game/validate-treasure` : phase **carte** puis **coffre** ; succès, `giftNumber`, badges, stock physique si configuré.  
6. **Après victoire** — `POST /api/game/adventure-review`, `GET /api/user/badges`, **publicités** + éventuellement **`POST /api/partner-offers/claims`**.

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
- [ ] `partnerOffer` : si `null`, pas d’offre ; si `open: false`, pas de bouton demande ; visuel **`badgeImageUrl`**.  
- [ ] `POST /api/advertisements/events` — IMPRESSION / CLICK (rate limit).

### Offres partenaires (joueur)

- [ ] `POST /api/partner-offers/claims` — gérer 400 / 429 + `Retry-After`.  
- [ ] `GET /api/partner-offers/claims` — statuts + **`badgeTitle` / `badgeImageUrl`**.

### Commerçant

- [ ] `GET /api/merchant/partner-claims` — **`advertisement.badgeImageUrl`**.  
- [ ] `POST …/resolve` — approve / reject ; gérer 403 si non rattaché à la pub.

---

## Badges

| Type (`BadgeDefinitionKind`) | Attribution |
|------------------------------|-------------|
| (virtuels liés aventure) | Config admin aventure |
| `PARTNER_OFFER` | Validation offre partenaire par commerçant (lié à une **publicité**) |

**Stock physique** : `AdventureBadgeInstance`, événements — géré depuis l’admin aventure.

---

## Publicités & offres partenaires

- **Publicité** : contenu, ciblage, analytics.  
- **Offre partenaire** : badge (titre + visuel), plafond, ouverture / fermeture des **nouvelles** demandes (badges déjà obtenus conservés).  
- **`GET /api/advertisements`** : `partnerOffer.badgeImageUrl` pour l’UI avant obtention du badge ; **ciblage** par liste de **villes** (`cityId`) et/ou **disque** (position joueur vs centre + rayon en mètres) — détail : [ciblage des publicités](#ciblage-publicites).  
- **Image badge (admin)** : champ distinct ; vide = même image que l’encart. Création : brouillon partagé ; finalisation → `uploads/advertisements/{id}/partner-badge.{ext}` puis `image.{ext}`.  
- **Commerçants** : `merchant` rattachés à la publicité ; traitement via **app** + API merchant.

---

## Fichiers & uploads

- Racine **`uploads/`** (aventures, énigmes, trésors, brouillons pubs, `advertisements/{id}/image.*`, `partner-badge.*`, …).  
- URL publique **`/uploads/...`**.

---

## Tâches planifiées (cron)

**`vercel.json`** : appel périodique à **`GET /api/cron/expire-partner-claims`**.  
Configurer **`CRON_SECRET`** côté hébergeur et en **`Authorization: Bearer …`**.

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

- **[Better Auth + Expo](docs/expo-better-auth.md)**  
- **[ROADMAP-RESTE-A-FAIRE.md](ROADMAP-RESTE-A-FAIRE.md)**

---

*Projet privé — Balad'indice.*
