import express from 'express';
import {
  souscrire,
  listerSouscriptions,
  obtenirSouscription,
  changerStatut,
  renouveler,
} from '../controllers/souscriptionController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Réservé aux administrateurs (contrat §4)
router.use(protect, isAdmin);

router.route('/').post(souscrire).get(listerSouscriptions);

// Déclarées avant /:id pour éviter que ces segments soient pris pour un identifiant
router.patch('/:id/statut', changerStatut);
router.post('/:id/renouveler', renouveler);

router.get('/:id', obtenirSouscription);

export default router;
