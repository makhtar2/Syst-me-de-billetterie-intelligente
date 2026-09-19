import { Sequelize } from 'sequelize';
import logger from './logger.js';

// Base de données PostgreSQL du microservice Billetterie.
// Indépendante des bases MongoDB (Utilisateurs) et PostgreSQL (Abonnements).
// En production (Neon/Render), DATABASE_URL est utilisé en priorité.
const nomBase =
  process.env.NODE_ENV === 'test'
    ? process.env.DB_NAME_TEST || 'billetterie_db_test'
    : process.env.DB_NAME || 'billetterie_db';

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
      define: { freezeTableName: true, underscored: false },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      nomBase,
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        define: {
          freezeTableName: true,
          underscored: false,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const label = process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : `PostgreSQL : ${nomBase} sur le port ${process.env.DB_PORT || 5432}`;
    logger.info(`${label} connecté`);

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Schéma PostgreSQL synchronisé avec succès.');
    } else {
      await sequelize.sync();
      logger.info('Schéma PostgreSQL synchronisé (production).');
    }
  } catch (error) {
    logger.error(`Erreur critique de connexion PostgreSQL : ${error.message}`);
    process.exit(1);
  }
};

export default sequelize;
