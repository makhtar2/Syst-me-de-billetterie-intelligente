import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@billetterie.com';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin déjà présent: ${email}`);
    process.exit(0);
  }

  await User.create({
    nom: 'Admin',
    prenom: 'Système',
    email,
    telephone: '+221770000000',
    role: 'Administrateur',
    status: 'Actif',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    mustChangePassword: false,
  });

  console.log(`Admin créé: ${email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
