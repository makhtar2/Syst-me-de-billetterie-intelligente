import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { formatUser } from '../utils/formatUser.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.status !== 'Actif') {
      return res.status(401).json({ message: 'Identifiants invalides ou compte inactif' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: formatUser(user),
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', auth, (_req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

export default router;
