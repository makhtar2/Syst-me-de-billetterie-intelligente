# Système de Billetterie Intelligente 🎟️

Un système de billetterie et de gestion de transport moderne avec génération de billets sous forme de **QR Code**, gestion des **abonnements**, suivi des voyages et **importation massive** d'utilisateurs via des fichiers **CSV**.

## 🚀 Stack Technique

* **Frontend :** ReactJS (avec Vite, routage fluide et styles modernes)
* **Backend :** NodeJS & Express
* **Base de données :** MongoDB (via Mongoose)

---

## 📚 Documentation & Plans

Pour guider le développement collaboratif et suivre les étapes du projet :
* 📘 **[Guide de Contribution](CONTRIBUTING.md)** : Règles pour la gestion des branches, messages de commits, normes de codage et de sécurité.
* 📝 **[Plan d'Implémentation - Service Utilisateurs](docs/plan_service_utilisateurs.md)** : Spécifications, schémas MongoDB, endpoints d'API et structure React pour la première phase.

---

## 📋 Contexte et Objectifs

Une entreprise de transport souhaite digitaliser son système de billetterie. L'application permet :
1. **L'Achat de Titres :** Ticket simple, abonnement avec un nombre limité de voyages, ou abonnement illimité sur une période donnée.
2. **Le Contrôle d'Accès :** À chaque montée, le QR Code est scanné et validé par un agent. Le système vérifie les droits du passager et décompte les voyages.
3. **La Gestion Administrative :** Importation d'utilisateurs en masse par CSV, suivi statistique et activation/blocage des comptes par un e-mail contenant un mot de passe temporaire.

---

## 🛠️ Description des Services principaux

### 1. Service Utilisateurs
Permet à l'administrateur de gérer les comptes **Administrateurs**, **Agents** et **Clients**.
* **Authentification & Profil :** Connexion/déconnexion sécurisée, modification des infos personnelles, photo de profil, et changement de mot de passe sécurisé.
* **Gestion d'Utilisateurs :** Création individuelle ou importation groupée par fichier CSV.
* **Notification par e-mail :** À l'activation du compte, génération automatique d'un mot de passe temporaire de 8 caractères et envoi des accès par e-mail (passage au statut « Actif »).
* **Recherche et Actions Groupées :** Filtres par rôles/statuts (Actif, Bloqué, Supprimé), recherche par e-mail/téléphone/identifiant unique, et activation/blocage/suppression de masse.
* **Tableau de Bord :** Statistiques en temps réel sur le nombre d'utilisateurs actifs/bloqués/supprimés classés par rôle.

### 2. Service Abonnements
* Création, modification et suppression de formules d'abonnement.
* Gestion des abonnements limités (nombre de trajets défini) et illimités (période définie).

### 3. Service Billetterie & QR Code
* Génération dynamique de billets encodés sous forme de QR Code unique.
* Validation instantanée du QR Code et mise à jour automatique du solde ou de la validité de l'abonnement.

---

## 🗂️ Backlog du Projet (Organisation Trello)

Le projet est structuré en **12 cartes majeures** sur Trello :

### 1. Initialisation du projet 🟢 (Complété)
* [x] Initialiser le dépôt Git
* [x] Initialiser React (Vite)
* [x] Initialiser Node.js
* [x] Configurer Express
* [x] Connecter MongoDB
* [x] Installer les dépendances
* [x] Tester le démarrage

### 2. Authentification 🚧
* [ ] Connexion / Sécurité
* [ ] Déconnexion
* [ ] Middleware JWT
* [ ] Hashage des mots de passe (bcrypt)
* [ ] Gestion du profil utilisateur

### 3. Gestion des utilisateurs
* [ ] CRUD Utilisateurs (Admin, Agent, Client)
* [ ] Importation de fichiers CSV
* [ ] Activation avec e-mail (mot de passe temporaire)
* [ ] Blocage et Suppression de comptes
* [ ] Moteurs de recherche et filtres

### 4. Gestion des abonnements
* [ ] Modèle MongoDB Abonnement
* [ ] Création / Modification / Suppression
* [ ] Logique d'abonnement limité en trajets
* [ ] Logique d'abonnement illimité en durée

### 5. Gestion des billets QR Code
* [ ] Modèle MongoDB Billet
* [ ] Algorithme de génération de billet
* [ ] Encodage et génération du QR Code
* [ ] Téléchargement du QR Code en PDF/Image

### 6. Validation des voyages
* [ ] Lecteur/Scanner de QR Code (Webcam API)
* [ ] Algorithme de validation (validité, expiration, solde restant)
* [ ] Décompte automatique d'un voyage
* [ ] Historique des passages (Check-in)

### 7. Tableau de bord
* [ ] KPI utilisateurs (actifs, bloqués, par rôle)
* [ ] Graphiques des abonnements actifs
* [ ] Statistiques sur les billets vendus et voyages effectués

### 8. Interface utilisateur React
* [ ] Page de connexion
* [ ] Layout du Dashboard Admin (Responsive)
* [ ] Vues CRUD Utilisateurs & Importation CSV
* [ ] Vues Abonnements
* [ ] Espace Client (Visualisation des billets et abonnements)
* [ ] Espace Agent (Scanner mobile de QR Code)

### 9. API & Base de données
* [ ] Schémas MongoDB complets
* [ ] Contrôleurs Express et validation des données (Joi ou Express-Validator)
* [ ] Middlewares de rôles (isAdmin, isAgent)

### 10. Tests
* [ ] Tests d'intégration API
* [ ] Validation de l'importation CSV
* [ ] Test de validation de sécurité des QR Codes

### 11. Documentation
* [ ] Documentation des endpoints API (Postman / Swagger)
* [ ] Manuel utilisateur pour Administrateurs et Agents

### 12. Déploiement
* [ ] Fichiers de variables d'environnement (`.env`)
* [ ] Build de production React
* [ ] Script de démarrage pour la mise en production

---

## 💻 Instructions de Démarrage Local

### Prérequis
* Node.js (v18+)
* MongoDB installé et actif en local

### Installation

1. À la racine du projet, installez toutes les dépendances (frontend et backend) :
   ```bash
   npm run install-all
   ```

2. Créez un fichier `.env` dans le dossier `/backend` sur le modèle de `.env.example`.

### Lancement du Projet

Démarrez simultanément l'API Express (sur le port 5050) et le serveur de développement React (sur le port 5173) :
```bash
npm run dev
```
