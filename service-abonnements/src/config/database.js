import { Sequelize } from 'sequelize';

// Connexion PostgreSQL du microservice Abonnements (migré de MySQL vers PostgreSQL
// pour compatibilité Neon / Render — Sequelize rend la migration transparente).
// Ce service ne touche JAMAIS à la base MongoDB du Service Utilisateurs :
// il ne conserve que l'identifiant de l'utilisateur, jamais ses données
// personnelles (voir PLAN-SERVICE-ABONNEMENTS.md §1).

// En production (Neon), DATABASE_URL contient l'URL complète avec SSL.
// En développement / test, on utilise les variables individuelles.
const nomBase =
  process.env.NODE_ENV === 'test'
    ? process.env.DB_NAME_TEST || 'billetterie_abonnements_test'
    : process.env.DB_NAME || 'billetterie_abonnements';

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
      define: { freezeTableName: true, underscored: false },
    })
  : new Sequelize(
      nomBase,
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        // Les requêtes SQL ne sont journalisées qu'en développement :
        // elles pollueraient la sortie des tests.
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          // Noms de tables tels que déclarés, sans pluralisation automatique
          freezeTableName: true,
          underscored: false,
        },
      }
    );

// Ouvre la connexion et synchronise le schéma.
// `alter` en développement et test, `force: false` en production (Neon).
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const label = process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : `PostgreSQL : ${nomBase}`;
    console.log(`${label} connecté`);

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
    } else {
      // En production, on synchronise sans alter pour ne pas altérer les colonnes
      await sequelize.sync();
    }
  } catch (error) {
    console.error(`Erreur de connexion PostgreSQL : ${error.message}`);
    process.exit(1);
  }
};

export default sequelize;
