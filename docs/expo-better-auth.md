# Better Auth et l’app Expo (React Native)

Ce dépôt **Next.js** héberge Better Auth (`/api/auth/...`), la base PostgreSQL (Prisma) et l’admin web. L’**application mobile Expo** est un **client** : elle envoie des requêtes HTTP vers ce serveur pour se connecter, créer un compte et rafraîchir la session.

## Ce qui a été ajouté côté serveur (ce repo)

1. **Package** `@better-auth/expo` — plugin serveur officiel pour Expo.
2. **`expo()`** dans la liste des plugins Better Auth (`src/lib/auth.ts`), en tête de liste pour que les hooks (OAuth / redirections custom scheme) s’appliquent correctement.
3. **`trustedOrigins`** — deep links autorisés après connexion OAuth ou flux qui redirigent vers l’app. Définis dans `src/lib/better-auth-expo-trusted-origins.ts` à partir des variables d’environnement.

Better Auth ajoute **automatiquement** l’origine du site (dérivée de `BETTER_AUTH_URL` / `baseURL`) aux origines de confiance : le **navigateur web** (`http://localhost:3000`, `https://ton-domaine.fr`, etc.) continue de fonctionner sans les dupliquer dans `trustedOrigins`.

## Variables d’environnement (Next.js / `.env`)

| Variable | Rôle |
|----------|------|
| `BETTER_AUTH_URL` | URL publique du site (déjà utilisée). Ex. `http://localhost:3000` ou `https://www.example.com`. Sert aux callbacks OAuth et à l’origine web de confiance. |
| `BETTER_AUTH_EXPO_SCHEME` | Schéma deep link de l’app Expo (doit correspondre à `expo.scheme` dans `app.json`). Défaut : `grandestaventure`. |
| `BETTER_AUTH_TRUSTED_ORIGINS_EXTRA` | Optionnel. Liste séparée par des virgules d’origines ou motifs supplémentaires (ex. second schéma `myapp-staging://`). |

En **développement** (`NODE_ENV=development`), le serveur autorise en plus des motifs du type `exp://**` et `exp://192.168.*.*:*/**` pour Expo Go / tunnel. **Ne pas compter sur ces motifs en production.**

## Comment ça fonctionne côté Expo

1. Tu installes sur le **projet Expo** : `better-auth`, `@better-auth/expo`, `expo-secure-store`, `expo-network`, et pour le social : `expo-linking`, `expo-web-browser`, `expo-constants` (voir la [doc officielle Expo](https://www.better-auth.com/docs/integrations/expo)).
2. Tu crées un client avec `createAuthClient` depuis `better-auth/react` et le plugin **`expoClient`** (`@better-auth/expo/client`) avec le **même** `scheme` que `BETTER_AUTH_EXPO_SCHEME` / `app.json`.
3. **`baseURL`** du client Expo doit pointer vers la **racine de l’API Better Auth** sur ce serveur, en général :  
   `{origine}/api/auth`  
   (sauf si tu as changé `basePath` côté Next).

Le plugin Expo côté app :

- stocke les **cookies de session** dans le **SecureStore** ;
- pour l’OAuth, ouvre le navigateur système et gère le retour vers l’app via **deep link** ;
- envoie un en-tête **`expo-origin`** que le plugin serveur `expo()` peut utiliser pour l’alignement d’origine.

Pour tes **routes API métier** (jeu, profil, etc.), la doc Expo Better Auth recommande de passer le header **`Cookie`** obtenu via `authClient.getCookie()` sur tes `fetch`, avec `credentials: "omit"` pour éviter les conflits.

**Routes jeu (parcours)** — même session (cookies) :  
`POST /api/game/start-adventure`, `validate-enigma`, `validate-finish`, `validate-treasure`, `GET/POST …/adventure-partner-lots` (état, `spin`, `redeem`), `claim-discovery`, etc.  
Détail des corps, codes d’erreur et ordre d’appel : **`README.md`** (section *Parcours joueur* + *Checklist intégration mobile*), **`docs/integration-app-mobile-checklist.md`** (phases détaillées) et **`GET /api/openapi`** (spec OpenAPI).

---

## Exemple local : Next.js + Expo

### 1. Next.js (ce repo)

`.env` (extrait) :

```env
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_EXPO_SCHEME=grandestaventure
```

Lancer le serveur :

```bash
pnpm dev
# → http://localhost:3000 , API auth → http://localhost:3000/api/auth
```

### 2. Expo sur un **émulateur / appareil réel** (même machine Wi‑Fi)

`localhost` sur le téléphone **n’est pas** ton PC. Utilise l’**IP LAN** de ta machine, par ex. `192.168.1.42` :

**`.env` côté app Expo** (souvent `EXPO_PUBLIC_...`) :

```env
EXPO_PUBLIC_BETTER_AUTH_URL=http://192.168.1.42:3000/api/auth
```

**`app.json`** (extrait) :

```json
{
  "expo": {
    "scheme": "grandestaventure"
  }
}
```

Le schéma doit être le **même** que `BETTER_AUTH_EXPO_SCHEME` sur le serveur.

### 3. Expo sur simulateur iOS / Android utilisant `localhost`

Sur simulateur **iOS**, `localhost` pointe souvent vers la machine hôte : tu peux tester avec :

```env
EXPO_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

Sur **Android emulator**, `10.0.2.2` mappe souvent vers le host :

```env
EXPO_PUBLIC_BETTER_AUTH_URL=http://10.0.2.2:3000/api/auth
```

### 4. Exemple minimal `lib/auth-client.ts` (Expo)

```ts
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

const baseURL =
  process.env.EXPO_PUBLIC_BETTER_AUTH_URL?.replace(/\/$/, "") ?? "";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "grandestaventure",
      storagePrefix: "grandestaventure",
      storage: SecureStore,
    }),
  ],
});
```

Adapte `scheme` / `storagePrefix` si tu changes `BETTER_AUTH_EXPO_SCHEME`.

---

## Exemple production

### Next.js (hébergement HTTPS)

```env
BETTER_AUTH_URL=https://www.example.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://www.example.com
BETTER_AUTH_EXPO_SCHEME=grandestaventure
```

Pas besoin des motifs `exp://…` : ils ne sont ajoutés **que** en `NODE_ENV=development`.

### App Expo (build store ou EAS)

```env
EXPO_PUBLIC_BETTER_AUTH_URL=https://www.example.com/api/auth
```

Vérifie que :

- le certificat TLS est valide ;
- les **redirect URIs** des fournisseurs OAuth (Google, Facebook, Discord, etc.) incluent bien  
  `https://www.example.com/api/auth/callback/<provider>`  
  comme pour le web.

---

## OAuth social depuis l’app native

- `signIn.social` avec un `callbackURL` **relatif** (ex. `"/jeu"`) est transformé en deep link du type `grandestaventure://jeu` par le client Expo.
- Sur **natif**, la navigation après succès ne se fait pas toute seule : gère `router.replace` / navigation après la promesse (voir la doc Better Auth Expo).
- Alternative **Google** : flux **idToken** avec `@react-native-google-signin/google-signin` + `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / iOS client id — sans changer la config serveur Google au-delà des bons client IDs.

---

## Fichiers utiles dans ce repo

| Fichier | Rôle |
|---------|------|
| `src/lib/auth.ts` | Instance Better Auth + plugin `expo()`. |
| `src/lib/better-auth-expo-trusted-origins.ts` | Construction de `trustedOrigins` pour Expo. |
| `src/app/api/auth/[...all]/route.ts` | Handler Next pour toutes les routes `/api/auth/*`. |

## Références

- [Better Auth — Expo](https://www.better-auth.com/docs/integrations/expo)
- [Better Auth — Options (trustedOrigins)](https://www.better-auth.com/docs/reference/options#trustedorigins)
