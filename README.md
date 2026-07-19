# Système de billetterie intelligente — Service Utilisateurs

Application de gestion des comptes (administrateurs, agents, clients) pour un système de billetterie de transport. Ce dépôt couvre le Service Utilisateurs : authentification, profil, création et import de comptes, activation, statistiques. Les services Abonnements et Billetterie/QR Code ne sont pas implémentés.

## Technologies

Backend
- Node.js, Express
- MongoDB, Mongoose
- bcryptjs — hachage des mots de passe
- jsonwebtoken — authentification par jeton
- multer — upload de fichiers (photo de profil, CSV)
- csv-parser — lecture des fichiers d'import
- nodemailer — envoi des e-mails d'activation
- node:test, supertest — tests unitaires et API

Frontend
- React 19, Vite
- React Router
- Jest, babel-jest — tests unitaires
- oxlint — analyse statique

Base de données
- MongoDB

## Fonctionnalités

Authentification
- Connexion et déconnexion par jeton JWT
- Écran dédié de changement de mot de passe obligatoire à la première connexion

Profil du compte connecté
- Consultation et modification des informations personnelles (nom, prénom, téléphone)
- Changement de mot de passe avec confirmation de l'ancien
- Upload de la photo de profil
- Affichage ou masquage du mot de passe à la saisie

Gestion des comptes (administrateur)
- Création individuelle d'un compte (administrateur, agent, client)
- Import en masse par fichier CSV, avec détail des lignes rejetées (doublon, champ manquant, rôle invalide)
- Consultation de la liste des comptes
- Recherche par e-mail, téléphone ou identifiant
- Filtrage par rôle et par statut
- Modification d'un compte (nom, prénom, téléphone, rôle)
- Activation, blocage et suppression, individuels et groupés
- Suppression logique : le compte passe au statut Supprimé, l'enregistrement est conservé

Tableau de bord
- Statistiques par rôle et statistiques globales : total, actifs, bloqués, supprimés

Validation des saisies
- Format de l'adresse e-mail
- Format du numéro de téléphone : 9 chiffres, indicatif +221 optionnel

## Structure du code

### backend/

```
src/
  app.js            application Express (sans écoute réseau, utilisée aussi par les tests)
  server.js         point d'entrée, démarre le serveur et la connexion MongoDB
  config/db.js      connexion à MongoDB
  models/User.js    schéma Mongoose : rôle, statut, mot de passe haché, mustChangePassword
  routes/
    authRoutes.js    /api/auth
    userRoutes.js    /api/users (profil du compte connecté)
    adminRoutes.js   /api/admin (gestion des comptes, réservé aux administrateurs)
  controllers/
    authController.js
    profileController.js
    userController.js
    importController.js
  middleware/
    auth.js          protect, isAdmin, requirePasswordChanged
    upload.js         configuration multer (photo, CSV)
  utils/
    escapeRegex.js       neutralise les caractères spéciaux pour la recherche
    generatePassword.js  génération du mot de passe temporaire
    sendEmail.js          envoi des e-mails
  seed/               création du compte administrateur initial
tests/
  unitaires/          fonctions pures : mot de passe temporaire, échappement regex, modèle User
  api/                routes testées via supertest : authentification, CRUD, import CSV, activation
```

### frontend/

```
src/
  App.jsx                     déclaration des routes
  components/
    DashboardLayout.jsx        barre de navigation, redirection si non connecté ou mot de passe temporaire
    CreateUserModal.jsx        création d'un utilisateur
    EditUserModal.jsx          modification d'un utilisateur
    ImportCsvModal.jsx         import CSV, affichage des erreurs
    PasswordInput.jsx          champ mot de passe avec bascule visible/masqué
    StatCard.jsx                carte de statistiques du tableau de bord
  pages/
    Login.jsx                   connexion
    ForcePasswordChange.jsx     changement de mot de passe obligatoire
    ProfileSettings.jsx         profil du compte connecté
    UserManagement.jsx          gestion des comptes : liste, statistiques, actions
  services/api.js               appels HTTP vers l'API, gestion du jeton JWT
  utils/validators.js           règles de validation : e-mail, téléphone, mot de passe
```

## API

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/auth/login | public | connexion |
| POST | /api/auth/logout | public | déconnexion |
| GET | /api/users/profile | connecté | profil du compte connecté |
| PUT | /api/users/profile/password | connecté | changement de mot de passe |
| PUT | /api/users/profile | connecté, mot de passe changé | modification des informations personnelles |
| POST | /api/users/profile/photo | connecté, mot de passe changé | upload de la photo de profil |
| GET | /api/admin/dashboard/stats | administrateur | statistiques |
| POST | /api/admin/users | administrateur | création d'un compte |
| GET | /api/admin/users | administrateur | liste des comptes, recherche et filtres |
| GET | /api/admin/users/:id | administrateur | fiche d'un compte |
| PUT | /api/admin/users/:id | administrateur | modification d'un compte |
| DELETE | /api/admin/users/:id | administrateur | suppression |
| PATCH | /api/admin/users/:id/status | administrateur | changement de statut |
| PATCH | /api/admin/users/bulk-status | administrateur | action groupée |
| POST | /api/admin/users/import | administrateur | import CSV |

## Tests

Backend : 59 tests (14 unitaires, 45 API), `node --test`.
```bash
cd backend
npm test
```

Frontend : 22 tests unitaires, Jest.
```bash
cd frontend
npm test
```

## Installation et démarrage

Prérequis : Node.js 18 ou plus, MongoDB en local.

```bash
npm run install-all
```

Créer `backend/.env` sur le modèle de `backend/.env.example`.

```bash
npm run dev
```

Démarre l'API Express (port 5050) et le serveur de développement React (port 5173).

## Documentation

- **[PLAN-SERVICE-ABONNEMENTS.md](PLAN-SERVICE-ABONNEMENTS.md) — 🚧 prochaine étape : répartition des tâches, contrat d'API et règles de travail à valider par les deux développeurs**
- [CONTRIBUTING.md](CONTRIBUTING.md) — gestion des branches, commits, normes de codage
- [docs/plan_service_utilisateurs.md](docs/plan_service_utilisateurs.md) — plan d'implémentation initial
- [docs/TP1-service-utilisateurs.md](docs/TP1-service-utilisateurs.md) — livrable du TP : fonctionnalités critiques, plan de tests, tableau de synthèse, scénario fonctionnel
- [docs/guide-tests-et-demo.md](docs/guide-tests-et-demo.md) — installation, commandes de test, parcours de démonstration
- [docs/presentation/tp1-service-utilisateurs.md](docs/presentation/tp1-service-utilisateurs.md) — support de présentation (Marp) ; export PDF dans [docs/pdf/TP1-Service-Utilisateurs-presentation.pdf](docs/pdf/TP1-Service-Utilisateurs-presentation.pdf)
