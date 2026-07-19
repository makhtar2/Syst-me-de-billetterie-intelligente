import {
  createFormule,
  getFormules,
  updateFormule,
  setFormuleActive,
  createSouscription,
  getSouscriptions,
  setSouscriptionStatut,
  renouvelerSouscription,
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

  test('refuse un tarif négatif', async () => {
    await expect(
      createFormule({ nom: 'X', type: 'ILLIMITE', tarif: -1, dureeValiditeJours: 1 })
    ).rejects.toThrow(/tarif/i);
  });

  test('refuse une durée de validité nulle', async () => {
    await expect(
      createFormule({ nom: 'X', type: 'ILLIMITE', tarif: 100, dureeValiditeJours: 0 })
    ).rejects.toThrow(/dur[ée]e/i);
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

describe('setFormuleActive', () => {
  test('refuse une valeur non booléenne', async () => {
    await expect(setFormuleActive(1, 'oui')).rejects.toMatchObject({ status: 400 });
  });
});

describe('updateFormule', () => {
  test('autorise tout tant que personne n\'a souscrit', async () => {
    const { formule } = await updateFormule(2, { tarif: 18000, nombreVoyages: 25 });
    expect(formule.tarif).toBe(18000);
    expect(formule.nombreVoyages).toBe(25);
  });

  test('fige le tarif, la durée et le nombre de voyages dès la première souscription', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });

    await expect(updateFormule(2, { tarif: 20000 })).rejects.toMatchObject({ status: 409 });
    await expect(updateFormule(2, { dureeValiditeJours: 60 })).rejects.toMatchObject({ status: 409 });
    await expect(updateFormule(2, { nombreVoyages: 40 })).rejects.toMatchObject({ status: 409 });
  });

  test('laisse renommer une formule souscrite', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });
    const { formule } = await updateFormule(2, { nom: 'Nouveau nom' });
    expect(formule.nom).toBe('Nouveau nom');
  });

  test('accepte les mêmes valeurs sans les traiter comme une modification', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });
    const { formule } = await updateFormule(2, { nom: 'Renommée', tarif: 15000, dureeValiditeJours: 30, nombreVoyages: 20 });
    expect(formule.nom).toBe('Renommée');
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

  test('refuse une date de début mal formée', async () => {
    await expect(
      createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '19/07/2026' })
    ).rejects.toMatchObject({ status: 400 });
  });

  test('refuse une formule retirée du catalogue', async () => {
    await setFormuleActive(2, false);
    await expect(
      createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' })
    ).rejects.toMatchObject({ status: 409 });
  });

  describe('règle : un seul abonnement en cours', () => {
    test('refuse un second abonnement limité ou illimité', async () => {
      await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });

      await expect(
        createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' })
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        createSouscription({ utilisateurId: 'user-1', formuleId: 3, dateDebut: '2026-07-19' })
      ).rejects.toMatchObject({ status: 409 });
    });

    test('autorise plusieurs tickets simples même avec un abonnement en cours', async () => {
      await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });

      await expect(
        createSouscription({ utilisateurId: 'user-1', formuleId: 1, dateDebut: '2026-07-19' })
      ).resolves.toBeDefined();
      await expect(
        createSouscription({ utilisateurId: 'user-1', formuleId: 1, dateDebut: '2026-07-19' })
      ).resolves.toBeDefined();
    });

    test("n'empêche pas un autre client de souscrire", async () => {
      await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });
      await expect(
        createSouscription({ utilisateurId: 'user-2', formuleId: 2, dateDebut: '2026-07-19' })
      ).resolves.toBeDefined();
    });

    test('laisse souscrire à nouveau une fois le premier abonnement expiré', async () => {
      await createSouscription({ utilisateurId: 'user-1', formuleId: 1, dateDebut: '2020-01-01' }); // TICKET_SIMPLE, expiré
      await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2020-01-01' }); // LIMITE, expiré

      await expect(
        createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' })
      ).resolves.toBeDefined();
    });
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

  test('exige un identifiant de validation', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2,
      dateDebut: '2026-07-19',
    });
    await expect(consommerVoyage(abonnement.id, '')).rejects.toMatchObject({ status: 400 });
  });

  test('refuse un scan rejoué sans décompter deux fois', async () => {
    const { abonnement } = await createSouscription({
      utilisateurId: 'user-1',
      formuleId: 2,
      dateDebut: '2026-07-19',
    });
    await consommerVoyage(abonnement.id, 'SCAN-X');
    await expect(consommerVoyage(abonnement.id, 'SCAN-X')).rejects.toMatchObject({ status: 409 });

    const [releve] = await getSouscriptions({ utilisateurId: 'user-1' });
    expect(releve.voyagesConsommes).toBe(1);
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

describe('getSouscriptions', () => {
  test('refuse un filtre statut invalide', async () => {
    await expect(getSouscriptions({ statut: 'INCONNU' })).rejects.toMatchObject({ status: 400 });
  });

  test('refuse un expireSous non numérique', async () => {
    await expect(getSouscriptions({ expireSous: 'abc' })).rejects.toMatchObject({ status: 400 });
  });

  test('repère les abonnements actifs qui expirent bientôt', async () => {
    await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' }); // expire dans 30 jours
    const bientot = await getSouscriptions({ expireSous: 7 });
    expect(bientot).toHaveLength(0);
    const large = await getSouscriptions({ expireSous: 31 });
    expect(large).toHaveLength(1);
  });
});

describe('cycle de vie d\'un abonnement', () => {
  test('une résiliation est définitive', async () => {
    const { abonnement } = await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2026-07-19' });
    await setSouscriptionStatut(abonnement.id, 'RESILIE');

    await expect(setSouscriptionStatut(abonnement.id, 'ACTIF')).rejects.toMatchObject({ status: 409 });
    await expect(renouvelerSouscription(abonnement.id, '2026-07-19')).rejects.toMatchObject({ status: 409 });
  });

  test('un ticket simple ne se renouvelle pas', async () => {
    const { abonnement } = await createSouscription({ utilisateurId: 'user-1', formuleId: 1, dateDebut: '2026-07-19' });
    await expect(renouvelerSouscription(abonnement.id, '2026-07-19')).rejects.toMatchObject({ status: 409 });
  });

  test('renouveler repart d\'une période neuve', async () => {
    const { abonnement } = await createSouscription({ utilisateurId: 'user-1', formuleId: 2, dateDebut: '2020-01-01' });
    const { abonnement: renouvele } = await renouvelerSouscription(abonnement.id, '2026-07-19');
    expect(renouvele.statut).toBe('ACTIF');
    expect(renouvele.voyagesConsommes).toBe(0);
    expect(renouvele.dateExpiration).toBe('2026-08-18');
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
