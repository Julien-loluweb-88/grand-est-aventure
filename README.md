# Balad'indice

**Balad'indice** est une application **Next.js** pour les quêtes et balades (familles, ville et nature) : back-office admin, **API HTTP** pour le jeu (web ou mobile), authentification **Better Auth**. Base **PostgreSQL** avec **Prisma**. Logo : `public/logo.png`.

## Prérequis

- Node.js (version compatible avec Next 16 / React 19)
- PostgreSQL
- npm (ou gestionnaire équivalent)

## Installation

```bash
git clone <url-du-depot>
cd <dossier-du-projet>
npm install
```

### Variables d’environnement

Créez un fichier `.env` à la racine (ne le versionnez pas). Exemple minimal :

```env
# Base de données
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/NOM_BASE?schema=public"

# Better Auth — secret fort (≥ 32 caractères), URL de l’app
BETTER_AUTH_SECRET="votre-secret-long-et-aleatoire"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# E-mails transactionnels (ex. reset mot de passe)
NODEMAILER_HOST=smtp.example.com
NODEMAILER_PORT=465
NODEMAILER_USER=
NODEMAILER_PASS=

# Optionnel : routage / cartes (clé selon votre fournisseur)
OPENROUTESERVICE_API_KEY=

# Optionnel : OAuth (renseigner seulement les providers utilisés)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXT_PUBLIC_DISCORD_CLIENT_ID=

# Optionnel : masquer la doc OpenAPI en production
# API_DOCS_ENABLED=false
```

### Base de données et client Prisma

```bash
npm run generate
```

Ce script exécute `prisma generate` et `prisma db push`. En équipe, préférez souvent les **migrations** versionnées (`prisma migrate`) selon votre processus.

## Scripts npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run start` | Lance le build en production |
| `npm run lint` | ESLint |
| `npm run generate` | Prisma generate + db push |

## Utilisation

```bash
npm run dev
```

- **Site public** : [http://localhost:3000](http://localhost:3000) (accueil)
- **Administration** : [http://localhost:3000/admin-game](http://localhost:3000/admin-game) (après authentification compte autorisé)

Les fichiers uploadés côté contenu sont stockés sous le dossier **`uploads/`** à la racine du dépôt ; ils sont servis publiquement via la réécriture Next (`/uploads/...` → API dédiée).

## Architecture (aperçu)

| Élément | Emplacement |
|---------|-------------|
| Pages & layouts App Router | `src/app/` |
| Routes API | `src/app/api/` |
| Logique métier, auth, jeu, badges | `src/lib/` |
| Schéma & migrations Prisma | `prisma/` |
| Client Prisma généré | `generated/prisma/` |

### Parcours joueur — logique métier (role play)

Côté **client mobile ou web**, l’idée est de reproduire une **balade à énigmes** : le joueur choisit un parcours, avance **dans l’ordre** imposé par le serveur, puis **débloque le trésor** en deux temps (carte, puis coffre). Les routes ci-dessous ne remplacent pas l’UI : elles définissent **quand** appeler le backend et **dans quel sens**.

1. **Authentification** — Le joueur doit être connecté (**Better Auth**, cookies de session ou équivalent côté app). Toutes les routes de jeu « personnelles » vérifient que `userId` correspond à la session.

2. **Découverte (hors secret)** — Avant de partir, l’app peut charger le référentiel **villes** (`GET /api/game/cities`), le **catalogue** d’aventures actives (`GET /api/game/adventures`, filtres ville / texte / géoloc) et le **détail** d’une aventure (`GET /api/game/adventures/{id}`). Ces réponses sont « safe » : pas de réponses d’énigmes ni de codes trésor en clair ; elles servent au **role play** (titre, description, carte, nombre d’énigmes, présence d’un trésor).

3. **Synchronisation d’état** — `GET /api/game/progress?adventureId=…` retourne ce que le serveur a déjà enregistré (étapes validées, ce qui manque pour finir en succès). À utiliser au **chargement** de l’écran parcours, au **retour en ligne** ou après un crash, pour réaligner l’UI sur la vérité serveur.

4. **Énigmes, dans l’ordre** — Pour chaque étape, le joueur soumet une réponse via **`POST /api/game/validate-enigma`** avec `enigmaNumber` (1, 2, 3…). Le serveur exige l’**ordre séquentiel** : pas d’énigme 3 tant que 1 et 2 ne sont pas validées. Chaque succès enregistre une étape du type `enigma:1`, `enigma:2`, etc. C’est le cœur du **parcours narratif** jusqu’au dernier indice.

5. **Trésor : carte puis coffre** — Quand toutes les énigmes requises sont validées, le joueur enchaîne sur **`POST /api/game/validate-treasure`** (même `adventureId` / `userId`) :
   - **Premier code** — celui qui **révèle le trésor sur la carte** (fin d’énigme / code affiché côté parcours, comparé côté serveur aux codes « carte » du trésor). Réponse typique avec `stepKey` `treasure:map` : le role play est « j’ai trouvé où creuser sur le plan ».
   - **Deuxième code** — le code **physique dans le coffre** (ou équivalent). Réponse avec `stepKey` `treasure` : « j’ouvre le coffre ». C’est à cette soumission que le serveur exécute la **finalisation** : succès de l’aventure, **`giftNumber`** (nombre de cadeaux / badges côté joueur), attribution des **badges** virtuels et gestion du stock de badge physique si prévu.

   Le champ `phase` (`"map"` | `"chest"`) peut forcer l’étape ; sinon le serveur **déduit** (carte d’abord, coffre ensuite). Les anciennes parties avec une seule étape trésor restent gérées ; le détail est dans la spec OpenAPI.

6. **Après la victoire** — **`POST /api/game/adventure-review`** (JSON ou photo + avis) pour le **retour d’expérience** ; **`GET /api/user/badges`** pour afficher les badges obtenus. Les **publicités** (`/api/advertisements`, `/api/advertisements/events`) peuvent être affichées selon les règles produit sans bloquer le parcours.

En résumé : **auth → (optionnel) catalogue / détail → boucle `validate-enigma` → `validate-treasure` (carte puis coffre) → avis / badges**. La doc détaillée des corps de requête et des réponses est dans **`src/lib/openapi/grand-est-openapi-document.ts`** et l’UI Swagger admin mentionnée ci-dessous.

### API jeu et services (routes notables)

- Découverte : `GET /api/game/cities`, `GET /api/game/adventures`, `GET /api/game/adventures/{id}` (contenus non sensibles)
- Progression et validation : `/api/game/progress`, `validate-enigma`, `validate-treasure` (chaque parcours inclut un trésor)
- Trésor : `validate-treasure` — code **carte** puis **coffre** ; au coffre, **`giftNumber`** + badges / `UserAdventures` (finalisation)
- Avis fin de parcours : `POST /api/game/adventure-review` (JSON ou multipart)
- Publicités : `/api/advertisements`, `/api/advertisements/events`
- Badges joueur : `/api/user/badges`
- Authentification : `/api/auth/*` (Better Auth)

### Documentation OpenAPI

Une spec **OpenAPI 3.1** est maintenue dans `src/lib/openapi/grand-est-openapi-document.ts`. Le JSON est exposé sur **`GET /api/openapi`** (réservé aux sessions avec accès dashboard). L’interface **Swagger UI** sous **`/admin-game/dashboard/docs/api`** permet **« Try it out »** (requêtes même origine, cookies de session admin).

## Documentation complémentaire

- **[Better Auth + app Expo](docs/expo-better-auth.md)** — même backend `/api/auth`, variables d’environnement et scénarios local / production.
- **[ROADMAP-RESTE-A-FAIRE.md](ROADMAP-RESTE-A-FAIRE.md)** — backlog indicatif (schéma BDD, APIs, écarts produit).

## Stack principale

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL, Better Auth, Radix / shadcn, TipTap, Leaflet (cartes), Zod.

## Déploiement

Build classique : `npm run build` puis `npm run start`. Configurez les variables d’environnement sur votre hébergeur (`DATABASE_URL`, `BETTER_AUTH_*`, URL publique, SMTP, clés OAuth si besoin). Vérifiez que le dossier `uploads/` est persistant ou remplacez le stockage par un service distant selon votre infra.

---

*Projet privé — Balad'indice.*
