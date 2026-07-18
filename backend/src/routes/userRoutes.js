import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
} from '../controllers/profileController.js';
import { protect, requirePasswordChanged } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = express.Router();

// Toutes les routes de profil nécessitent d'être connecté
router.use(protect);

// Accessibles même avec un mot de passe temporaire :
// consulter son profil et remplacer le mot de passe.
router.get('/profile', getProfile);
router.put('/profile/password', changePassword);

// Nécessitent d'avoir déjà changé le mot de passe temporaire
router.put('/profile', requirePasswordChanged, updateProfile);
router.post('/profile/photo', requirePasswordChanged, uploadPhoto, uploadProfilePhoto);

export default router;
