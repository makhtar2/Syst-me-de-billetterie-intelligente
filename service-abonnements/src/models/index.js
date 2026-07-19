import { sequelize } from '../config/database.js';
import Formule from './Formule.js';
import Abonnement from './Abonnement.js';
import Consommation from './Consommation.js';

// --- Associations -----------------------------------------------------------

// Une formule est souscrite par plusieurs abonnements.
// RESTRICT : on ne peut pas supprimer une formule encore référencée — c'est la
// contrepartie technique de la règle « on désactive, on ne supprime jamais » (§4.1).
Formule.hasMany(Abonnement, { foreignKey: { name: 'FormuleId', allowNull: false }, onDelete: 'RESTRICT' });
Abonnement.belongsTo(Formule, { foreignKey: { name: 'FormuleId', allowNull: false } });

// Un abonnement porte l'historique de ses voyages.
// CASCADE : supprimer un abonnement doit emporter son historique, qui n'a
// aucun sens isolément.
Abonnement.hasMany(Consommation, { foreignKey: { name: 'AbonnementId', allowNull: false }, onDelete: 'CASCADE' });
Consommation.belongsTo(Abonnement, { foreignKey: { name: 'AbonnementId', allowNull: false } });

export { sequelize, Formule, Abonnement, Consommation };
