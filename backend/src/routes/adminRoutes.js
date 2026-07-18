import express from 'express';
import {
  createUser,
  getUsers,
  deleteUser,
  bulkUpdateStatus,
  updateUserStatus,
  getDashboardStats,
} from '../controllers/userController.js';
import { importUsers } from '../controllers/importController.js';
import { uploadCsv } from '../middleware/upload.js';
import { protect, isAdmin, requirePasswordChanged } from '../middleware/auth.js';

const router = express.Router();

// Réservé aux administrateurs ayant déjà remplacé leur mot de passe temporaire
router.use(protect, requirePasswordChanged, isAdmin);

// Statistiques du tableau de bord
router.get('/dashboard/stats', getDashboardStats);

// Importation CSV et actions groupées (avant /:id pour éviter les collisions de route)
router.post('/users/import', uploadCsv, importUsers);
router.patch('/users/bulk-status', bulkUpdateStatus);

// Gestion des utilisateurs (création, consultation, statut, suppression)
router.route('/users').post(createUser).get(getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
