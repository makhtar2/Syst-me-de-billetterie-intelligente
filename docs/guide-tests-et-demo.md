# Guide — installation, tests et démonstration

Commandes à exécuter, dans l'ordre, pour installer le projet, lancer les tests et faire une démonstration.

## 1. Prérequis

- Node.js 18 ou plus (vérifier avec `node -v`)
- MongoDB installé et lancé en local
- MySQL installé et lancé en local — uniquement si tu veux faire tourner le vrai `service-abonnements/` ; le frontend fonctionne sans, contre un client API simulé (voir §9)

Si `npm` n'est pas reconnu dans le terminal, Node est probablement géré par `fnm` mais pas chargé dans cette session :

```bash
source ~/.zshrc
```

Si ça ne suffit pas, fermer le terminal et en ouvrir un nouveau.

## 2. Installation

Depuis la racine du projet :

```bash
npm run install-all
```

Installe les dépendances du backend et du frontend.

## 3. Configuration

Créer `backend/.env` à partir de `backend/.env.example` (au minimum `MONGO_URI` et `JWT_SECRET`).

## 4. Démarrer MongoDB

```bash
sudo systemctl start mongod
```

Vérifier que ça écoute :

```bash
ss -ltnp | grep 27017
```

## 5. Créer le compte administrateur

```bash
cd backend
npm run seed:admin
```

Identifiants par défaut (sauf s'ils sont surchargés dans `.env`) :
- Email : `admin@billetterie.com`
- Mot de passe : `Admin1234`

## 6. Lancer le projet

Depuis la racine :

```bash
npm run dev
```

Démarre l'API Express (port 5050) et le frontend React (port 5173). Ouvrir `http://localhost:5173`.

## 7. Lancer les tests

Backend Service Utilisateurs (depuis `backend/`) :

```bash
npm test               # toute la suite : 59 tests
npm run test:unitaires # 14 tests, sans base de données
npm run test:api       # 45 tests, avec une base MongoDB de test
```

Backend Service Abonnements (depuis `service-abonnements/`, nécessite MySQL — voir §9) :

```bash
npm test               # toute la suite : 75 tests
npm run test:unitaires # 24 tests, sans base de données
npm run test:api       # 51 tests, avec une base MySQL de test
```

Frontend (depuis `frontend/`) :

```bash
npm test                # 73 tests (22 Service Utilisateurs + 51 Service Abonnements)
```

Autres commandes utiles côté frontend :

```bash
npm run lint    # analyse statique
npm run build   # build de production
```

## 8. Démonstration — Service Utilisateurs

1. Se connecter avec le compte administrateur (§5).
2. Aller sur **Gestion des Comptes** → **Importer CSV** → déposer `docs/exemples/utilisateurs-test.csv`.
3. Rechercher un compte par numéro de téléphone (ex. `+221771234501`).
4. Sélectionner plusieurs comptes → **Activer** dans la barre d'actions groupées.
5. Se déconnecter, se reconnecter avec un des comptes activés et son mot de passe temporaire (reçu par e-mail si `EMAIL_*` est configuré dans `.env`, sinon visible dans les logs du serveur).
6. Constater la redirection forcée vers l'écran de changement de mot de passe.
7. Changer le mot de passe, vérifier l'accès débloqué.
8. Revenir sur le compte administrateur, modifier un compte (nom, téléphone ou rôle) depuis le tableau.
9. Bloquer puis supprimer un compte, vérifier les compteurs du tableau de bord (total, actifs, bloqués, supprimés).

## 9. Démonstration — Service Abonnements

Le frontend fonctionne contre un client API simulé (`frontend/src/services/apiAbonnements.js`) tant que le vrai `service-abonnements/` n'est pas branché — **aucune base MySQL n'est nécessaire pour cette démonstration**, `npm run dev` suffit.

1. Se connecter avec le compte administrateur.
2. Aller sur **Formules**, créer une formule Limitée (ex. 20 voyages, 30 jours, 15 000 FCFA).
3. Aller sur **Abonnements** → **Nouvelle souscription**, choisir un client actif et cette formule.
4. Tenter de souscrire le même client à une autre formule Limitée : refusé (un seul abonnement Limité/Illimité en cours par client). Le souscrire à un Ticket simple : accepté, les tickets restent cumulables.
5. Ouvrir la fiche détail de l'abonnement, consulter le solde et l'historique.
6. Suspendre l'abonnement, vérifier qu'il n'apparaît plus "Actif" ; le réactiver.
7. Le résilier : constater que l'action devient définitive (plus de renouvellement ni de réactivation possible).
8. Consulter le **Tableau de bord** : total, répartition par statut/type, revenu, expirations sous 7 jours.

Pour faire tourner le vrai backend (`service-abonnements/`, port 5060, optionnel à ce stade) :

```bash
cd service-abonnements
npm install
```

Créer `service-abonnements/.env` avec `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` et le même `JWT_SECRET` que `backend/.env` (le service ne réémet pas de jetons, il vérifie ceux du Service Utilisateurs).

```bash
npm run dev
```

Démarre l'API sur le port 5060, avec synchronisation automatique des tables MySQL.

## 10. Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| `npm: command not found` | fnm pas chargé dans le terminal | `source ~/.zshrc` ou nouveau terminal |
| `Error connecting to MongoDB` | MongoDB pas démarré | `sudo systemctl start mongod` |
| Erreur CORS dans la console du navigateur | Le backend a crashé (souvent lié à MongoDB) | Vérifier les logs du terminal backend |
| `401 Unauthorized` au login | Base de données vide, pas d'admin créé | `npm run seed:admin` |
| `service-abonnements` ne démarre pas | MySQL pas démarré, ou `.env` manquant | Vérifier que MySQL écoute sur le port configuré, créer `service-abonnements/.env` |
