import express from 'express';
import { verifierValidite } from '../controllers/validiteController.js';
import { protect, isAdminOuAgent } from '../middleware/auth.js';

const router = express.Router();

// Ouvert aux agents en plus des administrateurs : c'est l'agent qui contrôle
// les titres sur le terrain (voir middleware/auth.js).
router.use(protect, isAdminOuAgent);

router.get('/:utilisateurId', verifierValidite);

export default router;
