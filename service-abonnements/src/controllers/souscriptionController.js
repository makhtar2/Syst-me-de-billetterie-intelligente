import { Op } from 'sequelize';
import {
  Formule,
  Abonnement,
  STATUTS_ABONNEMENT,
  STATUTS_EN_COURS,
  TYPES_FORMULE,
} from '../models/index.js';

/**
 * Souscriptions et cycle de vie des abonnements.
 * Contrat d'API : PLAN-SERVICE-ABONNEMENTS.md §4.2
 */

// Seuls ces statuts se pilotent à la main. EXPIRE et EPUISE sont calculés à la
// lecture (règle actée §4.2) : les imposer manuellement n'aurait aucun sens.
const STATUTS_PILOTABLES = ['ACTIF', 'SUSPENDU', 'RESILIE'];

const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

const erreurValidation = (error) =>
  error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError';

const messageValidation = (error) =>
  error.errors?.map((e) => e.message).join(' · ') || error.message;

// Ajoute une durée en jours à une date 'AAAA-MM-JJ'
const ajouterJours = (dateISO, jours) => {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().split('T')[0];
};

// Recharge l'abonnement avec sa formule : le contrat impose l'objet
// `formule: { id, nom, type }` imbriqué dans la réponse.
const avecFormule = (id) => Abonnement.findByPk(id, { include: Formule });

// POST /api/abonnements/souscriptions
export const souscrire = async (req, res) => {
  try {
    const { utilisateurId, formuleId, dateDebut } = req.body;

    if (!utilisateurId || !formuleId || !dateDebut) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants (utilisateurId, formuleId, dateDebut)',
      });
    }
    if (!FORMAT_DATE.test(dateDebut)) {
      return res.status(400).json({ message: 'dateDebut doit être au format AAAA-MM-JJ' });
    }

    const formule = await Formule.findByPk(formuleId);
    if (!formule) {
      return res.status(404).json({ message: 'Formule introuvable' });
    }
    if (!formule.actif) {
      return res.status(409).json({ message: 'Cette formule n’est plus proposée' });
    }

    // Règle actée §4.2 : un client ne peut détenir qu'un seul abonnement en
    // cours. Les tickets simples y échappent — c'est le principe du carnet.
    if (formule.type !== 'TICKET_SIMPLE') {
      const enCours = await Abonnement.findOne({
        where: { utilisateurId, statut: { [Op.in]: STATUTS_EN_COURS } },
        include: { model: Formule, where: { type: { [Op.ne]: 'TICKET_SIMPLE' } } },
      });
      // Un abonnement expiré depuis la dernière lecture ne doit pas bloquer :
      // on recalcule son statut réel avant de refuser.
      if (enCours && STATUTS_EN_COURS.includes(enCours.statutEffectif())) {
        return res.status(409).json({ message: 'Ce client possède déjà un abonnement en cours' });
      }
      if (enCours) await enCours.rafraichirStatut();
    }

    const abonnement = await Abonnement.create({
      utilisateurId,
      FormuleId: formule.id,
      dateDebut,
      dateExpiration: ajouterJours(dateDebut, formule.dureeValiditeJours),
      // Copiés depuis la formule : l'abonnement vendu garde ses conditions même
      // si le catalogue évolue ensuite.
      voyagesAutorises: formule.nombreVoyages,
      voyagesConsommes: 0,
      statut: 'ACTIF',
    });

    return res.status(201).json({ abonnement: await avecFormule(abonnement.id) });
  } catch (error) {
    if (erreurValidation(error)) {
      return res.status(400).json({ message: messageValidation(error) });
    }
    return res.status(500).json({ message: 'Erreur lors de la souscription' });
  }
};

// GET /api/abonnements/souscriptions?utilisateurId=&statut=&type=&recherche=
export const listerSouscriptions = async (req, res) => {
  try {
    const { utilisateurId, statut, type, recherche } = req.query;

    if (statut && !STATUTS_ABONNEMENT.includes(statut)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs autorisées : ${STATUTS_ABONNEMENT.join(', ')}`,
      });
    }
    if (type && !TYPES_FORMULE.includes(type)) {
      return res.status(400).json({
        message: `Type invalide. Valeurs autorisées : ${TYPES_FORMULE.join(', ')}`,
      });
    }

    const where = {};
    if (utilisateurId) where.utilisateurId = utilisateurId;
    if (recherche) where.utilisateurId = { [Op.like]: `%${recherche}%` };

    const abonnements = await Abonnement.findAll({
      where,
      include: type ? { model: Formule, where: { type } } : Formule,
      order: [['createdAt', 'DESC']],
    });

    // Les statuts EXPIRE et EPUISE sont calculés, pas stockés en temps réel :
    // on les rafraîchit AVANT de filtrer, sinon un abonnement expiré depuis
    // hier ressortirait encore comme ACTIF dans les résultats.
    for (const abonnement of abonnements) {
      await abonnement.rafraichirStatut();
    }

    const resultat = statut ? abonnements.filter((a) => a.statut === statut) : abonnements;
    return res.status(200).json(resultat);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des abonnements' });
  }
};

// GET /api/abonnements/souscriptions/:id
export const obtenirSouscription = async (req, res) => {
  try {
    const abonnement = await avecFormule(req.params.id);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable' });
    }
    await abonnement.rafraichirStatut();
    return res.status(200).json({ abonnement });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/abonnements/souscriptions/:id/statut
export const changerStatut = async (req, res) => {
  try {
    const { statut } = req.body;

    if (!STATUTS_PILOTABLES.includes(statut)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs autorisées : ${STATUTS_PILOTABLES.join(', ')}`,
      });
    }

    const abonnement = await avecFormule(req.params.id);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable' });
    }

    // Une résiliation est définitive : réactiver reviendrait à ressusciter un
    // contrat rompu. Le client doit souscrire à nouveau.
    if (abonnement.statut === 'RESILIE' && statut !== 'RESILIE') {
      return res.status(409).json({
        message: 'Abonnement résilié : souscrivez un nouvel abonnement',
      });
    }

    abonnement.statut = statut;
    await abonnement.save();

    // Réactiver un abonnement dont la date est passée ou le solde épuisé ne
    // doit pas le rendre utilisable : on renvoie son statut réel.
    if (statut === 'ACTIF') await abonnement.rafraichirStatut();

    return res.status(200).json({ abonnement });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du changement de statut' });
  }
};

// POST /api/abonnements/souscriptions/:id/renouveler
export const renouveler = async (req, res) => {
  try {
    const { dateDebut } = req.body;

    if (!dateDebut || !FORMAT_DATE.test(dateDebut)) {
      return res.status(400).json({ message: 'dateDebut est obligatoire, au format AAAA-MM-JJ' });
    }

    const abonnement = await avecFormule(req.params.id);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable' });
    }
    if (abonnement.statut === 'RESILIE') {
      return res.status(409).json({
        message: 'Abonnement résilié : souscrivez un nouvel abonnement',
      });
    }
    if (abonnement.Formule.type === 'TICKET_SIMPLE') {
      return res.status(409).json({ message: 'Un ticket simple ne se renouvelle pas' });
    }

    // Le renouvellement repart d'une période neuve : nouvelles dates, compteur
    // remis à zéro. On conserve les conditions d'origine (voyagesAutorises),
    // conformément à la règle du tarif figé (§4.1).
    abonnement.dateDebut = dateDebut;
    abonnement.dateExpiration = ajouterJours(dateDebut, abonnement.Formule.dureeValiditeJours);
    abonnement.voyagesConsommes = 0;
    abonnement.statut = 'ACTIF';
    await abonnement.save();

    await abonnement.rafraichirStatut();
    return res.status(200).json({ abonnement });
  } catch (error) {
    if (erreurValidation(error)) {
      return res.status(400).json({ message: messageValidation(error) });
    }
    return res.status(500).json({ message: 'Erreur lors du renouvellement' });
  }
};
