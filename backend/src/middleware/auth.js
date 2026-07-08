import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

export async function isAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Administrateur' || user.status !== 'Actif') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
