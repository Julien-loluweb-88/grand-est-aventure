# Expo — message de fin trésor (`finishMessage`)

Prompt pour l’app mobile (Cursor Expo). Champ admin : **Message de fin (trésor trouvé)** sur le trésor.

API : `GET /api/game/adventures/{id}` → `treasure.finishMessage` (TipTap JSON).  
**Pas** dans la réponse de `POST /api/game/validate-treasure`.

Même pattern que `enigmas[].answerMessage` après une bonne réponse.

---

## Prompt Cursor Expo (copier-coller)

```
## Objectif

Afficher le message de fin édité côté admin quand le joueur valide le code coffre
(trésor trouvé). Nouveau champ backend : `treasure.finishMessage`.

## Source de vérité

- `GET /api/game/adventures/{id}`
- Objet `treasure` (non null si l’aventure a un trésor) :
  - `id`, `name`, `description`, `finishMessage`, `latitude`, `longitude`, `imageUrl`
  - **jamais** de `chestCode` / `chestCodeAlt` dans cette réponse

`finishMessage` est un document TipTap JSON (comme `description`, `answerMessage`) :

```ts
type TipTapDoc = {
  type: "doc";
  content?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
};

// Exemple
{
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Bravo ! Vous avez trouvé le trésor." }]
    }
  ]
}
```

## Règles importantes

1. **Ne pas** chercher `finishMessage` dans la réponse `POST /api/game/validate-treasure`.
   Cette route renvoie seulement `ok`, `stepKey`, `message` (générique), `awardedBadges`, etc.
2. Lire `finishMessage` depuis la **fiche aventure déjà en cache** (même cache que pour
   `answerMessage` des énigmes). Si besoin, refetch `GET adventures/{id}` avant l’écran victoire.
3. Réutiliser le helper existant qui convertit TipTap → texte (celui de `answerMessage`).
   Affichage texte brut suffit (pas besoin d’un rendu TipTap riche sauf si déjà en place).
4. Si `treasure` est `null` (aventure sans trésor) : pas de `finishMessage` — garder le
   flux `validate-finish` et le texte générique actuel.
5. Si `finishMessage` est vide après conversion plain text : fallback
   « Aventure terminée avec succès » (ou le `message` de la réponse validate-treasure).

## Où brancher

### Types

Ajouter sur le type Treasure de la fiche :

```ts
finishMessage: TipTapDoc | unknown; // même type que answerMessage / description
```

### Navigation vers l’écran victoire

Après succès coffre (`validate-treasure`, `alreadyValidated !== true`), passer le message :

```ts
const finishMessagePlain = tiptapToPlainText(adventure.treasure?.finishMessage);

navigation.navigate("VictoryReview", {
  adventureId,
  adventureName,
  awardedBadges,
  giftNumber,
  finishMessage: finishMessagePlain, // ← nouveau
});
```

### UI VictoryReview (ou équivalent)

Afficher `finishMessage` en tête / sous le titre de victoire, **avant** la liste des badges :

```
┌─────────────────────────────────────┐
│  Aventure terminée !                │
│                                     │
│  {finishMessage}                    │  ← TipTap → plain text
│                                     │
│  [badges…]                          │
│  Badge physique n° …                │
│  ─── avis ───                       │
└─────────────────────────────────────┘
```

Ne pas écraser `finishMessage` par le `message` générique de l’API si le champ admin est rempli.

## Checklist de test

- [ ] Fiche GET : `treasure.finishMessage` présent (JSON TipTap)
- [ ] Code coffre OK → écran victoire montre le texte admin (pas seulement « Aventure terminée… »)
- [ ] Modifier le message en admin → refetch / cache à jour → nouveau texte à l’écran
- [ ] Aventure sans trésor : pas de crash, flux validate-finish inchangé
- [ ] Message vide / doc TipTap vide → fallback générique
- [ ] Même helper TipTap que pour `answerMessage` (pas de double implémentation)
```

---

## Rappel backend (ne pas re-coder côté Expo)

| Champ | Où | Quand l’afficher |
|--------|-----|------------------|
| `enigmas[].answerMessage` | GET fiche | Après bonne réponse énigme |
| `treasure.finishMessage` | GET fiche | Après code coffre validé |
| `message` dans validate-treasure | POST | Fallback générique seulement |
