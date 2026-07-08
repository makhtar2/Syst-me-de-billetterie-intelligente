import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { formatUser } from '../utils/formatUser.js';

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { nom, prenom, telephone, photo } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (photo !== undefined) user.photo = photo;

    await user.save();
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mot de passe invalide (min. 6 caractères)' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Ancien mot de passe incorrect' });

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
