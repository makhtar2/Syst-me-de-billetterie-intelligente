import jwt from 'jsonwebtoken';

/**
 * Authentification du Service Abonnements.
 *
 * Les jetons ne sont PAS émis ici : ils viennent du Service Utilisateurs, qui
 * les signe avec `JWT_SECRET`. Ce service se contente de les vérifier avec la
 * même clé — d'où l'obligation que `JWT_SECRET` soit identique dans les deux
 * `.env` (PLAN-SERVICE-ABONNEMENTS.md §1).
 *
 * Le rôle est lu dans la charge utile du jeton, sans aucun appel au Service
 * Utilisateurs ni à MongoDB : c'est ce qui garde les deux services réellement
 * indépendants.
 *
 * Contrepartie assumée : si un compte est bloqué ou rétrogradé après l'émission
 * du jeton, ce service continue de l'accepter jusqu'à expiration. Les jetons
 * étant à durée limitée, l'écart reste borné.
 */

// Vérifie le jeton et attache l'identité à req.utilisateur
export const protect = (req, res, next) => {
  const entete = req.headers.authorization || '';

  if (!entete.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non authentifié : jeton manquant' });
  }

  if (!process.env.JWT_SECRET) {
    // Erreur de configuration, pas une faute du client : on ne laisse
    // surtout pas passer la requête.
    return res.status(500).json({ message: 'JWT_SECRET non configuré sur le service' });
  }

  try {
    const charge = jwt.verify(entete.slice(7), process.env.JWT_SECRET);
    req.utilisateur = { id: charge.id, role: charge.role };
    next();
  } catch (error) {
    const expire = error.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expire ? 'Session expirée, reconnectez-vous' : 'Non authentifié : jeton invalide',
    });
  }
};

// Réserve la route aux administrateurs
export const isAdmin = (req, res, next) => {
  if (req.utilisateur?.role === 'Administrateur') {
    return next();
  }
  return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
};
