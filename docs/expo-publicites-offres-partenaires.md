# Prompt Cursor — App Expo joueur : publicités & offres partenaires (Balad'indice)

> Document prêt à coller dans Cursor (projet Expo). Backend = repo **grand-est-aventure** (Next.js + Prisma).
> OpenAPI : `GET /api/openapi` ou admin `/admin-game/dashboard/docs/api`.

---

## Contexte

Intégrer côté **app mobile Expo (joueur)** le flux publicités commerçants + offres partenaires, aligné sur le backend **Balad'indice** déjà implémenté.

- **Auth** : session **Better Auth** (cookies) sur les routes protégées joueur.
- **Base URL** : `EXPO_PUBLIC_API_URL` (origine HTTPS du backend).
- **Images** : chemins relatifs `/uploads/...` → préfixer `EXPO_PUBLIC_API_URL`.

---

## Modèle produit (important pour l’UI)

### Deux couches distinctes sur chaque encart pub

| Couche | Contenu | Change souvent ? | Où l’afficher |
|--------|---------|------------------|---------------|
| **Publicité** | `title`, `body`, `imageUrl`, `targetUrl` | Oui (promo du moment : « -15 % », « -10 % »…) | Encart pub / fiche détail |
| **Badge partenaire** | `partnerOffer.badgeTitle`, `partnerOffer.badgeImageUrl` | Non (stable, ex. « PMU Raon · EMP1 ») | Collection badges + demande validation |

- Le **commerçant** remplit la promo dans la pub.
- Le **superadmin** fixe le **nom du badge** + **image du badge**.
- L’offre partenaire (validation en commerce) est **optionnelle** : une pub peut exister sans `partnerOffer`.

### Cycles de promo (`partnerOfferGeneration` — logique serveur)

Quand le commerçant **change le contenu pub** (titre, texte ou image) et que le superadmin **valide** :

- Le serveur incrémente une **génération d’offre** interne.
- Le plafond `maxRedemptionsPerUser` repart **pour la promo en cours**.
- Un joueur qui avait déjà validé l’**ancienne** promo peut **redemander** pour la **nouvelle**.
- **Pas de doublon de badge** : 1 seul `UserBadge` par badge / joueur (upsert serveur).
- Les demandes `PENDING` sur l’ancienne génération sont **expirées** automatiquement.

**UI joueur** : afficher la promo depuis `title`/`body` de la pub ; le badge en collection garde le **nom stable** (`badgeTitle`).

---

## Ce que le joueur NE voit PAS

Statuts admin commerçant (jamais exposés API joueur) : `SLOT_EMPTY`, `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`.

Le joueur ne voit que des pubs **actives**, dans la fenêtre de dates, contenu **déjà validé** par le superadmin.

---

## Types TypeScript (source de vérité côté app)

```typescript
export type AdvertisementPlacement = "home" | "library";

export type PartnerOfferClaimStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type AdvertisementEventType = "IMPRESSION" | "CLICK";

export type AdvertisementItem = {
  id: string;
  title: string | null;        // Promo du moment
  body: string | null;
  imageUrl: string | null;
  targetUrl: string | null;    // Lien externe au tap (optionnel)
  advertiserName: string;
  sortOrder: number;
  startsAt: string | null;     // ISO 8601 — début campagne ; null = pas de borne
  endsAt: string | null;       // ISO 8601 — fin campagne ; null = pas de borne
  partnerOffer: PartnerOffer | null;  // null = pas d'offre partenaire
};

export type PartnerOffer = {
  open: boolean;                 // false = plus de nouvelles demandes
  maxRedemptionsPerUser: number; // Plafond pour la promo EN COURS (1–100)
  badgeTitle: string | null;     // Nom stable collection (PAS la promo)
  badgeImageUrl: string | null;  // Image badge ; fallback = imageUrl encart
};

export type AdvertisementListResponse = {
  advertisements: AdvertisementItem[];
};

export type PartnerOfferClaimRow = {
  id: string;
  advertisementId: string;
  status: PartnerOfferClaimStatus;
  createdAt: string;           // ISO
  resolvedAt: string | null;
  rejectionReason: string | null;
  advertiserName: string | null;
  advertisementTitle: string | null;  // Promo au moment de la demande
  badgeTitle: string | null;
  badgeImageUrl: string | null;
};

export type PartnerOfferClaimsResponse = {
  claims: PartnerOfferClaimRow[];  // 80 dernières, tri desc createdAt
  summaryByAdvertisementId: Record<
    string,
    {
      pending: boolean;
      approvedCount: number; // total historique (toutes générations)
      approvedCountForCurrentOffer: number; // promo en cours uniquement
    }
  >;
};

export type UserBadgeCatalogItem = {
  id: string;           // BadgeDefinition id
  slug: string;
  title: string;
  imageUrl: string | null;
  kind: "PARTNER_OFFER" | /* autres kinds */;
  earned: boolean;
  earnedAt: string | null;
  userBadgeId: string | null;
};
```

**Règle image badge** : si `badgeImageUrl` null, réutiliser `imageUrl` de l’encart (même règle serveur).

---

## Endpoints — référence complète

### 1. Liste des publicités

**`GET /api/advertisements?placement={home|library}&latitude=&longitude=&cityId=`**

| Param | Obligatoire | Notes |
|-------|-------------|-------|
| `placement` | oui | `home` \| `library` |
| `latitude`, `longitude` | non | Filtre disque + inférence ville (API Gouv INSEE + repli catalogue ≤ 15 km) |
| `cityId` | non | Override explicite si l’écran connaît déjà la ville |

- **Publique** (pas de session requise).
- **Avec session** : exclusion des encarts masqués (`POST /api/user/advertisement-dismissals`).
- Réponse : `{ advertisements: AdvertisementItem[] }`.

**Alternative accueil** : `GET /api/game/home` inclut déjà `advertisements[]` (placement `home`) + `locationContext` (même schéma encart).

**Écran bibliothèque** : utiliser **`placement=library`** — ne pas réutiliser les pubs de `game/home`.

**Période de validité (affichage « Du … au … »)** : champs **`startsAt`** et **`endsAt`** sur l’encart racine (ISO 8601, `null` = pas de borne). Pas sur `partnerOffer`. Le serveur filtre déjà les pubs hors fenêtre ; ces dates servent à l’affichage joueur uniquement.

```typescript
function formatAdValidity(ad: AdvertisementItem): string | null {
  const start = ad.startsAt ? new Date(ad.startsAt) : null;
  const end = ad.endsAt ? new Date(ad.endsAt) : null;
  if (!start && !end) return null;
  // formater en locale fr-FR selon votre UI
  return [start, end].filter(Boolean).map(/* … */).join(" – ");
}
```

---

### 2. Analytics — impression & clic

**`POST /api/advertisements/events`**

```json
{ "advertisementId": "…", "type": "IMPRESSION" | "CLICK" }
```

→ `{ "ok": true }`

| Champ | Règle |
|-------|-------|
| Session | **Optionnelle** (`userId` null si anonyme) |
| Rate limit | ~200 req/min (IP + user si connecté) |
| Erreurs | 400 corps invalide / pub inactive · 404 pub introuvable · 429 + `Retry-After` |

**Quand envoyer IMPRESSION**

- L’encart est **réellement visible** à l’écran (pas au simple mount hors viewport).
- Une fois par **affichage significatif** : ex. ≥ 50 % de la carte visible pendant ≥ 1 s.
- Dédupliquer en mémoire par `(advertisementId, sessionScreen)` pour éviter le spam au scroll.
- Ne pas bloquer l’UI si l’appel échoue (fire-and-forget + log).

**Quand envoyer CLICK**

- Tap sur l’encart entier **ou** CTA « En savoir plus » / ouverture fiche détail.
- Tap sur lien externe (`targetUrl`) : CLICK **puis** ouverture navigateur.
- Tap « Demander validation » : **ne pas** compter CLICK ici (action métier distincte via claims).

---

### 3. Masquer une pub (dismissals)

**`POST /api/user/advertisement-dismissals`**

```json
{ "advertisementId": "…" }
```

→ `{ "ok": true }` — **idempotent**.

| Champ | Règle |
|-------|-------|
| Session | **Obligatoire** (401 si non connecté) |
| Rate limit | ~30/min |
| Effet | La pub disparaît des prochains `GET /api/advertisements` et `GET /api/game/home` pour ce compte |

**UI dismissals**

- Icône « ✕ » / « Masquer » sur chaque encart (home + library).
- Si **non connecté** : proposer connexion ou masquer localement seulement (non persisté serveur).
- Après succès : retirer l’item du state local immédiatement (optimistic UI).
- Pas de « Annuler masquage » côté API pour l’instant — traiter comme définitif.

---

### 4. Créer une demande de validation

**`POST /api/partner-offers/claims`**

```json
{ "advertisementId": "…" }
```

→ `{ "claimId": "…" }`

**Prérequis UI**

- Joueur **connecté**
- `partnerOffer != null`
- `partnerOffer.open === true`
- Pas de demande `PENDING` en cours pour cette pub

**Erreurs 400** (afficher `error` tel quel, en français) :

- « Cette offre n'accepte pas de nouvelles demandes pour le moment. »
- « Une demande est déjà en attente pour cette offre. »
- « Vous avez déjà atteint le nombre maximum de validations pour cette offre. »

**401** non connecté · **404** pub introuvable · **429** + `Retry-After`  
Rate limit POST : ~15/min.

---

### 5. Historique des demandes joueur

**`GET /api/partner-offers/claims`**

Réponse : `PartnerOfferClaimsResponse` (voir types ci-dessus).

**Résumé par pub (`summaryByAdvertisementId`)**

| Champ | Usage UI |
|-------|----------|
| `pending` | Désactiver le CTA si `true` |
| `approvedCount` | Historique total (affichage « Mes demandes ») |
| `approvedCountForCurrentOffer` | Comparer à `partnerOffer.maxRedemptionsPerUser` pour masquer le CTA sur la **promo en cours** |

Si la pub n’apparaît pas dans le résumé (jamais de demande) : traiter `approvedCountForCurrentOffer` comme **0**.

```typescript
function canRequestValidation(
  ad: AdvertisementItem,
  summary?: PartnerOfferClaimsResponse["summaryByAdvertisementId"][string]
): boolean {
  if (!ad.partnerOffer?.open) return false;
  if (summary?.pending) return false;
  const current = summary?.approvedCountForCurrentOffer ?? 0;
  return current < ad.partnerOffer.maxRedemptionsPerUser;
}
```

---

### 6. Collection badges joueur

**`GET /api/user/badges`**

Rubrique **`PARTNER_OFFER`** : voir `UserBadgeCatalogItem`.

Après validation commerçant approuvée : `earned: true` (upsert serveur — pas de doublon collection).

---

## Statuts demande (`PartnerOfferClaimStatus`)

| Statut | Signification | UI suggérée |
|--------|---------------|-------------|
| `PENDING` | En attente validation commerçant (< 24 h) | Badge « En attente », désactiver nouveau POST |
| `APPROVED` | Validé — badge obtenu / conservé | Succès, check vert |
| `REJECTED` | Refusé par commerçant | Afficher `rejectionReason` si présent |
| `EXPIRED` | PENDING > **24 h** sans réponse (cron) | Proposer de redemander si `partnerOffer.open` |

Expiration : cron serveur `GET /api/cron/expire-partner-claims` (header `Authorization: Bearer $CRON_SECRET`).

---

## Logique UI — bouton « Demander validation »

Afficher le CTA si **toutes** les conditions :

1. Utilisateur connecté
2. `advertisement.partnerOffer != null`
3. `advertisement.partnerOffer.open === true`
4. `summaryByAdvertisementId[adId]?.pending !== true`
5. `(summary?.approvedCountForCurrentOffer ?? 0) < partnerOffer.maxRedemptionsPerUser`

`approvedCount` (sans suffixe) reste utile pour l’historique ; **ne pas** l’utiliser pour masquer le CTA.

Libellés suggérés :

- CTA actif : « J'ai profité de l'offre » / « Demander ma validation »
- `pending` : « Demande en cours… »
- `open === false` : « Offre fermée » (badge collection conservé si déjà earned)
- Après POST plafond atteint : toast message serveur + masquer CTA jusqu’au prochain cycle promo

---

## Client API Expo — fonctions à brancher

Tu as déjà `fetchAdvertisements` — **il n’est appelé nulle part** : le brancher ci-dessous.

```typescript
// lib/api/advertisements.ts (adapter chemins existants)

export async function fetchAdvertisements(params: {
  placement: AdvertisementPlacement;
  latitude?: number;
  longitude?: number;
  cityId?: string;
}): Promise<AdvertisementItem[]> {
  const qs = new URLSearchParams({ placement: params.placement });
  if (params.latitude != null) qs.set("latitude", String(params.latitude));
  if (params.longitude != null) qs.set("longitude", String(params.longitude));
  if (params.cityId) qs.set("cityId", params.cityId);

  const res = await apiFetch(`/api/advertisements?${qs}`);
  if (!res.ok) throw new ApiError(res);
  const data = (await res.json()) as AdvertisementListResponse;
  return data.advertisements;
}

export async function postAdvertisementEvent(
  advertisementId: string,
  type: AdvertisementEventType
): Promise<void> {
  await apiFetch("/api/advertisements/events", {
    method: "POST",
    body: JSON.stringify({ advertisementId, type }),
  });
}

export async function dismissAdvertisement(advertisementId: string): Promise<void> {
  await apiFetch("/api/user/advertisement-dismissals", {
    method: "POST",
    body: JSON.stringify({ advertisementId }),
  });
}

export async function createPartnerOfferClaim(advertisementId: string): Promise<string> {
  const res = await apiFetch("/api/partner-offers/claims", {
    method: "POST",
    body: JSON.stringify({ advertisementId }),
  });
  if (!res.ok) throw new ApiError(res);
  const data = (await res.json()) as { claimId: string };
  return data.claimId;
}

export async function fetchPartnerOfferClaims(): Promise<PartnerOfferClaimsResponse> {
  const res = await apiFetch("/api/partner-offers/claims");
  if (!res.ok) throw new ApiError(res);
  return res.json();
}
```

Réutiliser le client `apiFetch` existant (cookies Better Auth, gestion 401/429).

Helper image :

```typescript
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.EXPO_PUBLIC_API_URL}${path}`;
}

export function badgeImageForAd(ad: AdvertisementItem): string | null {
  return resolveMediaUrl(
    ad.partnerOffer?.badgeImageUrl ?? ad.imageUrl
  );
}
```

---

## Écrans à implémenter

### A. Encart pub — accueil (`placement=home`)

- Source : `GET /api/game/home` → `advertisements[]` (déjà prévu) **ou** `fetchAdvertisements({ placement: "home", ... })`.
- Carte horizontale / bannière dans le carrousel accueil existant.
- IMPRESSION au viewport · CLICK au tap · dismiss si connecté.

### B. Carrousel bibliothèque — **`app/aventures/index.tsx`** ⭐ (priorité)

**Contexte** : l’écran **Aventures / bibliothèque** affiche le catalogue des parcours. C’est l’écran cible admin pour `placement=library`.

**Brancher le fetch**

```typescript
// app/aventures/index.tsx — pseudo-intégration

const { latitude, longitude } = useLocation(); // hook GPS existant
const cityId = selectedCity?.id; // si filtre ville actif

const { data: libraryAds = [], refetch } = useQuery({
  queryKey: ["advertisements", "library", cityId, latitude, longitude],
  queryFn: () =>
    fetchAdvertisements({
      placement: "library",
      cityId,
      latitude,
      longitude,
    }),
  staleTime: 5 * 60_000,
});
```

**Placement UI**

- Section **au-dessus** de la liste des aventures (sous le header / filtres ville), titre ex. « Partenaires » ou « Offres près de chez vous ».
- **Carrousel horizontal** (`FlatList` horizontal ou `ScrollView`) si `libraryAds.length > 0`.
- Masquer toute la section si tableau vide (pas de placeholder vide).

**Carte encart library**

- Ratio image ~ 16:9 ou 4:3, `imageUrl` en cover.
- Sous-titre : `advertiserName` · extrait `body` (2 lignes max).
- Titre promo : `title`.
- Si `partnerOffer` : petit chip badge (`badgeImageUrl` 24×24 + `badgeTitle` tronqué).
- Actions : tap carte → fiche détail ; bouton ✕ → dismiss (si connecté).

**Composant réutilisable**

Extraire `<AdvertisementCarousel placement="library" ads={libraryAds} onDismiss={...} />` partageable avec home si le design le permet (variant `compact` | `hero`).

### C. Fiche pub / modal détail

Route suggérée : `app/publicites/[id].tsx` ou modal depuis home/library.

Contenu :

- Image pleine largeur, `title`, `body` complet, `advertiserName`.
- Si `targetUrl` : bouton « Voir le site » → CLICK event + `Linking.openURL`.
- Bloc offre partenaire si `partnerOffer` :
  - Visuel badge + `badgeTitle` (stable)
  - Texte promo = `title` / `body` (pas le badgeTitle)
  - CTA validation (logique ci-dessus)
  - Lien « Mes demandes » vers historique claims
- Bouton « Masquer cette pub » en bas (secondaire).

Au mount : IMPRESSION si pas déjà comptée depuis le carrousel (éviter double comptage même session).

### D. Mes demandes d’offres

Écran : `app/offres-partenaires/index.tsx` (ou section profil).

- `GET /api/partner-offers/claims` au focus.
- Liste triée `createdAt` desc.
- Par ligne : enseigne (`advertiserName`), promo (`advertisementTitle`), badge, statut coloré, dates.
- Détail expand / modal : `rejectionReason`, `resolvedAt`.
- Pull-to-refresh.

### E. Collection badges — rubrique `PARTNER_OFFER`

- `GET /api/user/badges` → filtrer `kind === "PARTNER_OFFER"`.
- `earned: false` → grisé ; `earned: true` → plein.
- Titre affiché = `title` (= nom badge stable serveur).

---

## Composant encart — props suggérées

```typescript
type AdvertisementCardProps = {
  ad: AdvertisementItem;
  variant: "home" | "library";
  claimSummary?: PartnerOfferClaimsResponse["summaryByAdvertisementId"][string];
  onPress: () => void;
  onDismiss?: () => void;
  onRequestValidation?: () => void;
};
```

Tracking impression : wrapper `<View onLayout>` + `IntersectionObserver` pattern ou lib `react-native-intersection-observer` si dispo.

---

## Auth & réseau

- Cookies session sur toutes les routes protégées (`dismissals`, `claims` POST/GET, `badges`).
- **401** → redirect login avec retour écran courant.
- **429** → toast « Réessayez dans X s » (`Retry-After`).
- Events analytics : peuvent rester sans session.

---

## Flux utilisateur (résumé)

```
1. Accueil : GET /api/game/home (advertisements home + GPS)
2. Bibliothèque : fetchAdvertisements({ placement: "library", GPS/cityId })
3. IMPRESSION quand encart visible ; CLICK au tap
4. Fiche détail ; si partnerOffer.open → « J'ai profité de l'offre »
5. POST /api/partner-offers/claims → PENDING
6. Commerçant approuve (hors app joueur)
7. GET claims → APPROVED ; GET badges → PARTNER_OFFER earned
8. Nouvelle promo validée admin → joueur peut redemander (même badge, pas de doublon)
9. Masquer encart → POST dismissals → disparaît des listes
```

---

## Hors scope joueur

- Dashboard commerçant / superadmin
- `POST /api/merchant/partner-claims/*` (rôle merchant)
- Création / édition pubs

---

## Checklist d’acceptation

- [ ] **`fetchAdvertisements({ placement: "library" })` appelé sur `app/aventures/index.tsx`**
- [ ] Carrousel library visible quand ≥ 1 pub éligible ; section cachée si vide
- [ ] Encarts home via `game/home` ou `placement=home`
- [ ] Filtrage geo (GPS et/ou `cityId`) cohérent avec l’écran
- [ ] IMPRESSION viewport ; CLICK tap ; pas de double IMPRESSION même session
- [ ] Dismiss persisté (connecté) ; disparition immédiate UI
- [ ] Pub sans `partnerOffer` : pas de CTA validation
- [ ] `partnerOffer.open === false` : pas de CTA ; badge collection conservé si earned
- [ ] Demande PENDING : pas de second POST
- [ ] Après APPROVED : badge visible PARTNER_OFFER (1 seule fois en collection)
- [ ] Changement promo : joueur peut redemander (`approvedCountForCurrentOffer` repart à 0)
- [ ] EXPIRED > 24 h : UX claire + redemande si `open`
- [ ] Fiche détail pub complète (lien externe, validation, dismiss)
- [ ] Écran historique claims
- [ ] Messages d’erreur serveur affichés tels quels (français)
- [ ] Images `/uploads/...` résolues avec `EXPO_PUBLIC_API_URL`

---

## Ordre d’implémentation recommandé

1. Brancher `fetchAdvertisements("library")` + carrousel sur `app/aventures/index.tsx`
2. Composant `<AdvertisementCard>` + fiche détail
3. Events IMPRESSION / CLICK
4. Dismissals UI
5. Claims POST + écran historique
6. Intégration CTA validation + sync `GET /api/partner-offers/claims` pour `summaryByAdvertisementId`
7. Vérifier rubrique PARTNER_OFFER dans collection badges

Implémenter en suivant les patterns existants du projet Expo (navigation, hooks API, composants UI). **OpenAPI = source de vérité** pour les champs exacts.
