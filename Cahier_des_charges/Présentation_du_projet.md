# Contexte

C'est une interface d'admin. Cette interface permettra aux administrateurs de gérer l'ensemble des ressources applicatives via un tableau de bord sécurisé.

## Objectif

- Garantir un accès sécurisé avec gestion des rôles et permissions
- Fournir une interface pour la gestion des utilisateurs, contenus et données.
- Permettre la supervision des activités et logs système
- L'application couvrira les modules suivants : authentification, tableau de bord, gestion des utilisateurs, du contenu et paramètres
- Authentification par google(optionnel)

## MVP

1. Gérer d'inscription et accès des admins et des supers admins
2. CRUD des infomation des urilisateurs, du contenu
3. La tableau de bord pour gestion des utilisateurs, du contenu et paramètres

## Technologie utiliser

### Font-end
- Next.js

### Back-end
- ORM: Prisma
- Better-auth
- Sécurité?