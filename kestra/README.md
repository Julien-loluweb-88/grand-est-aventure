# Tâches planifiées Balad'indice (Kestra)

Ces flows remplacent les crons Vercel (`vercel.json`). **Ne garde qu’un seul orchestrateur** : soit Kestra, soit Vercel — pas les deux en prod (risque de double exécution).

## Prérequis

1. **`CRON_SECRET`** identique sur le serveur Next.js (`.env` / variables Vercel) et dans chaque flow (`vars.cron_secret`).
2. **URL publique** de l’app : modifier `app_url` dans chaque flow si besoin.

> Le secret est en dur dans les YAML (pas de Secrets Kestra payants). Ne pousse pas ce dossier sur un dépôt public sans y réfléchir.

## Déploiement

### Option A — UI Kestra

1. Créer le namespace `baladindices` (ou adapter les YAML).
2. Importer chaque fichier de `kestra/flows/`.
3. Activer les flows.

### Option B — CLI Kestra

```bash
kestra flow namespace update baladindices kestra/flows/ --server http://localhost:8080
```

(Adapter la commande à ta version de Kestra.)

## Liste des flows

| Fichier | Endpoint | Planning (Paris) | À quoi ça sert |
|---------|----------|------------------|----------------|
| `expire-partner-claims.yml` | `/api/cron/expire-partner-claims` | Toutes les heures | Expire les demandes d’offres partenaires sans réponse (> 24 h). |
| `email-prospects-followup.yml` | `/api/cron/email-prospects-followup` | Toutes les heures 8h–19h | Envoie les mails de prospection mairies (3 files, 10/h). |
| `recompute-adventure-durations.yml` | `/api/cron/recompute-adventure-durations` | Tous les jours 3h | Met à jour les durées moyennes de jeu et ferme les sessions abandonnées. |
| `award-monthly-km-badges.yml` | `/api/cron/award-monthly-km-badges` | 1er du mois 6h | Attribue le badge « marcheur du mois » (km du mois précédent). |

## Test manuel (curl)

```bash
export CRON_SECRET="d3fbabc51fc34ff7fb51019805c56995ee0585504c77f276927bca479b516a43"
export APP_URL="https://baladindices.fr"

curl -sS "$APP_URL/api/cron/expire-partner-claims" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

## Désactiver les crons Vercel

Si tu utilises Kestra en prod, vide ou supprime la section `crons` de `vercel.json` pour éviter les appels en double.
