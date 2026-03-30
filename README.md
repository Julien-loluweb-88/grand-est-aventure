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

- **Site public** : [http://localhost:3000](http://localhost:3000) (accueil, lien connexion)
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

### API jeu et services (routes notables)

- Progression et validation : `/api/game/progress`, `validate-enigma`, `validate-treasure`, `finish`
- Avis fin de parcours : `/api/game/AdventureReview`
- Publicités : `/api/advertisements`, `/api/advertisements/events`
- Badges joueur : `/api/user/badges`
- Authentification : `/api/auth/*` (Better Auth)

### Documentation OpenAPI

Une spec **OpenAPI 3.1** est maintenue dans `src/lib/openapi/grand-est-openapi-document.ts`. Le JSON est exposé sur **`GET /api/openapi`** (réservé aux sessions avec accès dashboard). L’interface **Swagger UI** (lecture seule, sans exécution des requêtes) est disponible sous **`/admin-game/dashboard/docs/api`** après connexion admin.

## Documentation complémentaire

- **[Better Auth + app Expo](docs/expo-better-auth.md)** — même backend `/api/auth`, variables d’environnement et scénarios local / production.
- **[ROADMAP-RESTE-A-FAIRE.md](ROADMAP-RESTE-A-FAIRE.md)** — backlog indicatif (schéma BDD, APIs, écarts produit).

## Stack principale

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL, Better Auth, Radix / shadcn, TipTap, Leaflet (cartes), Zod.

## Déploiement

Build classique : `npm run build` puis `npm run start`. Configurez les variables d’environnement sur votre hébergeur (`DATABASE_URL`, `BETTER_AUTH_*`, URL publique, SMTP, clés OAuth si besoin). Vérifiez que le dossier `uploads/` est persistant ou remplacez le stockage par un service distant selon votre infra.

---

*Projet privé — Balad'indice.*
