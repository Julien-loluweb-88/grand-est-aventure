# Expo — trésor, badges et `playAvailability`

Prompt et spec pour l’app mobile (Cursor Expo). Backend : routes `GET /api/game/home`, `GET /api/game/adventures`, `GET /api/game/adventures/{id}`.

OpenAPI : `GET /api/openapi` (schémas `playAvailability`, `myReview`).

---

## Prompt Cursor Expo (copier-coller)

```
Contexte : le backend expose désormais un **état courant par aventure** (`playAvailability`), pas une liste de « qui a signalé quoi » sur l’accueil.

### Nouveaux champs API (home, liste, détail aventure)

Chaque aventure inclut :

```ts
playAvailability: {
  hasTreasure: boolean;
  physicalBadges: null | {
    tracked: true;
    availableCount: number;  // exemplaires AVAILABLE côté serveur
  };
  treasureNotice: null | {
    status: "TEMPORARILY_UNAVAILABLE";
    message: string | null;
    updatedAt: string;
  };
  badgesNotice: null | {
    status: "TEMPORARILY_UNAVAILABLE";
    message: string | null;
    updatedAt: string;
  };
}
```

**Activation admin** : quand tu passes un avis en **Validé** avec « Rapport de vol du trésor » ou « badges en rupture », les alertes correspondantes s’activent automatiquement sur l’aventure (`treasureNotice` / `badgesNotice`).

Si session joueur :

```ts
myReview?: {
  reportsStolenTreasure: boolean;
  reportsMissingBadge: boolean;
  moderationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
}
```

`hasTreasure` (legacy) = trésor configuré. **Ne pas** l’utiliser pour « trésor volé ».

### Règles d’affichage (3 scénarios fin de parcours)

#### 1 — Trésor trouvé, badge(s) pris
- Après toutes les énigmes : écran saisie **code coffre**.
- Si `playAvailability.physicalBadges === null` (stock non suivi) : demander **combien de badges** pris → `giftNumber` dans `POST /api/game/validate-treasure`.
- Si `physicalBadges.tracked === true` : le serveur attribue le numéro ; afficher `userAdventure.giftNumber` après succès (`GET /api/game/progress`).
- Si `physicalBadges.availableCount === 0` avant validation : prévenir « plus de badge physique » mais le joueur peut quand même valider le code (coffre vide).

#### 2 — Trésor trouvé, coffre vide (plus de badge)
- Même flux `validate-treasure` avec le bon code → **succès** (partie terminée).
- Bandeau UX : badges physiques indisponibles (`availableCount === 0`).
- Proposer signalement : `POST /api/game/adventure-review` avec `reportsMissingBadge: true` (+ texte optionnel).
- Afficher via `myReview` : « Signalement envoyé » si `reportsMissingBadge && moderationStatus === "PENDING"`.

#### 3 — Trésor introuvable / volé sur place
- **Ne pas** appeler `validate-treasure` sans code.
- Si `playAvailability.treasureNotice !== null` : bandeau sur carte / fiche **avant** même d’y aller :
  - Titre : « Trésor momentanément indisponible »
  - Sous-titre : `treasureNotice.message` ou texte par défaut
- Bouton « Je n’ai pas trouvé le trésor » → `POST /api/game/adventure-review` avec `reportsStolenTreasure: true`.
- Partie **non finalisée** sans code coffre (pas de roue, pas de badge virtuel d’aventure).
- `myReview.reportsStolenTreasure` + `moderationStatus` pour feedback perso au joueur.

### Accueil (`GET /api/game/home`)

- **`recentReviews`** : avis sociaux uniquement (notes / commentaires). Les signalements seuls n’y apparaissent plus.
- **Ne pas** construire une liste « Marie a signalé le trésor » sur l’accueil.
- Utiliser **`playAvailability` sur chaque carte aventure** pour badges / alerte trésor.
- Badge carte si :
  - `treasureNotice != null` → icône alerte trésor
  - `badgesNotice != null` → « Badges indisponibles »
  - `physicalBadges?.availableCount === 0 && physicalBadges.tracked` → stock épuisé (complément)

### Fin trésor (rappel API)

- Une seule étape : `POST /api/game/validate-treasure` avec `code` (+ `giftNumber` si stock non suivi).
- Plus de `treasure:map` / `phase: "map"`.

### Tâches implémentation

1. Typer `playAvailability` et `myReview` depuis OpenAPI ou types manuels.
2. Helper `getAdventureAlerts(adventure)` :
   - `treasureUnavailable: boolean` ← `treasureNotice != null`
   - `physicalBadgesExhausted: boolean` ← tracked && availableCount === 0
3. Bandeaux sur liste, home, fiche détail, écran fin de parcours.
4. Flux signalement → `adventure-review` ; refresh fiche pour `myReview`.
5. Supprimer toute UI basée sur `recentReviews.reportsStolenTreasure` pour les alertes catalogue.

Tester : aventure avec stock badges (count > 0 puis 0), aventure avec `treasureNotice` activée côté admin, signalement perso `myReview`.
```

---

## Côté admin backend

Sur la fiche aventure → section Trésor → **Alerte joueurs — trésor indisponible** :

- Activer / désactiver l’alerte (`treasureUnavailable`)
- Message optionnel
- À désactiver quand le trésor est remis en place

Les signalements joueurs (`adventure-review`) alimentent la modération admin ; l’alerte publique est **manuelle** (ou dérivée du stock badges via `availableCount`).

---

## Migration base

```bash
npx prisma migrate deploy
```

Migrations : suppression codes carte trésor + champs `treasureUnavailable*`.
