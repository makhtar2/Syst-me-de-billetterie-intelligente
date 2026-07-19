# Guide — installation, tests et démonstration

Commandes à exécuter, dans l'ordre, pour installer le projet, lancer les tests et faire une démonstration.

## 1. Prérequis

- Node.js 18 ou plus (vérifier avec `node -v`)
- MongoDB installé et lancé en local

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

Backend (depuis `backend/`) :

```bash
npm test               # toute la suite : 59 tests
npm run test:unitaires # 14 tests, sans base de données
npm run test:api       # 45 tests, avec une base MongoDB de test
```

Frontend (depuis `frontend/`) :

```bash
npm test               # 22 tests
```

Autres commandes utiles côté frontend :

```bash
npm run lint    # analyse statique
npm run build   # build de production
```

## 8. Démonstration — parcours à suivre

1. Se connecter avec le compte administrateur (§5).
2. Aller sur **Gestion des Comptes** → **Importer CSV** → déposer `docs/exemples/utilisateurs-test.csv`.
3. Rechercher un compte par numéro de téléphone (ex. `+221771234501`).
4. Sélectionner plusieurs comptes → **Activer** dans la barre d'actions groupées.
5. Se déconnecter, se reconnecter avec un des comptes activés et son mot de passe temporaire (reçu par e-mail si `EMAIL_*` est configuré dans `.env`, sinon visible dans les logs du serveur).
6. Constater la redirection forcée vers l'écran de changement de mot de passe.
7. Changer le mot de passe, vérifier l'accès débloqué.
8. Revenir sur le compte administrateur, modifier un compte (nom, téléphone ou rôle) depuis le tableau.
9. Bloquer puis supprimer un compte, vérifier les compteurs du tableau de bord (total, actifs, bloqués, supprimés).

## 9. Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| `npm: command not found` | fnm pas chargé dans le terminal | `source ~/.zshrc` ou nouveau terminal |
| `Error connecting to MongoDB` | MongoDB pas démarré | `sudo systemctl start mongod` |
| Erreur CORS dans la console du navigateur | Le backend a crashé (souvent lié à MongoDB) | Vérifier les logs du terminal backend |
| `401 Unauthorized` au login | Base de données vide, pas d'admin créé | `npm run seed:admin` |
