import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateTempPassword } from '../utils/generatePassword.js';
import { sendActivationEmail } from '../utils/sendEmail.js';

// Construit le filtre Mongo à partir des query params (role, status, search)
const buildUserFilter = ({ role, status, search }) => {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    const or = [{ email: regex }, { telephone: regex }, { nom: regex }, { prenom: regex }];
    // Recherche par identifiant unique si la chaîne est un ObjectId valide
    if (mongoose.Types.ObjectId.isValid(search)) {
      or.push({ _id: search });
    }
    filter.$or = or;
  }
  return filter;
};

// POST /api/admin/users — Créer un utilisateur individuel
export const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role } = req.body;

    if (!nom || !prenom || !email || !telephone) {
      return res.status(400).json({ message: 'Champs obligatoires manquants (nom, prénom, email, téléphone)' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Mot de passe temporaire ; le compte reste 'Bloqué' jusqu'à activation
    const tempPassword = generateTempPassword();
    const user = await User.create({
      nom,
      prenom,
      email,
      telephone,
      role: role || 'Client',
      password: tempPassword,
      status: 'Bloqué',
    });

    return res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
};

// GET /api/admin/users — Liste filtrée / recherchable + pagination
export const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = buildUserFilter({ role, status, search });

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

// GET /api/admin/users/:id — Détail d'un utilisateur
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /api/admin/users/:id — Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { nom, prenom, telephone, role, photo } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (telephone !== undefined) user.telephone = telephone;
    if (role !== undefined) user.role = role;
    if (photo !== undefined) user.photo = photo;

    await user.save();
    return res.status(200).json({ message: 'Utilisateur mis à jour', user });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// DELETE /api/admin/users/:id — Suppression logique (status = 'Supprimé')
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    user.status = 'Supprimé';
    await user.save();
    return res.status(200).json({ message: 'Utilisateur supprimé', user });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// Applique une action de statut à un utilisateur. Retourne le résultat.
const applyStatusAction = async (user, action) => {
  switch (action) {
    case 'Activer': {
      const tempPassword = generateTempPassword();
      user.password = tempPassword; // le hook pre('save') s'occupe du hachage
      user.status = 'Actif';
      user.mustChangePassword = true;
      await user.save();
      const emailResult = await sendActivationEmail(user, tempPassword);
      return { id: user._id, status: user.status, emailSent: emailResult.sent };
    }
    case 'Bloquer':
      user.status = 'Bloqué';
      await user.save();
      return { id: user._id, status: user.status };
    case 'Supprimer':
      user.status = 'Supprimé';
      await user.save();
      return { id: user._id, status: user.status };
    default:
      return { id: user._id, error: 'Action inconnue' };
  }
};

// PATCH /api/admin/users/bulk-status — Actions groupées (Activer/Bloquer/Supprimer)
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { userIds, action } = req.body;
    const allowed = ['Activer', 'Bloquer', 'Supprimer'];

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds doit être un tableau non vide' });
    }
    if (!allowed.includes(action)) {
      return res.status(400).json({ message: `Action invalide. Valeurs autorisées : ${allowed.join(', ')}` });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const results = [];
    for (const user of users) {
      results.push(await applyStatusAction(user, action));
    }

    return res.status(200).json({
      message: `Action "${action}" appliquée à ${results.length} utilisateur(s)`,
      results,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'action groupée", error: error.message });
  }
};

// GET /api/admin/dashboard/stats — Statistiques par rôle et par statut
export const getDashboardStats = async (req, res) => {
  try {
    const byRoleStatus = await User.aggregate([
      { $group: { _id: { role: '$role', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const stats = { total: 0, byRole: {}, byStatus: { Actif: 0, Bloqué: 0, Supprimé: 0 } };
    for (const { _id, count } of byRoleStatus) {
      stats.total += count;
      stats.byRole[_id.role] = stats.byRole[_id.role] || { total: 0, Actif: 0, Bloqué: 0, Supprimé: 0 };
      stats.byRole[_id.role].total += count;
      stats.byRole[_id.role][_id.status] += count;
      stats.byStatus[_id.status] += count;
    }

    return res.status(200).json({ stats });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du calcul des statistiques', error: error.message });
  }
};
