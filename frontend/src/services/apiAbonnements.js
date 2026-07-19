// Client API du Service Abonnements — voir PLAN-SERVICE-ABONNEMENTS.md §4 pour le contrat.
//
// SIMULATION (§5.4 du plan) : le backend (service-abonnements/, port 5060,
// MySQL) n'est pas encore prêt. Ce module respecte exactement les signatures,
// formes de réponse et codes d'erreur du contrat, mais travaille sur des
// données en mémoire. Le jour où le backend est disponible, seul le corps de
// ces fonctions change (remplacé par de vrais appels fetch) — aucun composant
// qui consomme ce module n'aura à être modifié.
export const USING_SIMULATION = true;

const SIMULATED_DELAY_MS = 150;

const delay = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));

class ApiAbonnementsError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// --- Données en mémoire (remplacées par MySQL côté backend) ---

const SEED_FORMULES = [
  {
    id: 1,
    nom: 'Ticket simple',
    description: 'Un seul voyage',
    type: 'TICKET_SIMPLE',
    tarif: 500,
    dureeValiditeJours: 1,
    nombreVoyages: 1,
    actif: true,
    creeLe: '2026-07-19',
  },
  {
    id: 2,
    nom: 'Abonnement mensuel 20 voyages',
    description: 'Valable 30 jours',
    type: 'LIMITE',
    tarif: 15000,
    dureeValiditeJours: 30,
    nombreVoyages: 20,
    actif: true,
    creeLe: '2026-07-19',
  },
  {
    id: 3,
    nom: 'Abonnement illimité mensuel',
    description: 'Voyages illimités pendant 30 jours',
    type: 'ILLIMITE',
    tarif: 25000,
    dureeValiditeJours: 30,
    nombreVoyages: null,
    actif: true,
    creeLe: '2026-07-19',
  },
];

const cloneSeedFormules = () => SEED_FORMULES.map((f) => ({ ...f }));

let nextFormuleId = 4;
let formules = cloneSeedFormules();

let nextAbonnementId = 1;
let abonnements = [];

let nextConsommationId = 1;
let consommations = [];

// --- Helpers internes ---

const findFormule = (id) => formules.find((f) => f.id === Number(id));

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

// Le statut stocké ne connaît que ACTIF (baseline) et les états manuels
// (SUSPENDU, RESILIE). EXPIRE et EPUISE sont calculés à la lecture (§11 du
// plan) : un abonnement ACTIF dont la date est dépassée ou le solde à zéro
// est affiché comme tel sans qu'on ait besoin d'une tâche planifiée.
const deriveStatut = (abo) => {
  if (abo.statutManuel === 'SUSPENDU' || abo.statutManuel === 'RESILIE') {
    return abo.statutManuel;
  }
  if (today() > abo.dateExpiration) return 'EXPIRE';
  if (abo.formule.type !== 'ILLIMITE' && abo.voyagesRestants <= 0) return 'EPUISE';
  return 'ACTIF';
};

const serializeAbonnement = (abo) => ({
  id: abo.id,
  utilisateurId: abo.utilisateurId,
  formule: { id: abo.formule.id, nom: abo.formule.nom, type: abo.formule.type },
  dateDebut: abo.dateDebut,
  dateExpiration: abo.dateExpiration,
  voyagesAutorises: abo.formule.type === 'ILLIMITE' ? null : abo.voyagesAutorises,
  voyagesConsommes: abo.voyagesConsommes,
  voyagesRestants: abo.formule.type === 'ILLIMITE' ? null : abo.voyagesRestants,
  statut: deriveStatut(abo),
  creeLe: abo.creeLe,
});

// --- 4.1 Formules ---

export async function createFormule({ nom, description, type, tarif, dureeValiditeJours, nombreVoyages }) {
  if (!nom || !type || tarif == null || dureeValiditeJours == null) {
    throw new ApiAbonnementsError('Champs obligatoires manquants (nom, type, tarif, dureeValiditeJours)', 400);
  }
  if (!['TICKET_SIMPLE', 'LIMITE', 'ILLIMITE'].includes(type)) {
    throw new ApiAbonnementsError('Type de formule invalide', 400);
  }
  const formule = {
    id: nextFormuleId++,
    nom,
    description: description || '',
    type,
    tarif,
    dureeValiditeJours,
    nombreVoyages: type === 'TICKET_SIMPLE' ? 1 : type === 'ILLIMITE' ? null : nombreVoyages,
    actif: true,
    creeLe: today(),
  };
  formules.push(formule);
  return delay({ formule });
}

export async function getFormules({ type, actif } = {}) {
  let result = formules;
  if (type) result = result.filter((f) => f.type === type);
  if (actif !== undefined) {
    const actifBool = actif === true || actif === 'true';
    result = result.filter((f) => f.actif === actifBool);
  }
  return delay(result);
}

export async function getFormuleById(id) {
  const formule = findFormule(id);
  if (!formule) throw new ApiAbonnementsError('Formule introuvable', 404);
  return delay({ formule });
}

export async function updateFormule(id, { nom, description, tarif, dureeValiditeJours, nombreVoyages }) {
  const formule = findFormule(id);
  if (!formule) throw new ApiAbonnementsError('Formule introuvable', 404);
  if (nom !== undefined) formule.nom = nom;
  if (description !== undefined) formule.description = description;
  if (tarif !== undefined) formule.tarif = tarif;
  if (dureeValiditeJours !== undefined) formule.dureeValiditeJours = dureeValiditeJours;
  if (nombreVoyages !== undefined && formule.type === 'LIMITE') formule.nombreVoyages = nombreVoyages;
  return delay({ formule });
}

export async function setFormuleActive(id, actif) {
  const formule = findFormule(id);
  if (!formule) throw new ApiAbonnementsError('Formule introuvable', 404);
  formule.actif = Boolean(actif);
  return delay({ formule });
}

// --- 4.2 Souscriptions ---

export async function createSouscription({ utilisateurId, formuleId, dateDebut }) {
  if (!utilisateurId || !formuleId || !dateDebut) {
    throw new ApiAbonnementsError('Champs obligatoires manquants (utilisateurId, formuleId, dateDebut)', 400);
  }
  const formule = findFormule(formuleId);
  if (!formule || !formule.actif) {
    throw new ApiAbonnementsError('Formule introuvable ou inactive', 404);
  }

  const abo = {
    id: nextAbonnementId++,
    utilisateurId,
    formule,
    dateDebut,
    dateExpiration: addDays(dateDebut, formule.dureeValiditeJours),
    voyagesAutorises: formule.nombreVoyages,
    voyagesConsommes: 0,
    voyagesRestants: formule.nombreVoyages,
    statutManuel: null,
    creeLe: today(),
  };
  abonnements.push(abo);
  return delay({ abonnement: serializeAbonnement(abo) });
}

export async function getSouscriptions({ utilisateurId, statut, type, recherche } = {}) {
  let result = abonnements;
  if (utilisateurId) result = result.filter((a) => a.utilisateurId === utilisateurId);
  if (type) result = result.filter((a) => a.formule.type === type);
  if (recherche) {
    const q = recherche.toLowerCase();
    result = result.filter((a) => a.utilisateurId.toLowerCase().includes(q));
  }
  let serialized = result.map(serializeAbonnement);
  if (statut) serialized = serialized.filter((a) => a.statut === statut);
  return delay(serialized);
}

const findAbonnement = (id) => abonnements.find((a) => a.id === Number(id));

export async function getSouscriptionById(id) {
  const abo = findAbonnement(id);
  if (!abo) throw new ApiAbonnementsError('Abonnement introuvable', 404);
  return delay({ abonnement: serializeAbonnement(abo) });
}

export async function setSouscriptionStatut(id, statut) {
  if (!['SUSPENDU', 'ACTIF', 'RESILIE'].includes(statut)) {
    throw new ApiAbonnementsError('Statut invalide', 400);
  }
  const abo = findAbonnement(id);
  if (!abo) throw new ApiAbonnementsError('Abonnement introuvable', 404);
  abo.statutManuel = statut === 'ACTIF' ? null : statut;
  return delay({ abonnement: serializeAbonnement(abo) });
}

export async function renouvelerSouscription(id, dateDebut) {
  const abo = findAbonnement(id);
  if (!abo) throw new ApiAbonnementsError('Abonnement introuvable', 404);
  abo.dateDebut = dateDebut;
  abo.dateExpiration = addDays(dateDebut, abo.formule.dureeValiditeJours);
  abo.voyagesConsommes = 0;
  abo.voyagesRestants = abo.formule.nombreVoyages;
  abo.statutManuel = null;
  return delay({ abonnement: serializeAbonnement(abo) });
}

// --- 4.3 Consommation et historique ---

export async function consommerVoyage(id, validationId) {
  const abo = findAbonnement(id);
  if (!abo) throw new ApiAbonnementsError('Abonnement introuvable', 404);

  const statut = deriveStatut(abo);
  if (statut === 'SUSPENDU') throw new ApiAbonnementsError('Abonnement suspendu', 409);
  if (statut === 'EXPIRE') throw new ApiAbonnementsError('Abonnement expiré', 409);
  if (statut === 'EPUISE') throw new ApiAbonnementsError('Solde de voyages épuisé', 409);
  if (statut === 'RESILIE') throw new ApiAbonnementsError('Abonnement résilié', 409);

  abo.voyagesConsommes += 1;
  if (abo.formule.type !== 'ILLIMITE') {
    abo.voyagesRestants -= 1;
  }

  const consommation = {
    id: nextConsommationId++,
    dateVoyage: today(),
    validationId,
  };
  consommations.push({ ...consommation, abonnementId: abo.id });

  return delay({ abonnement: serializeAbonnement(abo), consommation });
}

export async function getHistorique(id) {
  const abo = findAbonnement(id);
  if (!abo) throw new ApiAbonnementsError('Abonnement introuvable', 404);
  const historique = consommations
    .filter((c) => c.abonnementId === abo.id)
    .map(({ id: cid, dateVoyage, validationId }) => ({ id: cid, dateVoyage, validationId }));
  return delay(historique);
}

// --- 4.4 Vérification de validité ---

export async function verifierValidite(utilisateurId) {
  const candidats = abonnements
    .filter((a) => a.utilisateurId === utilisateurId)
    .map(serializeAbonnement)
    .filter((a) => a.statut === 'ACTIF');

  if (candidats.length === 0) {
    return delay({ valide: false, abonnement: null });
  }
  return delay({ valide: true, abonnement: candidats[0] });
}

// --- 4.5 Statistiques ---

export async function getStatsAbonnements() {
  const serialized = abonnements.map(serializeAbonnement);

  const parStatut = { ACTIF: 0, SUSPENDU: 0, EXPIRE: 0, EPUISE: 0, RESILIE: 0 };
  const parType = { TICKET_SIMPLE: 0, LIMITE: 0, ILLIMITE: 0 };
  let voyagesConsommesTotal = 0;
  let expirentSous7Jours = 0;
  let revenuTotal = 0;

  const dansSeptJours = addDays(today(), 7);

  for (const abo of serialized) {
    parStatut[abo.statut] = (parStatut[abo.statut] || 0) + 1;
    parType[abo.formule.type] = (parType[abo.formule.type] || 0) + 1;
    voyagesConsommesTotal += abo.voyagesConsommes;
    if (abo.statut === 'ACTIF' && abo.dateExpiration <= dansSeptJours) {
      expirentSous7Jours += 1;
    }
    const formule = findFormule(abo.formule.id);
    if (formule) revenuTotal += formule.tarif;
  }

  return delay({
    stats: {
      total: serialized.length,
      parStatut,
      parType,
      voyagesConsommesTotal,
      expirentSous7Jours,
      revenuTotal,
    },
  });
}

// Réservé aux tests : remet les données simulées à leur état initial.
export function __resetSimulation() {
  formules = cloneSeedFormules();
  nextFormuleId = 4;
  abonnements = [];
  nextAbonnementId = 1;
  consommations = [];
  nextConsommationId = 1;
}
