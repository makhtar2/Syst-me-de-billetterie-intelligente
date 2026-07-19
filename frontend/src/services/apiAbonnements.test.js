import {
  createFormule,
  getFormules,
  setFormuleActive,
  createSouscription,
  getSouscriptions,
  setSouscriptionStatut,
  consommerVoyage,
  getHistorique,
  verifierValidite,
  getStatsAbonnements,
  __resetSimulation,
} from './apiAbonnements';

beforeEach(() => {
  __resetSimulation();
});

describe('createFormule', () => {
  test('crée une formule valide', async () => {
    const { formule } = await createFormule({
      nom: 'Pass hebdo',
      type: 'LIMITE',
      tarif: 5000,
      dureeValiditeJours: 7,
      nombreVoyages: 10,
    });
    expect(formule.id).toBeDefined();
    expect(formule.actif).toBe(true);
  });

  test('refuse un champ obligatoire manquant', async () => {
    await expect(createFormule({ nom: 'Sans type' })).rejects.toThrow(/obligatoires/i);
  });

  test('refuse un type invalide', async () => {
    await expect(
      createFormule({ nom: 'X', type: 'INVALIDE', tarif: 100, dureeValiditeJours: 1 })
    ).rejects.toThrow(/type/i);
  });
});

describe('getFormules', () => {
  test('filtre par type', async () => {
    const result = await getFormules({ type: 'LIMITE' });
    expect(result.every((f) => f.type === 'LIMITE')).toBe(true);
  });

  test('filtre par actif', async () => {
    await setFormuleActive(1, false);
    const result = await getFormules({ actif: true });
    expect(result.find((f) => f.id === 1)).toBeUndefined();
  });
});

describe('createSouscription', () => {
  test('calcule la date d\'expiration et le solde initial', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2, // LIMITE, 20 voyages, 30 jours
      dateDebut: '2026-07-19',
    });
    expect(abonnement.dateExpiration).toBe('2026-08-18');
    expect(abonnement.voyagesAutorises).toBe(20);
    expect(abonnement.voyagesRestants).toBe(20);
    expect(abonnement.statut).toBe('ACTIF');
  });

  test('refuse une formule inexistante', async () => {
    await expect(
      createSouscription({ utilisateurId: 'user-1', formuleId: 999, dateDebut: '2026-07-19' })
    ).rejects.toThrow(/introuvable/i);
  });

  test("n'a pas de compteur pour un abonnement illimité", async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 3, // ILLIMITE
      dateDebut: '2026-07-19',
    });
    expect(abonnement.voyagesAutorises).toBeNull();
    expect(abonnement.voyagesRestants).toBeNull();
  });
});

describe('consommerVoyage', () => {
  test('décrémente le solde à chaque voyage', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2,
      dateDebut: '2026-07-19',
    });
    const { abonnement: apres } = await consommerVoyage(abonnement.id, 'VAL-1');
    expect(apres.voyagesConsommes).toBe(1);
    expect(apres.voyagesRestants).toBe(19);
  });

  test('passe à EPUISE quand le solde atteint zéro (LIMITE)', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 1, // TICKET_SIMPLE, 1 voyage
      dateDebut: '2026-07-19',
    });
    const { abonnement: apres } = await consommerVoyage(abonnement.id, 'VAL-1');
    expect(apres.voyagesRestants).toBe(0);
    expect(apres.statut).toBe('EPUISE');
  });

  test('refuse un voyage sur un abonnement épuisé (409)', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 1,
      dateDebut: '2026-07-19',
    });
    await consommerVoyage(abonnement.id, 'VAL-1');
    await expect(consommerVoyage(abonnement.id, 'VAL-2')).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/épuisé/i),
    });
  });

  test('refuse un voyage sur un abonnement expiré', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 1, // 1 jour de validité
      dateDebut: '2020-01-01',
    });
    await expect(consommerVoyage(abonnement.id, 'VAL-1')).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/expiré/i),
    });
  });

  test('refuse un voyage sur un abonnement suspendu', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2,
      dateDebut: '2026-07-19',
    });
    await setSouscriptionStatut(abonnement.id, 'SUSPENDU');
    await expect(consommerVoyage(abonnement.id, 'VAL-1')).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/suspendu/i),
    });
  });

  test('un abonnement illimité ne bloque jamais sur le compteur', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 3,
      dateDebut: '2026-07-19',
    });
    for (let i = 0; i < 5; i++) {
      await consommerVoyage(abonnement.id, `VAL-${i}`);
    }
    const [releve] = await getSouscriptions({ utilisateurId: 'user-1' });
    expect(releve.statut).toBe('ACTIF');
    expect(releve.voyagesConsommes).toBe(5);
    expect(releve.voyagesRestants).toBeNull();
  });

  test('conserve un historique consultable', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2,
      dateDebut: '2026-07-19',
    });
    await consommerVoyage(abonnement.id, 'VAL-1');
    await consommerVoyage(abonnement.id, 'VAL-2');
    const historique = await getHistorique(abonnement.id);
    expect(historique).toHaveLength(2);
    expect(historique[0].validationId).toBe('VAL-1');
  });
});

describe('verifierValidite', () => {
  test('valide=true si un abonnement actif existe', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });
    const result = await verifierValidite('user-1');
    expect(result.valide).toBe(true);
    expect(result.abonnement).not.toBeNull();
  });

  test("valide=false si l'utilisateur n'a aucun abonnement", async () => {
    const result = await verifierValidite('user-sans-abonnement');
    expect(result).toEqual({ valide: false, abonnement: null });
  });
});

describe('getStatsAbonnements', () => {
  test('agrège le total et la répartition par statut', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 1, dateDebut: '2026-07-19' });
    await createSouscription({ utilisateurId: 'user-2', formuleId: 2, dateDebut: '2026-07-19' });
    const { stats } = await getStatsAbonnements();
    expect(stats.total).toBe(2);
    expect(stats.parStatut.ACTIF).toBe(2);
    expect(stats.parType.TICKET_SIMPLE).toBe(1);
    expect(stats.parType.LIMITE).toBe(1);
  });
});
