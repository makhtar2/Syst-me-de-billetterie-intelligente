# Mini-TP — Service Utilisateurs

**Projet :** Système de billetterie intelligente avec QR Code et abonnements
**Périmètre :** Service Utilisateurs — backend (Node.js / Express / MongoDB)
**Branche :** `test/service-utilisateurs`

---

## 1. Fonctionnalités critiques du service

Une fonctionnalité est jugée **critique** lorsque sa défaillance entraîne une
faille de sécurité, une perte de données, ou rend le service inutilisable.

| # | Fonctionnalité | Pourquoi elle est critique | Gravité |
|---|---|---|---|
| F1 | Authentification (JWT) | Porte d'entrée unique. En panne, plus personne n'accède au service. | 🔴 Critique |
| F2 | Contrôle d'accès administrateur | Une faille laisserait un Agent ou un Client administrer tous les comptes. | 🔴 Critique |
| F3 | Hachage des mots de passe | Un stockage en clair exposerait tous les comptes en cas de fuite. | 🔴 Critique |
| F4 | Activation + mot de passe temporaire | Génère les accès et les transmet par e-mail. Défaillante, aucun compte ne devient utilisable. | 🔴 Critique |
| F5 | Changement de mot de passe imposé | Un mot de passe temporaire qui resterait valide indéfiniment est une faille. | 🟠 Majeure |
| F6 | Importation CSV | Traite des lots entiers : une erreur se propage à des dizaines de comptes. | 🟠 Majeure |
| F7 | Actions groupées | Effet de masse : une erreur bloque ou supprime plusieurs comptes d'un coup. | 🟠 Majeure |
| F8 | Suppression logique | Une suppression physique par erreur détruirait des données irrécupérables. | 🟠 Majeure |
| F9 | Recherche et filtrage | Sans elle, l'administration devient impraticable au-delà de quelques comptes. | 🟡 Modérée |
| F10 | Tableau de bord statistique | Fonction de pilotage : une erreur fausse la lecture, sans bloquer le service. | 🟡 Modérée |
| F11 | Modification d'un compte (dont le rôle) | Un changement de rôle mal contrôlé accorderait des privilèges d'administration indus. | 🔴 Critique |

---

## 2. Plan de tests

### 2.1 Stratégie

Deux niveaux complémentaires :

- **Tests unitaires** — fonctions pures et règles du modèle, sans base ni réseau.
  Rapides, ils vérifient une règle métier isolée.
- **Tests d'API (intégration)** — requêtes HTTP réelles traversant toute la
  chaîne : routes → middlewares → contrôleurs → MongoDB. Ils vérifient le
  comportement observable par le frontend.

### 2.2 Outillage

| Élément | Choix | Justification |
|---|---|---|
| Lanceur | `node:test` (intégré à Node.js) | Aucune dépendance ajoutée, compatible ESM natif |
| Assertions | `node:assert/strict` | Intégré |
| Tests HTTP | `supertest` | Standard pour Express, sans ouvrir de port |
| Base de données | MongoDB, base dédiée `billetterie_test_<pid>` | Isole totalement la base de développement |

### 2.3 Conditions d'exécution

- L'application Express est extraite dans `src/app.js`, importable sans écoute
  réseau ni connexion à la base : les tests la pilotent directement.
- Chaque fichier de test s'exécutant dans son propre processus, le nom de la
  base est suffixé par le PID pour éviter toute interférence en parallèle.
- L'envoi d'e-mails est neutralisé : **aucun message réel n'est émis**.
- La base de test est vidée avant chaque test et supprimée à la fin.

### 2.4 Commandes

```bash
npm test              # toute la suite
npm run test:unitaires
npm run test:api
```

### 2.5 Hors périmètre

Interface React, service Abonnements et service Billetterie : non couverts par
ce TP, qui porte sur le backend du Service Utilisateurs.

---

## 3. Tableau de synthèse

| ID | Cas de test | Type | Fonctionnalité | Résultat attendu | Statut |
|---|---|---|---|---|---|
| U1 | Mot de passe temporaire de 8 caractères | Unitaire | F4 | Longueur = 8 | ✅ |
| U2 | Mot de passe temporaire alphanumérique | Unitaire | F4 | Format `[a-z0-9]{8}` | ✅ |
| U3 | Valeur différente à chaque appel | Unitaire | F4 | > 90 valeurs distinctes / 100 | ✅ |
| U4 | Échappement d'un numéro `+221…` | Unitaire | F9 | Regex valide, pas d'exception | ✅ |
| U5 | Correspondance littérale du `+` | Unitaire | F9 | Le numéro est retrouvé | ✅ |
| U6 | Métacaractères neutralisés | Unitaire | F9 | `a.c` ne correspond pas à `abc` | ✅ |
| U7 | Texte ordinaire préservé | Unitaire | F9 | Chaîne inchangée | ✅ |
| U8 | Mot de passe absent du JSON | Unitaire | F3 | `password` indéfini | ✅ |
| U9 | Champ `id` exposé | Unitaire | F9 | `id` présent | ✅ |
| U10 | E-mail normalisé en minuscules | Unitaire | F1 | `awa.diop@test.com` | ✅ |
| U11 | Valeurs par défaut Client / Bloqué | Unitaire | F4 | Compte inutilisable à la création | ✅ |
| U12 | Rôle et statut hors énumération refusés | Unitaire | F2 | Erreur de validation | ✅ |
| U13 | Champs obligatoires exigés | Unitaire | F6 | Erreur sur chaque champ manquant | ✅ |
| U14 | E-mail mal formé rejeté | Unitaire | F6 | Erreur de validation | ✅ |
| A1 | Connexion d'un compte actif | API | F1 | 200 + jeton, sans mot de passe | ✅ |
| A2 | Mot de passe erroné | API | F1 | 401 | ✅ |
| A3 | Compte non actif | API | F1 | 403 | ✅ |
| A4 | Requête sans jeton | API | F2 | 401 | ✅ |
| A5 | Jeton invalide | API | F2 | 401 | ✅ |
| A6 | Agent tentant d'administrer | API | F2 | 403 | ✅ |
| A7 | Administrateur autorisé | API | F2 | 200 | ✅ |
| A8 | Déconnexion | API | F1 | 200 | ✅ |
| A9 | Création d'un compte | API | F4 | 201, statut `Bloqué` | ✅ |
| A10 | E-mail déjà utilisé | API | F6 | 409 | ✅ |
| A11 | Champs obligatoires manquants | API | F6 | 400 | ✅ |
| A12 | Liste des utilisateurs | API | F9 | Tableau JSON | ✅ |
| A13 | Recherche par e-mail | API | F9 | 1 résultat | ✅ |
| A14 | **Recherche par téléphone `+221…`** | API | F9 | 200, 1 résultat | ✅ |
| A15 | Recherche par identifiant unique | API | F9 | Compte trouvé | ✅ |
| A16 | Filtre par rôle | API | F9 | Uniquement ce rôle | ✅ |
| A17 | Filtre par statut | API | F9 | Uniquement ce statut | ✅ |
| A18 | Filtres combinés | API | F9 | Les deux critères respectés | ✅ |
| A19 | Statistiques par rôle et statut | API | F10 | Les 3 statuts présents | ✅ |
| A20 | Activation d'un compte | API | F4 | Actif, mot de passe haché régénéré | ✅ |
| A21 | Blocage sans régénération | API | F7 | Mot de passe inchangé | ✅ |
| A22 | Suppression logique | API | F8 | Statut `Supprimé`, donnée conservée | ✅ |
| A23 | Statut inconnu refusé | API | F7 | 400 | ✅ |
| A24 | Utilisateur inexistant | API | F7 | 404 | ✅ |
| A25 | Activation groupée | API | F7 | Tous actifs | ✅ |
| A26 | Blocage puis suppression groupés | API | F7 | Statuts appliqués | ✅ |
| A27 | Liste vide / action invalide | API | F7 | 400 | ✅ |
| A28 | Verrouillage sur mot de passe temporaire | API | F5 | 403 puis 200 après changement | ✅ |
| A29 | Import CSV valide | API | F6 | 2 créés, tous `Bloqué` | ✅ |
| A30 | Doublon ignoré, import poursuivi | API | F6 | 1 créé, 1 ignoré | ✅ |
| A31 | Lignes invalides rejetées une à une | API | F6 | 1 créé, 3 ignorés avec motifs | ✅ |
| A32 | Fichier non CSV | API | F6 | ≥ 400 | ✅ |
| A33 | Requête sans fichier | API | F6 | 400 | ✅ |
| A34 | Import sans authentification | API | F2 | 401 | ✅ |
| A35 | Fiche d'un compte par identifiant | API | F11 | 200, sans mot de passe | ✅ |
| A36 | Fiche d'un compte inexistant | API | F11 | 404 | ✅ |
| A37 | Fiche sans authentification | API | F2 | 401 | ✅ |
| A38 | Mise à jour des coordonnées | API | F11 | Champs modifiés | ✅ |
| A39 | **Changement de rôle** | API | F11 | Nouveau rôle appliqué | ✅ |
| A40 | Rôle hors énumération | API | F11 | 400, rôle inchangé | ✅ |
| A41 | Seuls les champs transmis changent | API | F11 | Les autres restent intacts | ✅ |
| A42 | Changement d'e-mail ignoré | API | F11 | E-mail d'origine conservé | ✅ |
| A43 | Changement de statut ignoré | API | F11 | Statut d'origine conservé | ✅ |
| A44 | Mise à jour d'un compte inexistant | API | F11 | 404 | ✅ |
| A45 | Mise à jour par un non-administrateur | API | F2 | 403 | ✅ |

**Total : 59 tests — 14 unitaires, 45 d'API. 59 réussis, 0 échec.**

---

## 4. Scénario fonctionnel complet

**Intitulé :** de l'importation d'un lot d'agents jusqu'à leur première connexion.

**Préalable :** un administrateur actif existe (`npm run seed:admin`).

| Étape | Action | Résultat attendu | Couvert par |
|---|---|---|---|
| 1 | L'administrateur se connecte | Jeton JWT délivré | A1 |
| 2 | Il importe un fichier CSV de 10 utilisateurs | 10 comptes créés, tous `Bloqué` | A29 |
| 3 | Le fichier contient un doublon et des lignes invalides | Lignes rejetées une à une avec leur motif, l'import se poursuit | A30, A31 |
| 4 | Il filtre la liste sur le rôle `Agent` | Seuls les agents s'affichent | A16 |
| 5 | Il recherche un agent par son numéro `+221…` | L'agent est trouvé | A14 |
| 6 | Il sélectionne 3 agents et les active | Statut `Actif`, mot de passe temporaire de 8 caractères généré | A25, U1 |
| 7 | Le système envoie les accès par e-mail | Message contenant l'identifiant et le mot de passe temporaire | (manuel, cf. §6) |
| 8 | L'agent se connecte avec ce mot de passe | Connexion acceptée | A1 |
| 9 | Il tente d'accéder à l'administration | **403** — changement de mot de passe exigé | A28 |
| 10 | Il définit un nouveau mot de passe | Accepté, `mustChangePassword` repassé à faux | A28 |
| 11 | Il accède de nouveau au service | Autorisé | A28 |
| 12 | L'administrateur bloque puis supprime un compte | Statut `Supprimé`, enregistrement conservé | A26, A22 |
| 13 | Il consulte le tableau de bord | Compteurs actifs / bloqués / supprimés à jour | A19 |

**Règle métier centrale vérifiée :** un compte n'est **jamais** utilisable avant
activation explicite par un administrateur, et un mot de passe temporaire ne
donne accès à rien tant qu'il n'a pas été remplacé.

---

## 5. Anomalies détectées grâce à cette démarche

Deux régressions réelles ont été trouvées pendant la mise en place des tests.

### 5.1 Recherche par téléphone — erreur 500

Le filtre construisait une expression régulière directement à partir de la
saisie : `new RegExp(search.trim(), 'i')`. Or tous les numéros du projet
commencent par `+221`, et un `+` en tête de motif est un quantificateur
invalide : **toute recherche par numéro renvoyait une erreur 500.**

Il s'agissait d'une non-conformité au cahier des charges, qui exige de
« rechercher un utilisateur à partir de son numéro de téléphone ».

*Correction :* échappement de la saisie (`escapeRegex`), ce qui supprime au
passage un risque d'injection d'expression régulière.
*Couverture ajoutée :* U4, U5, U6, U7 et A14.

### 5.2 Modale d'import CSV — champ de fichier hors de sa zone

Le champ `input[type=file]` était positionné en absolu sans ancrage : il se
calait sur la fenêtre modale entière et recouvrait tout l'écran en étant
invisible, interceptant les clics destinés aux boutons. L'import ne pouvait
donc jamais être déclenché.

*Correction :* ancrage du champ à sa zone de dépôt (`position: relative`).

### 5.3 Rôle invalide — erreur 500 au lieu de 400

Lors de la modification d'un compte, un rôle absent de l'énumération remontait
jusqu'à la validation Mongoose et produisait une **erreur 500**. Or il s'agit
d'une saisie invalide, qui relève du code `400 Bad Request` : une erreur serveur
laisse croire à une panne alors que la requête est simplement mal formée.

*Correction :* validation explicite du rôle avant enregistrement.
*Couverture ajoutée :* A40.

> Ces deux anomalies illustrent l'intérêt de la démarche : la première n'était
> pas visible depuis l'interface, qui filtre également côté client et masquait
> donc l'erreur renvoyée par l'API.

---

## 6. Limites connues

- **L'envoi d'e-mails n'est pas testé automatiquement.** Il est neutralisé
  pendant les tests pour éviter tout envoi réel. Son fonctionnement a été
  validé manuellement : connexion SMTP acceptée et message d'activation reçu.
- **Le frontend n'est pas couvert** : ce TP porte sur le backend du service.
- **Les tests requièrent une instance MongoDB locale.** Une base en mémoire
  (`mongodb-memory-server`) supprimerait cette dépendance.

---

## 7. Traçabilité

| Élément | Emplacement |
|---|---|
| Tests unitaires | `backend/tests/unitaires/` |
| Tests d'API | `backend/tests/api/` |
| Utilitaires de test | `backend/tests/helpers.js` |
| Application testable | `backend/src/app.js` |
| Jeux de données CSV | `docs/exemples/` |
