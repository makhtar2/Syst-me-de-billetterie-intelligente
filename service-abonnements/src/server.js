// DOIT rester le tout premier import : les modules ES sont évalués dans
// l'ordre, et config/database.js lit process.env dès son chargement. Un
// dotenv.config() placé plus bas s'exécuterait trop tard, et Sequelize
// utiliserait silencieusement les valeurs par défaut au lieu du .env.
import 'dotenv/config';

import { connectDB } from './config/database.js';
// Les modèles doivent être chargés AVANT la synchronisation : sans cet import,
// Sequelize ignore leur existence et ne crée aucune table.
import './models/index.js';
import app from './app.js';

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
