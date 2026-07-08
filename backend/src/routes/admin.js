import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { formatUser } from '../utils/formatUser.js';
import { generateTempPassword } from '../utils/generatePassword.js';
import { sendActivationEmail } from '../utils/emailService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(auth, isAdmin);

router.get('/dashboard/stats', async (_req, res) => {
  try {
    const users = await User.find({ status: { $ne: 'Supprimé' } });
    const roles = ['Administrateur', 'Agent', 'Client'];
    const stats = { global: buildRoleStats(users) };

    roles.forEach((role) => {
      stats[role] = buildRoleStats(users.filter((u) => u.role === role));
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function buildRoleStats(users) {
  return {
    total: users.length,
    actif: users.filter((u) => u.status === 'Actif').length,
    bloque: users.filter((u) => u.status === 'Bloqué').length,
    supprime: users.filter((u) => u.status === 'Supprimé').length,
  };
}

router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role && role !== 'Tous') filter.role = role;
    if (status && status !== 'Tous') filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { email: regex },
        { telephone: regex },
        { nom: regex },
        { prenom: regex },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map(formatUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role } = req.body;
    if (!nom || !prenom || !email || !telephone) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'Cet email existe déjà' });

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

    res.status(201).json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Fichier CSV requis' });

  const results = [];
  const errors = [];

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    let count = 0;
    for (const row of results) {
      const nom = row.nom?.trim();
      const prenom = row.prenom?.trim();
      const email = row.email?.trim()?.toLowerCase();
      const telephone = row.telephone?.trim();
      const role = row.role?.trim() || 'Client';

      if (!nom || !prenom || !email || !telephone) {
        errors.push({ email, message: 'Ligne invalide' });
        continue;
      }

      const exists = await User.findOne({ email });
      if (exists) {
        errors.push({ email, message: 'Email déjà existant' });
        continue;
      }

      await User.create({
        nom,
        prenom,
        email,
        telephone,
        role: ['Administrateur', 'Agent', 'Client'].includes(role) ? role : 'Client',
        password: generateTempPassword(),
        status: 'Bloqué',
      });
      count++;
    }

    res.json({ count, errors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

router.patch('/users/bulk-status', async (req, res) => {
  try {
    const { userIds, action } = req.body;
    if (!userIds?.length || !action) {
      return res.status(400).json({ message: 'userIds et action requis' });
    }

    const users = await User.find({ _id: { $in: userIds } });

    for (const user of users) {
      if (action === 'Actif') {
        const tempPassword = generateTempPassword();
        user.password = tempPassword;
        user.status = 'Actif';
        user.mustChangePassword = true;
        await user.save();
        await sendActivationEmail(user, tempPassword);
      } else if (action === 'Bloqué' || action === 'Supprimé') {
        user.status = action;
        await user.save();
      }
    }

    res.json({ message: `${users.length} utilisateur(s) mis à jour` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (status === 'Actif' && user.status !== 'Actif') {
      const tempPassword = generateTempPassword();
      user.password = tempPassword;
      user.mustChangePassword = true;
      await sendActivationEmail(user, tempPassword);
    }

    user.status = status;
    await user.save();

    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.status = 'Supprimé';
    await user.save();

    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
