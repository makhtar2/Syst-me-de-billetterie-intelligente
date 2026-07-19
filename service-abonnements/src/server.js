import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
// Les modèles doivent être chargés AVANT la synchronisation : sans cet import,
// Sequelize ignore leur existence et ne crée aucune table.
import './models/index.js';
import app from './app.js';

dotenv.config();

// Port 5060 : distinct du Service Utilisateurs (5050) et du frontend (5173).
// Les deux services doivent pouvoir tourner en même temps.
const PORT = process.env.PORT || 5060;

const demarrer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Service Abonnements démarré sur le port ${PORT}`);
  });
};

demarrer();
