# Checklist — intégration application mobile (Expo)

Document de **pilotage projet** : prérequis, **étapes de mise en place** et **cases à cocher** pour brancher l’app mobile sur l’API Balad’indice. Cocher au fur et à mesure ; l’ordre des phases est recommandé mais certaines tâches peuvent être parallélisées.

**Références** :

- [`docs/expo-better-auth.md`](expo-better-auth.md) — session, cookies, `baseURL`, deep links.  
- [`docs/expo-fin-parcours-badges-avis.md`](expo-fin-parcours-badges-avis.md) — victoire, `awardedBadges`, écran avis (prompt Expo).
- [`docs/expo-tresor-play-availability.md`](expo-tresor-play-availability.md) — trésor, badges, `playAvailability`, prompt Expo.  
- [`docs/flux-api-et-jeu.md`](flux-api-et-jeu.md) — schéma global des routes et logique métier.  
- [`README.md`](../README.md) — tableaux d’API, checklist courte, parcours joueur.  
- OpenAPI : `GET /api/openapi` (ou Swagger UI admin si activé).

---

## Légende

- `[ ]` Tâche à faire  
- Les **routes** sont relatives à l’origine du backend (ex. `https://api.example.com`).

**Deux flux « partenaires » distincts** (à ne pas mélanger dans l’UI ni en support) :

1. **Roue fin d’aventure** — `GET/POST …/adventure-partner-lots*` (lots liés à l’aventure ou à la ville, tirage après succès).  
2. **Encarts publicitaires** — `GET /api/advertisements` + `POST /api/partner-offers/claims` (offre liée à une pub).

---

## Phase 0 — Projet & environnement

### Mise en place

- [ ] Décider de l’**URL de production** du backend Next.js (HTTPS).  
- [ ] Définir l’**URL de développement** accessible depuis l’émulateur / téléphone (**pas** `localhost` sur l’appareil — utiliser l’IP LAN ou un tunnel).  
- [ ] Renseigner les variables Expo (`EXPO_PUBLIC_…`) alignées sur `NEXT_PUBLIC_APP_URL` / schéma deep link (voir `expo-better-auth.md`).  
- [ ] Vérifier `BETTER_AUTH_EXPO_SCHEME` côté serveur et `expo.scheme` côté app **identiques**.  
- [ ] Télécharger ou consulter la **spec OpenAPI** une fois pour générer des types / client HTTP si besoin.

### Qualité de base

- [ ] Politique **TLS** / certificats valides en staging et prod.  
- [ ] Journalisation côté app (requêtes erreurs **4xx/5xx**, corrélation `adventureId` / `userId` masquée si sensible).

---

## Phase 1 — Authentification & session

### Mise en place

- [ ] Installer les deps Better Auth côté Expo (`better-auth`, `@better-auth/expo`, `expo-secure-store`, etc. — voir doc officielle + `expo-better-auth.md`).  
- [ ] Créer le **client auth** avec `baseURL` = `{origine}/api/auth` et plugin **expo**.  
- [ ] Implémenter les écrans **inscription / connexion / mot de passe oublié** selon votre produit.  
- [ ] OAuth (Google, etc.) : deep link retour + tests sur appareil réel.

### Intégration API métier (cookies)

- [ ] Pour chaque `fetch` vers `/api/game/…`, `/api/user/…`, etc. : transmettre le header **`Cookie`** (ex. via `authClient.getCookie()` recommandé par Better Auth Expo) et `credentials: "omit"` si vous suivez ce pattern.  
- [ ] Gérer **401** : renvoi vers login ou refresh session selon votre stratégie.  
- [ ] Tester **session persistante** (fermeture app, redémarrage).

### Cases récap

- [ ] Connexion réussie → appel test `GET /api/user/badges` (ou autre route protégée) → **200**.  
- [ ] Déconnexion locale + invalidation cookies / secure store.
- [ ] **Suppression de compte** : écran paramètres (`deleteUser` + mot de passe si compte e-mail) ; deep link `supprimer-compte?token=` → `deleteUser({ token })` (voir `docs/expo-better-auth.md`).

### Avatars compagnon (paramètres / carte / AR)

- [ ] `GET /api/game/avatars` — liste des avatars actifs ; afficher **nom** + **aperçu** si `thumbnailUrl` ; conserver **`id`** (pour `PATCH`) et **`slug`** (pour le repli bundle local) ; si **`modelUrl`** est non nul, préférer ce **.glb** (URL absolue ou `/uploads/…` sur l’origine API).  
- [ ] `GET /api/user/avatar` — préférence serveur (`selectedAvatarId` peut être `null` au premier usage).  
- [ ] `PATCH /api/user/avatar` — corps `{ "selectedAvatarId": "…" }` ou `{ "selectedAvatarId": null }` ; gérer **404** (avatar inactif / inconnu) et **429**.

---

## Phase 2 — Catalogue & fiche aventure

### Villes & liste des parcours

- [ ] `GET /api/game/cities` — affichage liste / filtres ; conserver **`cityId`** pour la suite.  
- [ ] `GET /api/game/adventures` — liste **PUBLIC** uniquement (pas les démos).  
- [ ] Si joueur connecté (cookies ou `Authorization: Bearer`) : lire **`playerState`** sur chaque entrée (session chrono, progression, `playStatus`, compteurs d’étapes) — pas besoin d’appeler `progress` par carte.  
- [ ] Gérer pagination / recherche si vous l’ajoutez côté API plus tard (actuellement selon réponse serveur).

### Fiche détail

- [ ] `GET /api/game/adventures/{id}` — afficher nom, description, carte, durées (`estimatedDurationSeconds`, `averagePlayDurationSeconds`, etc.).  
- [ ] Bandeau avant « Commencer » : **`playerState`** (`hasGameplayProgress` → reprise ; `hasOpenPlaySession` sans gameplay → session chrono ; `playStatus: COMPLETED` → parcours terminé).  
- [ ] Lire **`treasure`** : `null` ou objet présent → détermine tout le flux **finish vs trésor** (indispensable avant de coder la fin).  
- [ ] Lire **`enigmas[]`** : `number`, `multiSelect`, `choice`, textes, médias.  
- [ ] Lire **`discoveryPoints`** (tableau ville / aventure) pour onglet ou section « découverte » sur la fiche parcours.

### Aventures démo

- [ ] Comprendre que les **DEMO** ne sont **pas** dans le catalogue public.  
- [ ] Si vous avez des liens profonds vers une démo : `GET adventures/{id}` avec **session** + compte autorisé ; gérer **404** « sans droit ».

### Cases récap

- [ ] Parcours utilisateur : ville → liste → fiche sans crash hors ligne (message clair si pas de réseau).

---

## Phase 3 — Progression & démarrage de partie

### État serveur

- [ ] `GET /api/game/progress?adventureId=` pour synchro fine en jeu (étapes, `validatedStepKeys`) ; la fiche peut s’appuyer sur **`playerState`** du détail / catalogue pour l’UX pré-« Commencer ».  
- [ ] Mapper les `stepKey` renvoyés vers votre UI (énigmes cochées, trésor coffre, etc. — voir OpenAPI).
- [ ] Lire **`playAvailability`** sur home / liste / détail : alerte trésor (`treasureNotice`), badges physiques (`physicalBadges.availableCount`).
- [ ] Si session : **`myReview`** pour afficher l’état du signalement du joueur (`PENDING`, etc.).

### Démarrage chrono / session jeu

- [ ] Au premier « Commencer » (ou équivalent) : `POST /api/game/start-adventure` avec `adventureId` + `userId`.  
- [ ] Gérer réponses **idempotentes** (`alreadyInProgress`, etc.).  
- [ ] Gérer **400** `EMPTY_ADVENTURE` (ni énigme ni trésor — cas rare, message admin).

### Cases récap

- [ ] Rejeu après crash : `progress` + `start-adventure` ne cassent pas l’état.

---

## Phase 4 — Énigmes & fin de parcours

### Énigmes

- [ ] Enchaîner **`POST /api/game/validate-enigma`** dans l’**ordre** des numéros imposé par le serveur.  
- [ ] Si `multiSelect === false` : corps **`submission`** (string).  
- [ ] Si `multiSelect === true` : corps **`submissions`** (string[]).  
- [ ] Gérer **400** : `WRONG_ANSWER`, `ORDER`, `SUBMISSIONS_ARRAY_REQUIRED`, etc. (libellés utilisateur + pas de fuite de la bonne réponse).  
- [ ] Afficher `answerMessage` / retours UX selon payload de succès (voir OpenAPI).

### Fin **sans** trésor

- [ ] Quand `progress` indique toutes les énigmes validées **et** `treasure` absent sur la fiche : `POST /api/game/validate-finish`.  
- [ ] Succès → mise à jour locale « victoire », enchaînement **Phase 5**.

### Fin **avec** trésor

- [ ] `POST /api/game/validate-treasure` avec le code coffre + `giftNumber` si applicable.  
- [ ] Gérer erreurs code incorrect / énigmes incomplètes.  
- [ ] Succès → finalisation badges / `UserAdventures` côté serveur → **Phase 5**.

### Cases récap

- [ ] Ne **jamais** appeler `validate-finish` si un trésor existe (sinon `TREASURE_REQUIRED`).  
- [ ] Tester les deux variantes (avec / sans trésor) sur au moins une aventure réelle.

---

## Phase 5 — Après victoire (roue, magasin, avis, badges)

### Roue partenaires (optionnelle)

- [ ] Après succès confirmé : `GET /api/game/adventure-partner-lots?adventureId=`.  
- [ ] Afficher **`legalNotice`** si non vide (scroll, lien « lire la suite », ou écran dédié).  
- [ ] Si `adventureFinished === false` : ne pas proposer la roue (partie non terminée côté serveur — revenir à `progress`).  
- [ ] Si `wheel === "none"` : pas d’UI roue ; enchaîner suite (avis, pubs…).  
- [ ] Si `wheel === "ready"` : afficher segments (`id`, `title`, `partnerName`) puis **`POST …/spin`** ; résultat = vérité serveur (`won`).  
- [ ] Si `wheel === "done"` : afficher `won` existant (`validUntil`, `redeemed`, `winId`).  
- [ ] Gérer **503** `SPIN_RETRY` (réessai court avec backoff).  
- [ ] Gérer **400** `NO_PARTNER_LOTS`, `ADVENTURE_NOT_FINISHED`.

### Utilisation en magasin

- [ ] Écran gain : afficher clairement **`validUntil`** (et `validFrom` si utile) pour l’expiration.  
- [ ] Bouton « **Confirmer en magasin** » (libellé métier) → `POST /api/game/adventure-partner-lots/redeem`.  
- [ ] Si **200** + `alreadyRedeemed: true` : message « déjà enregistré », désactiver le bouton.  
- [ ] Si **400** `NO_WIN` : pas de gain à valider (message neutre).  
- [ ] Option UX : demander une **confirmation** avant `redeem` (double étape) pour éviter les taps accidentels.

### Avis fin de partie

- [ ] `POST /api/game/adventure-review` (note, texte, signalements, photo multipart si prévu — voir OpenAPI).  
- [ ] Gérer erreurs démo / validation.

### Badges joueur

- [ ] Après victoire : lire **`awardedBadges`** (+ `giftNumber`) dans la réponse `validate-treasure` / `validate-finish` — voir `docs/expo-fin-parcours-badges-avis.md`.
- [ ] Afficher ces badges sur l’écran victoire **avant** `POST /api/game/adventure-review`.
- [ ] `GET /api/user/badges` : rafraîchir la collection (optionnel, pas requis pour l’écran avis).

### Cases récap

- [ ] Parcours complet : victoire → (roue ou pas) → redeem si pertinent → avis → collection badges à jour.

---

## Phase 6 — Publicités & offres « encart » (hors roue)

### Affichage

- [ ] `GET /api/advertisements` avec **`placement`** obligatoire (valeurs alignées admin : `home`, `library`, …).  
- [ ] Envoyer **`cityId`** quand le joueur a une ville (requis si la pub cible des villes).  
- [ ] Envoyer **`latitude` + `longitude`** si GPS dispo (requis si pub avec disque).  
- [ ] **Avec session** pour exclure les pubs masquées par l’utilisateur.

### Événements & masquage

- [ ] `POST /api/advertisements/events` — **IMPRESSION** quand l’encart est réellement visible ; **CLICK** sur CTA.  
- [ ] Respecter **rate limit** / `Retry-After` sur **429**.  
- [ ] `POST /api/user/advertisement-dismissals` quand l’utilisateur ferme un encart (`advertisementId`).

### Offre partenaire liée à la pub

- [ ] Si `partnerOffer.open` : bouton « Demander » → `POST /api/partner-offers/claims`.  
- [ ] `GET /api/partner-offers/claims` — écran historique (badges, statuts).  
- [ ] Ne pas confondre avec la **roue** (`adventure-partner-lots`).

### Cases récap

- [ ] Au moins un **placement** testé en intégration avec pubs réelles ou de staging.

---

## Phase 7 — Points de découverte (hors quête)

### Données

- [ ] Sur fiche parcours : réutiliser **`discoveryPoints`** de `adventures/{id}`.  
- [ ] Vue « toute la ville » : `GET /api/game/discovery-points?cityId=`.  
- [ ] Règle d’affichage : POI avec `adventureId` non null réservés aux joueurs ayant une **partie** sur cette aventure (masquer ou griser sinon).

### Réclamation sur place

- [ ] `POST /api/game/claim-discovery` avec position GPS courante + `discoveryPointId` + `userId`.  
- [ ] Gérer **400** `TOO_FAR`, `ADVENTURE_REQUIRED`.  
- [ ] Gérer **429** + `Retry-After`.  
- [ ] Rafraîchir `GET /api/user/badges` après succès.

### Cases récap

- [ ] Test sur site réel (GPS) + test simulateur si vous mock la position.

---

## Phase 8 — Avis publics (lecture)

- [ ] `GET /api/game/adventure-reviews?adventureId=` — avis approuvés (`reportsMissingBadge`, `reportsStolenTreasure`, `adventureName`, etc.).
- [ ] `GET /api/game/adventure-reviews?adventureId=&reportsOnly=true` — signalements seuls (accueil / alertes).

---

## Phase 9 — Robustesse & expérience

### Erreurs & réseau

- [ ] Stratégie globale **offline** (message, file d’attente optionnelle — le serveur ne synchronise pas tout seul).  
- [ ] Timeouts et **retry** uniquement où c’est sûr (idempotents : `start-adventure`, `redeem` déjà idempotent côté serveur pour le second appel).  
- [ ] Ne pas retry aveuglément `spin` si vous avez déjà reçu **200** (risque double affichage — le serveur est idempotent mais l’UX peut clignoter).

### Accessibilité & contenu

- [ ] Textes d’erreur **compréhensibles** (pas de collage brut de `code` serveur seul).  
- [ ] Images distantes (`coverImageUrl`, badges) : gestion **HTTPS**, cache, placeholder.

### Légal / produit (checklist métier)

- [ ] Affichage du **règlement** (`legalNotice`) quand vous exploitez la roue avec lots à valeur.  
- [ ] **Contact support** : `POST /api/contact` avec `{ name, email, message }` (sans session). Discord affiche **Application mobile** (origine serveur — ne pas envoyer `source`). Gérer **429** / **502** / **503**. Le site utilise `/contact` → **Site web** dans Discord. Voir README § *Contact (web + app mobile)*.

---

## Phase 10 — Recette & mise en production

### Avant prod

- [ ] Jeu de tests **E2E** manuels ou automatisés : sans trésor / avec trésor / sans lots / avec lots / spin puis redeem / redeem déjà fait.  
- [ ] Compte **DEMO** + accès liste blanche si vous livrez des parcours démo.  
- [ ] Vérifier les **clés API** et secrets uniquement côté serveur (rien d’secret dans l’app).

### Après déploiement

- [ ] Monitoring erreurs **5xx** et taux **429**.  
- [ ] Plan de **versioning** API (aujourd’hui pas de version dans l’URL — documenter les breaking changes dans le changelog backend).

---

## Synthèse — ordre d’appel « jour 1 » joueur

1. Auth → session OK  
2. `cities` → `adventures` → `adventures/{id}`  
3. `progress` → `start-adventure`  
4. Boucle `validate-enigma`  
5. `validate-finish` **ou** `validate-treasure` × 2  
6. `adventure-partner-lots` → éventuellement `spin` → éventuellement `redeem`  
7. `adventure-review` (optionnel)  
8. `user/badges`  
9. `advertisements` + `events` + offres / dismissals selon écrans

---

*À mettre à jour quand de nouvelles routes apparaissent dans le backend — comparer avec `GET /api/openapi`.*
