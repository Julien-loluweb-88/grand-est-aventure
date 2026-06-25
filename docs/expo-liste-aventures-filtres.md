# Expo — liste des aventures & filtres (`GET /api/game/adventures`)

Prompt et spec pour l'écran **bibliothèque / liste des parcours** dans l'app mobile Cursor Expo.

Backend : `GET /api/game/adventures` — catalogue **PUBLIC** actif uniquement (pas démo / dev).

Référentiel villes pour le sélecteur : `GET /api/game/cities` (`activeOnly=true` par défaut).

---

## Prompt Cursor (à coller)

```markdown
# Liste des aventures — filtres serveur

Écran « Bibliothèque » / liste des parcours : utiliser **`GET /api/game/adventures`** (pas un filtrage client sur `home.adventures` seul).

`EXPO_PUBLIC_API_URL` + session optionnelle (enrichit `playerState`, `myReview`).

## Réponse API

{
  "total": 12,
  "limit": 20,
  "offset": 0,
  "filters": {
    "cityId": "clx…",
    "q": "metz",
    "latitude": 49.12,
    "longitude": 6.18,
    "radiusKm": 25,
    "hasTreasure": true,
    "sort": "distance"
  },
  "adventures": [ ]
}

- **`filters`** : écho des filtres appliqués côté serveur — synchroniser l'UI (chips, tri actif).
- **`total`** : résultats après tous les filtres (avant pagination).
- Pagination : `limit` (défaut 20, max 100), `offset`.

## Query params

| Param | Type | Description |
|-------|------|-------------|
| `cityId` | string | Ville (`GET /api/game/cities` → `id`) |
| `q` | string | Recherche sur le **nom** du parcours |
| `latitude` + `longitude` | number | Ensemble — `distanceFromUserKm` |
| `radiusKm` | number | Rayon km — nécessite GPS |
| `hasTreasure` | boolean | `true` / `false` |
| `sort` | enum | `distance`, `updated`, `popular`, `rating`, `name` |
| `limit` / `offset` | int | Pagination |

### Tri `sort`

| Valeur | Comportement | Prérequis |
|--------|--------------|-----------|
| `distance` | Plus proche d'abord | GPS (défaut si lat/lon) |
| `updated` | Dernière MAJ admin | Défaut sans GPS |
| `popular` | `playDurationSampleCount` ↓ | — |
| `rating` | Moyenne avis ↓ | — |
| `name` | A → Z | — |

Erreurs **400** : lat/lon incohérents ; `radiusKm` sans GPS ; `sort=distance` sans GPS.

## Implémentation Expo

1. **Villes** : `GET /api/game/cities?activeOnly=true` → picker `cityId`.
2. **État filtres** : `cityId`, `q`, `hasTreasure` (null | true | false), `sort`, `radiusKm` + GPS `expo-location`.
3. **Fetch** : construire `URLSearchParams` ; auth Better Auth si connecté.
4. **UI** : debounce recherche ; tri `distance` désactivé sans GPS ; pagination `offset += limit` tant que `offset + length < total`.
5. **Ne pas** filtrer `audience` côté client.

## Accueil vs bibliothèque

| Écran | Route | Filtres liste |
|-------|-------|----------------|
| Accueil | `GET /api/game/home` | Pas de `cityId`/`q`/`radiusKm` sur adventures |
| Bibliothèque | `GET /api/game/adventures` | Tous les filtres |

Quand l'utilisateur ouvre la bibliothèque ou change un filtre → appeler `adventures`, pas filtrer `home.adventures` en local.
```

---

## Fichiers backend

- `src/app/api/game/adventures/route.ts`
- `src/lib/game/catalog-list-query.ts`
- `src/lib/game/mobile-adventure-catalog.ts`
