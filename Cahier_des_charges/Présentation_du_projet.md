# Contexte

C'est une interface d'admin. Cette interface permettra aux administrateurs de gérer l'ensemble des ressources applicatives via un tableau de bord sécurisé.

## Objectif

- Garantir un accès sécurisé avec gestion des rôles et permissions
- suivre l'utilisation de la gestion des utilisateurs, infomation affichées, nombre total d'utilisaturs, scané du jour, missions terminées, utilisateur actifs
- Permettre la supervision des activités et logs système
- Gérer des positions de code QR
- Gérer des récompenses
- Analyser des utilisateurs
- L'application couvrira les modules suivants : authentification, tableau de bord, gestion des utilisateurs, du contenu et paramètres
- Authentification par google(optionnel)

## MVP

1. Gérer d'inscription et accès des admins et des supers admins
2. CRUD des infomations des urilisateurs, du contenu
3. La tableau de bord
4. Analyser des utilisateurs actifs
5. Logs et supervision système
6. Paramètre de sécurité et des rôles

## Technologie utiliser

### Font-end
- Next.js

### Back-end
- ORM: Prisma
- Better-auth
- Sécurité?