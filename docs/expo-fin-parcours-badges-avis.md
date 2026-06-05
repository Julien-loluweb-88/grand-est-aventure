# Expo — écran victoire, badges gagnés et avis

Prompt pour l’app mobile (Cursor Expo). Routes : `POST /api/game/validate-treasure`, `POST /api/game/validate-finish`, `POST /api/game/adventure-review`.

OpenAPI : schémas `AwardedBadgeDetail`, `GameFinishSuccessOk`, `ValidateTreasureOk`.

---

## Prompt Cursor Expo (copier-coller)

```
Contexte : à la fin d’une aventure, le backend renvoie directement les badges virtuels gagnés
(titre + image) dans la réponse de finalisation. Tu n’as plus besoin de `GET /api/user/badges`
uniquement pour afficher l’écran de victoire / avis.

### 1. Finaliser la partie

**Avec trésor** (après toutes les énigmes) :
POST /api/game/validate-treasure
{ "adventureId", "userId", "code", "giftNumber?" }

**Sans trésor** :
POST /api/game/validate-finish
{ "adventureId", "userId" }

### 2. Réponse succès (première finalisation)

```ts
type AwardedBadgeDetail = {
  userBadgeId: string;
  badgeDefinitionId: string;
  title: string;
  imageUrl: string | null;
  kind: string;           // ex. ADVENTURE_COMPLETE, MILESTONE_ADVENTURES
  adventureId: string | null;
};

type GameFinishSuccess = {
  ok: true;
  stepKey: "treasure" | "finish";
  awardedUserBadgeIds: string[];   // ids UserBadge (legacy / debug)
  awardedBadges: AwardedBadgeDetail[];  // ← AFFICHER ÇA
  giftNumber: number;              // badge physique n° (0 si N/A)
  message: string;                 // ex. "Aventure terminée avec succès"
};
```

Cas `alreadyValidated: true` (trésor) ou `alreadyFinished: true` (sans trésor) :
pas de `awardedBadges` — ne pas ré-afficher la célébration.

### 3. Écran victoire → avis (navigation)

Après succès, naviguer vers `VictoryReviewScreen` avec le payload en params :

```ts
navigation.navigate("VictoryReview", {
  adventureId,
  adventureName,       // depuis le cache fiche aventure
  awardedBadges,       // depuis la réponse finish
  giftNumber,            // depuis la réponse finish
});
```

### 4. UI écran VictoryReview

```
┌─────────────────────────────────────┐
│  🎉 Aventure terminée !             │
│                                     │
│  [image] Titre badge 1              │  ← awardedBadges.map
│  [image] Titre badge 2              │
│                                     │
│  Badge physique n° {giftNumber}     │  ← si giftNumber > 0
│                                     │
│  ─── Votre avis (optionnel) ───     │
│  ★★★★★  (1-5 ou vide)              │
│  Commentaire multiline              │
│  ☐ Plus de badge au coffre          │  → reportsMissingBadge
│  ☐ Trésor introuvable / volé        │  → reportsStolenTreasure
│  [ Envoyer l’avis ]                 │
│  [ Passer ]                         │
└─────────────────────────────────────┘
```

- `awardedBadges.length === 0` : message du type « Parcours terminé ! » (rejoué sans nouveau badge).
- Images : `imageUrl` absolu ou préfixer avec `baseURL` uploads si relatif.
- Grouper visuellement par `kind` si plusieurs badges (aventure vs palier global).

### 5. Envoyer l’avis

POST /api/game/adventure-review (JSON ou multipart si photo)

```json
{
  "adventureId": "...",
  "userId": "...",
  "rating": 4,
  "content": "Super parcours !",
  "reportsMissingBadge": false,
  "reportsStolenTreasure": false,
  "consentCommunicationNetworks": false
}
```

Au moins un champ requis parmi : note, texte, signalements, consentement, photo.

Puis enchaîner Phase 5 (roue partenaires si `GET adventure-partner-lots`, etc.).

### 6. Rejeu vs reset admin — ne pas confondre

**`isReplay` n’existe pas côté backend** : c’est une heuristique Expo. Elle doit venir du **serveur**, pas du cache local :

```ts
// Source de vérité (GET /api/game/adventures/{id} ou GET /api/game/progress)
const isReplay = adventure.userAdventure?.success === true;
// ou : progress.userAdventure?.success === true
```

| Situation | `userAdventure` serveur | Comportement attendu |
|-----------|-------------------------|----------------------|
| Reset admin OK | `null` | **Première victoire** — appeler `validate-treasure`, lire `awardedBadges` |
| Rejeu réel | `{ success: true, giftNumber: N }` | Pas de nouveaux badges ; fallback ci-dessous |
| Reset admin mais cache local | serveur `null`, local encore `giftNumber: 3` | **Bug app** — resync obligatoire |

**Après reset admin** (Outils joueur) :
1. Appeler `GET /api/game/progress?adventureId=…` ou recharger la fiche aventure.
2. **Effacer** la progression locale (étapes validées, `giftNumber`, flags « terminé »).
3. Au code coffre : **toujours** `POST validate-treasure` et passer la **réponse** à l’écran victoire (`finishOk`, `awardedBadges`).

Si tu vois `finishOk: undefined` + `giftNumber: 3` **sans** appel validate-treasure dans les logs, ce n’est pas forcément un rejeu : l’app a probablement sauté l’API et lu un **`giftNumber` local périmé**.

**Vérification admin** : Outils joueur → snapshot après reset → `userAdventure: null`, `adventureBadgeEarned: false`, `validatedStepKeys: []`.

### 7. Fallback écran victoire sans `awardedBadges` (rejeu serveur uniquement)

Quand `userAdventure?.success === true` et `goToFinish()` **sans** réponse validate-treasure :

1. **`giftNumber`** : depuis `playerState` / progression locale si déjà connu.
2. **Badge virtuel** : depuis `GET /api/game/adventures/{id}` :
   - **`playerCompletionBadge`** (session) — badge déjà gagné, prioritaire pour l’écran victoire ;
   - sinon **`completionBadge`** — définition statique (titre + image du badge aventure).

```ts
type AdventureCompletionBadge = {
  badgeDefinitionId: string;
  title: string;
  imageUrl: string | null;
};

type PlayerCompletionBadge = AdventureCompletionBadge & {
  userBadgeId: string;
  earnedAt: string;
};

function badgesForVictoryScreen(params: {
  awardedBadges?: AwardedBadgeDetail[];
  playerCompletionBadge?: PlayerCompletionBadge | null;
  completionBadge?: AdventureCompletionBadge | null;
  adventureId: string;
}): AwardedBadgeDetail[] {
  if (params.awardedBadges?.length) return params.awardedBadges;
  const earned = params.playerCompletionBadge;
  if (earned) {
    return [{
      userBadgeId: earned.userBadgeId,
      badgeDefinitionId: earned.badgeDefinitionId,
      title: earned.title,
      imageUrl: earned.imageUrl,
      kind: "ADVENTURE_COMPLETE",
      adventureId: params.adventureId,
    }];
  }
  const def = params.completionBadge;
  if (def) {
    return [{
      userBadgeId: "",
      badgeDefinitionId: def.badgeDefinitionId,
      title: def.title,
      imageUrl: def.imageUrl,
      kind: "ADVENTURE_COMPLETE",
      adventureId: params.adventureId,
    }];
  }
  return [];
}
```

### 8. Ne pas faire

- Ne pas appeler `GET /api/user/badges` **obligatoirement** avant l’écran avis — `awardedBadges` suffit pour les **nouveaux** badges.
- Optionnel après coup : rafraîchir la collection badges (`GET /api/user/badges`) quand l’utilisateur ouvre l’onglet Collection.

### 9. Types / helpers suggérés

```ts
function hasNewBadges(finish: GameFinishSuccess) {
  return finish.awardedBadges.length > 0;
}

function adventureCompleteBadge(badges: AwardedBadgeDetail[], adventureId: string) {
  return badges.find(
    (b) => b.kind === "ADVENTURE_COMPLETE" && b.adventureId === adventureId
  );
}
```

### 10. Tests manuels

- Reset admin → GET progress : `userAdventure: null` → code coffre → log validate-treasure avec `awardedBadges`.
- Rejeu avec session → `userAdventure.success === true` ; fallback `playerCompletionBadge`.
- Première complétion avec trésor → `awardedBadges` contient au moins le badge aventure.
- Deuxième complétion → `alreadyValidated` / tableaux vides.
- Palier global (ex. 5e aventure) → plusieurs entrées dans `awardedBadges`.
- `giftNumber > 0` si stock physique géré.
```

---

## Résumé backend

| Champ | Rôle |
|-------|------|
| `awardedBadges` | Badges **nouveaux** cette finalisation, prêts à l’UI |
| `completionBadge` | Définition badge aventure sur GET détail (fallback rejeu) |
| `userAdventure` | Fin serveur (`success`, `giftNumber`) — `null` après reset |
| `playerCompletionBadge` | Badge déjà gagné (session) sur GET détail |
| `giftNumber` | Numéro badge **physique** dans le coffre |
| `awardedUserBadgeIds` | Conservé pour compatibilité (mêmes ids que `awardedBadges`) |
