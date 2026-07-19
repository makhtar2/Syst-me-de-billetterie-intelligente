import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSouscriptionById, getHistorique } from '../services/apiAbonnements';

const TYPE_LABELS = {
  TICKET_SIMPLE: 'Ticket simple',
  LIMITE: 'Limité',
  ILLIMITE: 'Illimité',
};

const STATUT_LABELS = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  EXPIRE: 'Expiré',
  EPUISE: 'Épuisé',
  RESILIE: 'Résilié',
};

const STATUT_COLORS = {
  ACTIF: '#10b981',
  SUSPENDU: '#f59e0b',
  EXPIRE: '#64748b',
  EPUISE: '#ef4444',
  RESILIE: '#94a3b8',
};

function AbonnementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abonnement, setAbonnement] = useState(null);
  const [client, setClient] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ abonnement: abo }, hist] = await Promise.all([
        getSouscriptionById(id),
        getHistorique(id),
      ]);
      setAbonnement(abo);
      setHistorique(hist);
      setError(null);

      try {
        const users = await api.getUsers({ role: 'Client' });
        setClient(users.find((u) => u.id === abo.utilisateurId) || null);
      } catch (err) {
        console.warn('Impossible de récupérer les informations du client', err);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Détail abonnement - Système de Billetterie";
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="loader-container">
          <span className="page-loader"></span>
          <p className="loader-text">Chargement de l'abonnement...</p>
        </div>
      </main>
    );
  }

  if (error || !abonnement) {
    return (
      <main className="main-content">
        <div className="offline-notice">
          <span className="material-symbols-outlined offline-icon">error</span>
          <div>
            <div className="offline-title">Abonnement introuvable</div>
            <div className="offline-text">{error || "Cet abonnement n'existe pas."}</div>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/abonnements')} style={{ marginTop: '1rem' }}>
          Retour à la liste
        </button>
      </main>
    );
  }

  return (
    <main className="main-content">
      <section className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate('/abonnements')}>
            <span className="material-symbols-outlined btn-icon">arrow_back</span>
            Retour
          </button>
          <h1 className="page-title" style={{ marginTop: '0.75rem' }}>
            {client ? `${client.prenom} ${client.nom}` : abonnement.utilisateurId}
          </h1>
          <p className="page-subtitle">{abonnement.formule.nom} — {TYPE_LABELS[abonnement.formule.type] || abonnement.formule.type}</p>
        </div>
      </section>

      <section className="table-card" style={{ padding: '1.5rem 2rem' }}>
        <div className="modal-grid">
          <div className="form-group">
            <label className="form-label">Statut</label>
            <div className="status-cell">
              <span className="status-dot" style={{ backgroundColor: STATUT_COLORS[abonnement.statut] }}></span>
              <span className="status-text">{STATUT_LABELS[abonnement.statut] || abonnement.statut}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Client</label>
            <div className="user-email-text">{client ? client.email : abonnement.utilisateurId}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Date de début</label>
            <div className="user-email-text">{abonnement.dateDebut}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Date d'expiration</label>
            <div className="user-email-text">{abonnement.dateExpiration}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Voyages</label>
            <div className="user-email-text">
              {abonnement.voyagesRestants === null
                ? `${abonnement.voyagesConsommes} voyage(s) consommé(s) (illimité)`
                : `${abonnement.voyagesConsommes} consommé(s) / ${abonnement.voyagesRestants} restant(s) sur ${abonnement.voyagesAutorises}`}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Créé le</label>
            <div className="user-email-text">{abonnement.creeLe}</div>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="user-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-th">Date du voyage</th>
                <th className="table-header-th">Référence de validation</th>
              </tr>
            </thead>
            <tbody>
              {historique.length > 0 ? (
                historique.map((h) => (
                  <tr key={h.id} className="table-row">
                    <td className="table-td">{h.dateVoyage}</td>
                    <td className="table-td-id">{h.validationId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="table-empty-cell">
                    Aucun voyage enregistré pour cet abonnement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AbonnementDetail;
