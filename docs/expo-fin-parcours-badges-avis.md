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

### 6. Ne pas faire

- Ne pas appeler `GET /api/user/badges` **obligatoirement** avant l’écran avis — `awardedBadges` suffit pour les **nouveaux** badges.
- Optionnel après coup : rafraîchir la collection badges (`GET /api/user/badges`) quand l’utilisateur ouvre l’onglet Collection.

### 7. Types / helpers suggérés

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

### 8. Tests manuels

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
| `giftNumber` | Numéro badge **physique** dans le coffre |
| `awardedUserBadgeIds` | Conservé pour compatibilité (mêmes ids que `awardedBadges`) |
