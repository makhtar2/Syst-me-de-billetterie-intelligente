import express from 'express';
import {
  souscrire,
  listerSouscriptions,
  obtenirSouscription,
  changerStatut,
  renouveler,
} from '../controllers/souscriptionController.js';
import { consommerVoyage, historiqueVoyages } from '../controllers/consommationController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Réservé aux administrateurs (contrat §4)
router.use(protect, isAdmin);

router.route('/').post(souscrire).get(listerSouscriptions);

// Déclarées avant /:id pour éviter que ces segments soient pris pour un identifiant
router.patch('/:id/statut', changerStatut);
router.post('/:id/renouveler', renouveler);
router.post('/:id/consommer', consommerVoyage);
router.get('/:id/historique', historiqueVoyages);

router.get('/:id', obtenirSouscription);

export default router;
