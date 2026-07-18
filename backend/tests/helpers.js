import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Base dédiée aux tests : jamais celle de développement.
const TEST_MONGO_URI =
  process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/billetterie_test';

// Secret fixe pour que les jetons soient vérifiables pendant les tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-de-test';

// Neutralise l'envoi d'e-mails : aucun message réel ne doit partir en test.
process.env.EMAIL_HOST = '';
process.env.EMAIL_USER = '';
process.env.EMAIL_PASS = '';

export const connectTestDb = async () => {
  await mongoose.connect(TEST_MONGO_URI);
};

export const clearTestDb = async () => {
  await User.deleteMany({});
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

// Crée un utilisateur directement en base (contourne l'API)
export const creerUtilisateur = async (surcharges = {}) => {
  return User.create({
    nom: 'Diop',
    prenom: 'Awa',
    email: `user${Date.now()}${Math.random().toString(36).slice(2, 7)}@test.com`,
    telephone: '+221770000000',
    role: 'Client',
    status: 'Actif',
    password: 'MotDePasse1',
    mustChangePassword: false,
    ...surcharges,
  });
};

// Crée un administrateur actif et renvoie l'en-tête d'authentification prêt à l'emploi
export const creerAdminEtToken = async (request, app) => {
  const motDePasse = 'AdminTest1';
  const admin = await creerUtilisateur({
    role: 'Administrateur',
    status: 'Actif',
    password: motDePasse,
  });

  const reponse = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: motDePasse });

  return { admin, motDePasse, token: reponse.body.token, header: `Bearer ${reponse.body.token}` };
};
