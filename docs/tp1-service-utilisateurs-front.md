# TP1 — Service Utilisateurs (Volet Front-end)

> Périmètre de ce document : uniquement la partie **front-end** du Service Utilisateurs
> (authentification, profil, gestion des comptes). La partie back-end (API, base de
> données, e-mails) est traitée séparément par le binôme en charge du back — voir sa
> propre Pull Request pour les 3 tests API exigés par le TP.

---

## 1. Fonctionnalités critiques du service (périmètre front)

| # | Fonctionnalité | Fichier(s) source | Pourquoi c'est critique |
|---|---|---|---|
| F1 | Connexion (login) | `pages/Login.jsx` | Point d'entrée unique de l'application ; toute panne bloque tous les utilisateurs. |
| F2 | Redirection forcée si mot de passe temporaire | `Login.jsx`, `App.jsx`, `pages/ProfileSettings.jsx` | Exigence de sécurité : un compte activé par CSV/admin ne doit pas naviguer avec un mot de passe temporaire. |
| F3 | Consultation / mise à jour du profil | `pages/ProfileSettings.jsx` | Permet à chaque utilisateur de garder des informations de contact valides. |
| F4 | Changement de mot de passe | `pages/ProfileSettings.jsx` | Fonctionnalité de sécurité, condition de sortie du mode "mot de passe temporaire" (F2). |
| F5 | Upload de la photo de profil | `pages/ProfileSettings.jsx` | Manipule un upload de fichier (taille/format), source d'erreurs fréquentes. |
| F6 | Liste, recherche et filtrage des utilisateurs | `pages/UserManagement.jsx` | Outil principal de l'administrateur pour piloter les comptes. |
| F7 | Statistiques par rôle et par statut (Total/Actifs/Bloqués/Supprimés) | `pages/UserManagement.jsx` | Donnée affichée en premier à l'administrateur ; doit refléter exactement les 4 statuts exigés. |
| F8 | Création individuelle d'un utilisateur | `components/CreateUserModal.jsx` | Empêche la création de comptes incomplets (champs obligatoires). |
| F9 | Import massif d'utilisateurs par CSV | `components/ImportCsvModal.jsx` | Opération en masse à fort impact (peut créer/bloquer beaucoup de comptes en une action). |
| F10 | Actions groupées et unitaires (activer/bloquer/supprimer) | `pages/UserManagement.jsx` | Opérations irréversibles ou sensibles sur les comptes. |
| F11 | Client API centralisé (token JWT, gestion des erreurs réseau) | `services/api.js` | Toutes les fonctionnalités ci-dessus en dépendent ; un bug ici affecte tout le service. |

---

## 2. Plan de tests

| Niveau | Objectif | Outil | Portée |
|---|---|---|---|
| Unitaire | Vérifier les règles de validation pures (email, champs requis, mot de passe) indépendamment du DOM et du réseau. | Jest | `src/utils/validators.js` |
| Intégration front ↔ API | Vérifier que `services/api.js` appelle les bons endpoints avec les bons payloads et gère correctement les erreurs HTTP. | (à la charge du binôme back — 3 tests API) | `services/api.js` ↔ endpoints Express |
| Fonctionnel (manuel) | Dérouler le parcours complet d'un administrateur, du login à la gestion des comptes. | Navigateur (manuel), voir §4 | Application complète |

Stratégie retenue pour le volet front : au vu du périmètre (respecter strictement
« gestion des utilisateurs », ne pas dépasser sur le back), les tests **unitaires**
couvrent la logique métier extraite des composants (validation de formulaires), qui est
la seule logique front testable sans dépendre d'un serveur réel ou d'un environnement
DOM complet (jsdom). Les tests **API** sont couverts côté back par le binôme
correspondant, conformément à la répartition du travail.

---

## 3. Tableau de synthèse

| Fonctionnalité | Criticité | Type de test appliqué | Statut |
|---|---|---|---|
| F1 Connexion | Haute | Unitaire (`validateLoginForm`) + scénario fonctionnel | ✅ Couvert |
| F2 Redirection mot de passe temporaire | Haute | Scénario fonctionnel | ✅ Couvert (manuel) |
| F3 Mise à jour du profil | Moyenne | Scénario fonctionnel | ✅ Couvert (manuel) |
| F4 Changement de mot de passe | Haute | Unitaire (`validateNewPassword`) + scénario fonctionnel | ✅ Couvert |
| F5 Upload photo de profil | Basse | Scénario fonctionnel | ⚠️ Manuel uniquement |
| F6 Liste / recherche / filtres | Moyenne | Scénario fonctionnel | ⚠️ Manuel uniquement |
| F7 Statistiques par statut | Haute | Revue de code (correction du 18/07/2026 : "Supprimés" manquant) | ✅ Corrigé |
| F8 Création individuelle | Moyenne | Unitaire (`isValidCreateUserForm`) + scénario fonctionnel | ✅ Couvert |
| F9 Import CSV | Haute | Scénario fonctionnel | ⚠️ Manuel uniquement (tests API côté back) |
| F10 Actions groupées/unitaires | Haute | Scénario fonctionnel | ⚠️ Manuel uniquement (tests API côté back) |
| F11 Client API (`services/api.js`) | Haute | Tests API (côté back, hors périmètre de ce document) | ➡️ Voir PR back |

---

## 4. Scénario fonctionnel complet

**Titre : Activation d'un compte importé par CSV et première connexion**

1. L'administrateur se connecte (`/login`) avec ses identifiants → redirection vers le
   Dashboard (F1).
2. Il ouvre **Gestion des Comptes**, clique sur **Importer CSV**, dépose un fichier
   `utilisateurs-test.csv` contenant un nouvel utilisateur `Client` (F9).
3. L'import réussit : le tableau se rafraîchit, le nouvel utilisateur apparaît avec le
   statut `Bloqué`, et la carte de statistiques **Clients** voit son compteur **Total**
   augmenter de 1 (F6, F7).
4. L'administrateur sélectionne ce compte via la checkbox et clique sur **Activer**
   dans la barre d'actions groupées → le statut passe à `Actif` (F10). Le compteur
   **Actifs** de la carte Clients augmente, le compteur **Bloqués** diminue (F7).
5. Le nouvel utilisateur reçoit ses identifiants temporaires (côté back) et se connecte
   sur `/login` (F1).
6. Parce que `mustChangePassword` vaut `true`, il est automatiquement redirigé vers
   `/profile` et ne peut naviguer ailleurs tant qu'il n'a pas changé son mot de passe
   (F2) : tous les champs du formulaire d'informations personnelles sont désactivés.
7. Il renseigne son ancien mot de passe (temporaire) et un nouveau mot de passe de
   8 caractères minimum, confirmé à l'identique → validation réussie (F4), le bandeau
   d'avertissement disparaît.
8. Il peut désormais modifier ses informations personnelles (F3) et téléverser une
   photo de profil (F5).
9. Retour côté administrateur : il consulte à nouveau **Gestion des Comptes**, filtre
   par rôle `Client` et par statut `Actif` (F6) pour confirmer que le compte est bien
   opérationnel, puis vérifie que la carte **Global** additionne correctement
   Total/Actifs/Bloqués/**Supprimés** (F7).

**Résultat attendu** : à chaque étape, l'état affiché à l'écran (statuts, compteurs,
redirections) reste cohérent avec les actions effectuées, sans rechargement manuel de
la page.

---

## 5. Tests unitaires (livré dans ce volet front)

Fichier : `frontend/src/utils/validators.js` / `frontend/src/utils/validators.test.js`
(12 cas, exécutables via `npm test --prefix frontend`) :

- `isValidEmail` : format d'email valide / invalide / vide.
- `isValidCreateUserForm` : formulaire complet / champ manquant / aucun champ.
- `validateLoginForm` : email vide, mot de passe < 6 caractères, cas valide.
- `validateNewPassword` : mot de passe trop court, mots de passe différents, cas valide.

Ces règles étaient auparavant écrites en ligne dans `CreateUserModal.jsx`, `Login.jsx`
et `ProfileSettings.jsx` et donc impossibles à tester sans monter tout le composant.
Elles ont été extraites sans changement de comportement (voir commit
`refactor(front): extraire les validations de formulaire dans utils/validators.js`).

## 6. Tests API

Hors périmètre de ce document : à la charge du binôme back-end (routes
`/api/auth/login`, `/api/users/profile`, `/api/admin/users`, etc.), conformément à la
répartition « je gère uniquement le front, jamais le back ».
