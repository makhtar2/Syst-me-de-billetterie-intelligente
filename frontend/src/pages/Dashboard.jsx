import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getStatsAbonnements } from '../services/apiAbonnements';
import { getStatsBilletterie, getAudits } from '../services/apiBilletterie';
import { motifLabel } from '../utils/motifsRefus';
import { formatDateTimeFR } from '../utils/dates';

const STATUT_ABO_LABELS = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  EXPIRE: 'Expiré',
  EPUISE: 'Épuisé',
  RESILIE: 'Résilié',
};

const STATUT_ABO_COLORS = {
  ACTIF: '#10b981',
  SUSPENDU: '#f59e0b',
  EXPIRE: '#64748b',
  EPUISE: '#ef4444',
  RESILIE: '#94a3b8',
};

const TITRE_STATUT_LABELS = { ACTIF: 'Actif', DESACTIVE: 'Désactivé', CONSOMME: 'Consommé', EXPIRE: 'Expiré' };
const TITRE_STATUT_COLORS = { ACTIF: '#10b981', DESACTIVE: '#ef4444', CONSOMME: '#64748b', EXPIRE: '#f59e0b' };

const TYPE_ROWS = [
  { key: 'TICKET_SIMPLE', label: 'Tickets simples', color: '#3b82f6' },
  { key: 'LIMITE', label: 'Abonnements limités', color: '#8b5cf6' },
  { key: 'ILLIMITE', label: 'Abonnements illimités', color: '#10b981' },
];

const AUDIT_ACTION_LABELS = {
  GENERATION_TITRE: 'Titre généré',
  DESACTIVATION_TITRE: 'Titre désactivé',
  ACTIVATION_TITRE: 'Titre réactivé',
  SCAN_VALIDATION: 'Scan de validation',
  VALIDATION_MANUELLE: 'Validation manuelle',
};

const AUDIT_ACTION_ICONS = {
  GENERATION_TITRE: 'confirmation_number',
  DESACTIVATION_TITRE: 'block',
  ACTIVATION_TITRE: 'restart_alt',
  SCAN_VALIDATION: 'qr_code_scanner',
  VALIDATION_MANUELLE: 'edit_note',
};

// Seuil en dessous duquel le taux d'autorisation mérite une alerte : un
// contrôle qui refuse plus d'un scan sur dix signale un souci (titres mal
// renouvelés, fraude en hausse, ou bug de lecture QR).
const SEUIL_TAUX_AUTORISATION = 90;

function Dashboard() {
  const navigate = useNavigate();
  const [statsUsers, setStatsUsers] = useState(null);
  const [statsAbo, setStatsAbo] = useState(null);
  const [statsBillet, setStatsBillet] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [auteurs, setAuteurs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(() => {
    setIsLoading(true);
    return Promise.allSettled([api.getStats(), getStatsAbonnements(), getStatsBilletterie(), getAudits()])
      .then(([users, abo, billet, audits]) => {
        if (users.status === 'fulfilled') setStatsUsers(users.value.stats);
        if (abo.status === 'fulfilled') setStatsAbo(abo.value.stats);
        if (billet.status === 'fulfilled') setStatsBillet(billet.value.stats);
        if (audits.status === 'fulfilled') {
          const derniers = (Array.isArray(audits.value) ? audits.value : []).slice(0, 6);
          setRecentAudits(derniers);
          const ids = [...new Set(derniers.map((a) => a.utilisateurId).filter(Boolean))];
          if (ids.length > 0) {
            api.lookupUsers(ids)
              .then((res) => {
                const map = {};
                (res.users || []).forEach((u) => { map[u.id] = u; });
                setAuteurs(map);
              })
              .catch(() => {});
          }
        }
        setLastUpdated(new Date());
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Tableau de bord - Système de Billetterie';
    loadAll();
  }, [loadAll]);

  if (isLoading && !statsUsers && !statsAbo && !statsBillet) {
    return (
      <main className="main-content">
        <div className="loader-container">
          <span className="page-loader"></span>
          <p className="loader-text">Chargement des statistiques...</p>
        </div>
      </main>
    );
  }

  if (!statsUsers && !statsAbo && !statsBillet) {
    return (
      <main className="main-content">
        <div className="offline-notice">
          <span className="material-symbols-outlined offline-icon">cloud_off</span>
          <div>
            <div className="offline-title">Statistiques indisponibles</div>
            <div className="offline-text">Impossible de contacter les services pour récupérer les statistiques.</div>
          </div>
        </div>
      </main>
    );
  }

  // --- Construction des alertes : chaque indicateur brut est traduit en
  // décision concrète ("quoi faire, où aller"), pas juste affiché.
  const alerts = [];
  if (statsAbo?.expirentSous7Jours > 0) {
    alerts.push({
      level: 'warning',
      icon: 'schedule',
      text: `${statsAbo.expirentSous7Jours} abonnement${statsAbo.expirentSous7Jours > 1 ? 's' : ''} expire${statsAbo.expirentSous7Jours > 1 ? 'nt' : ''} sous 7 jours`,
      hint: 'À relancer avant la coupure de service',
      to: '/abonnements',
    });
  }
  if (statsAbo?.parStatut?.EPUISE > 0) {
    alerts.push({
      level: 'warning',
      icon: 'battery_alert',
      text: `${statsAbo.parStatut.EPUISE} abonnement${statsAbo.parStatut.EPUISE > 1 ? 's' : ''} épuisé${statsAbo.parStatut.EPUISE > 1 ? 's' : ''}`,
      hint: 'Voyages consommés : proposer un renouvellement',
      to: '/abonnements',
    });
  }
  if (statsUsers?.byStatus?.Bloqué > 0) {
    alerts.push({
      level: 'danger',
      icon: 'person_off',
      text: `${statsUsers.byStatus.Bloqué} compte${statsUsers.byStatus.Bloqué > 1 ? 's' : ''} bloqué${statsUsers.byStatus.Bloqué > 1 ? 's' : ''}`,
      hint: 'Vérifier le motif de blocage',
      to: '/users',
    });
  }
  if (statsBillet && statsBillet.totalValidations > 0 && statsBillet.tauxSucces < SEUIL_TAUX_AUTORISATION) {
    alerts.push({
      level: 'danger',
      icon: 'trending_down',
      text: `Taux d'autorisation à ${statsBillet.tauxSucces}%`,
      hint: `Sous le seuil de ${SEUIL_TAUX_AUTORISATION}% attendu au contrôle`,
      to: '/billetterie-stats',
    });
  }
  if (statsBillet?.titresParStatut?.EXPIRE > 0) {
    alerts.push({
      level: 'warning',
      icon: 'event_busy',
      text: `${statsBillet.titresParStatut.EXPIRE} titre${statsBillet.titresParStatut.EXPIRE > 1 ? 's' : ''} expiré${statsBillet.titresParStatut.EXPIRE > 1 ? 's' : ''}`,
      hint: 'Encore dans le catalogue client : à nettoyer ou renouveler',
      to: '/titres',
    });
  }

  const topFormules = (statsAbo?.parFormule || []).slice(0, 5);
  const revenuMax = topFormules.length > 0 ? topFormules[0].revenu : 0;
  const maxHoraire = Math.max(...Object.values(statsBillet?.validationsParHeure || { 0: 0 }), 1);

  return (
    <main className="main-content">
      <section className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">
            Vue d'ensemble des comptes, abonnements et de la billetterie
            {lastUpdated && ` · Actualisé à ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <div className="action-button-group">
          <button type="button" className="icon-btn dash-refresh-btn" onClick={loadAll} title="Actualiser" aria-label="Actualiser">
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate('/users')}>
            <span className="material-symbols-outlined btn-icon">person_add</span>
            Ajouter un utilisateur
          </button>
          <button className="btn-secondary" onClick={() => navigate('/formules')}>
            <span className="material-symbols-outlined btn-icon">add</span>
            Créer une formule
          </button>
          <button className="btn-primary" onClick={() => navigate('/abonnements')}>
            <span className="material-symbols-outlined btn-icon">card_membership</span>
            Nouvelle souscription
          </button>
        </div>
      </section>

      {/* Alertes exploitables : ce qui mérite une action aujourd'hui */}
      <section className="table-card dash-alerts-card">
        <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>À surveiller</h3>
        {alerts.length === 0 ? (
          <div className="dash-alert dash-alert--ok">
            <span className="material-symbols-outlined dash-alert-icon">task_alt</span>
            <div>
              <div className="dash-alert-text">Tout est sous contrôle</div>
              <div className="dash-alert-hint">Aucune anomalie détectée sur les comptes, abonnements ou la billetterie.</div>
            </div>
          </div>
        ) : (
          <div className="dash-alerts">
            {alerts.map((a, i) => (
              <Link key={i} to={a.to} className={`dash-alert dash-alert--${a.level}`}>
                <span className="material-symbols-outlined dash-alert-icon">{a.icon}</span>
                <div>
                  <div className="dash-alert-text">{a.text}</div>
                  <div className="dash-alert-hint">{a.hint}</div>
                </div>
                <span className="material-symbols-outlined dash-alert-chevron">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* KPIs transversaux */}
      <section className="stats-grid">
        <Link to="/users" className="stats-card stats-card-link">
          <div className="stats-card-header">
            <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              group
            </span>
            <h3 className="stats-card-title">Comptes utilisateurs</h3>
          </div>
          <span className="metric-value">{statsUsers?.byStatus?.Actif ?? '—'}</span>
          <div className="metric-detail">{statsUsers?.total ?? 0} au total</div>
        </Link>

        <Link to="/abonnements" className="stats-card stats-card-link">
          <div className="stats-card-header">
            <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#059669' }}>
              card_membership
            </span>
            <h3 className="stats-card-title">Abonnements actifs</h3>
          </div>
          <span className="metric-value">{statsAbo?.parStatut?.ACTIF ?? '—'}</span>
          <div className="metric-detail">{statsAbo?.total ?? 0} au total</div>
        </Link>

        <Link to="/titres" className="stats-card stats-card-link">
          <div className="stats-card-header">
            <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
              confirmation_number
            </span>
            <h3 className="stats-card-title">Titres émis</h3>
          </div>
          <span className="metric-value">{statsBillet?.totalTitres ?? '—'}</span>
          <div className="metric-detail">{statsBillet?.titresParStatut?.ACTIF ?? 0} actif(s)</div>
        </Link>

        <Link to="/billetterie-stats" className="stats-card stats-card-link">
          <div className="stats-card-header">
            <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
              qr_code_scanner
            </span>
            <h3 className="stats-card-title">Taux d'autorisation</h3>
          </div>
          <span className="metric-value">{statsBillet ? `${statsBillet.tauxSucces}%` : '—'}</span>
          <div className="metric-detail">{statsBillet?.totalValidations ?? 0} scans au total</div>
        </Link>
      </section>

      <section className="stats-grid">
        {statsAbo && (
          <div className="stats-card">
            <div className="stats-card-header">
              <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#059669' }}>
                payments
              </span>
              <h3 className="stats-card-title">Revenu total</h3>
            </div>
            <span className="metric-value">{statsAbo.revenuTotal.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}

        {statsAbo && (
          <div className="stats-card">
            <div className="stats-card-header">
              <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                directions_bus
              </span>
              <h3 className="stats-card-title">Voyages consommés</h3>
            </div>
            <span className="metric-value">{statsAbo.voyagesConsommesTotal}</span>
          </div>
        )}

        {statsBillet && (
          <Link to="/validations" className="stats-card stats-card-link">
            <div className="stats-card-header">
              <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                today
              </span>
              <h3 className="stats-card-title">Contrôles aujourd'hui</h3>
            </div>
            <span className="metric-value">{statsBillet.validationsAujourdhui}</span>
          </Link>
        )}

        {statsBillet && (
          <Link to="/validations" className="stats-card stats-card-link">
            <div className="stats-card-header">
              <span className="material-symbols-outlined stats-card-icon" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                block
              </span>
              <h3 className="stats-card-title">Voyages refusés</h3>
            </div>
            <span className="metric-value">{statsBillet.refuses}</span>
          </Link>
        )}
      </section>

      {/* Utilisateurs par rôle — composant partagé avec la gestion des comptes */}
      {statsUsers && (
        <section className="table-card">
          <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Comptes par rôle</h3>
          <div className="modal-grid">
            {Object.entries(statsUsers.byRole).map(([role, data]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-text" style={{ minWidth: '9rem' }}>
                  {role === 'Administrateur' ? 'Administrateurs' : role === 'Agent' ? 'Agents' : 'Clients'}
                </span>
                <div className="dash-role-bar">
                  <div
                    className="dash-role-bar-fill"
                    style={{ width: `${data.total > 0 ? (data.Actif / data.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="metric-value" style={{ fontSize: '1rem' }}>{data.total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top formules — revenu et volume de ventes par formule */}
      {topFormules.length > 0 && (
        <section className="table-card">
          <div className="dash-panel-header">
            <h3 className="stats-card-title">Formules les plus rentables</h3>
            <Link to="/formules" className="dash-panel-link">Voir toutes les formules</Link>
          </div>
          <div className="dash-rank-list">
            {topFormules.map((f, i) => (
              <div key={f.id} className="dash-rank-item">
                <span className="dash-rank-badge">{i + 1}</span>
                <div className="dash-rank-info">
                  <div className="dash-rank-label">
                    <span>{f.nom}</span>
                    <strong>{f.revenu.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div className="bts-progress-track">
                    <div
                      className="bts-progress-fill"
                      style={{ backgroundColor: '#4f46e5', width: `${revenuMax > 0 ? (f.revenu / revenuMax) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="dash-rank-meta">{f.ventes} vente{f.ventes > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {statsAbo && (
        <div className="bts-two-col-grid">
          <section className="table-card">
            <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Abonnements par statut</h3>
            <div className="bts-progress-list">
              {Object.entries(statsAbo.parStatut).map(([statut, count]) => (
                <div key={statut} className="bts-progress-row">
                  <div className="bts-progress-label">
                    <span>{STATUT_ABO_LABELS[statut] || statut}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="bts-progress-track">
                    <div
                      className="bts-progress-fill"
                      style={{ backgroundColor: STATUT_ABO_COLORS[statut], width: `${statsAbo.total > 0 ? (count / statsAbo.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="table-card">
            <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Abonnements par type</h3>
            <div className="bts-progress-list">
              {TYPE_ROWS.map(({ key, label, color }) => (
                <div key={key} className="bts-progress-row">
                  <div className="bts-progress-label">
                    <span>{label}</span>
                    <strong>{statsAbo.parType[key]}</strong>
                  </div>
                  <div className="bts-progress-track">
                    <div
                      className="bts-progress-fill"
                      style={{ backgroundColor: color, width: `${statsAbo.total > 0 ? (statsAbo.parType[key] / statsAbo.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {statsBillet && (
        <div className="bts-two-col-grid">
          <section className="table-card">
            <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Titres par statut</h3>
            <div className="modal-grid">
              {Object.entries(statsBillet.titresParStatut).map(([statut, count]) => (
                <div key={statut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="status-dot" style={{ backgroundColor: TITRE_STATUT_COLORS[statut] }}></span>
                  <span className="status-text">{TITRE_STATUT_LABELS[statut] || statut}</span>
                  <span className="metric-value" style={{ fontSize: '1rem', marginLeft: 'auto' }}>{count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="table-card">
            <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Motifs de refus</h3>
            {Object.keys(statsBillet.refusParMotif).length === 0 ? (
              <p className="bts-empty-hint">Aucun voyage refusé à ce jour.</p>
            ) : (
              <div className="modal-grid">
                {Object.entries(statsBillet.refusParMotif).map(([motif, count]) => (
                  <div key={motif} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="status-text">{motifLabel(motif)}</span>
                    <span className="metric-value" style={{ fontSize: '1rem', marginLeft: 'auto' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <div className="bts-two-col-grid">
        {/* Affluence horaire — identifie les heures de pointe pour répartir les agents */}
        {statsBillet && (
          <section className="table-card">
            <h3 className="stats-card-title" style={{ marginBottom: '1rem' }}>Affluence par heure (aujourd'hui)</h3>
            <div className="bts-hourly-chart">
              {Object.entries(statsBillet.validationsParHeure).map(([heure, count]) => {
                const pct = Math.max((count / maxHoraire) * 100, count > 0 ? 8 : 2);
                return (
                  <div key={heure} className="bts-hourly-col">
                    <div
                      className={`bts-hourly-bar${count > 0 ? ' active' : ''}`}
                      title={`${heure}h : ${count} validation(s)`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="bts-hourly-label">
                      {parseInt(heure, 10) % 3 === 0 ? `${heure}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Activité récente — dernières actions sensibles enregistrées */}
        <section className="table-card">
          <div className="dash-panel-header">
            <h3 className="stats-card-title">Activité récente</h3>
            <Link to="/audit" className="dash-panel-link">Voir la piste d'audit</Link>
          </div>
          {recentAudits.length === 0 ? (
            <p className="bts-empty-hint">Aucune action récente.</p>
          ) : (
            <div className="dash-activity-list">
              {recentAudits.map((a) => {
                const auteur = auteurs[a.utilisateurId];
                return (
                  <div key={a.id} className="dash-activity-item">
                    <span className="material-symbols-outlined dash-activity-icon">
                      {AUDIT_ACTION_ICONS[a.action] || 'history'}
                    </span>
                    <div className="dash-activity-body">
                      <div className="dash-activity-title">
                        {AUDIT_ACTION_LABELS[a.action] || a.action}
                        <span
                          className="dash-activity-dot"
                          style={{ backgroundColor: a.resultat === 'SUCCES' ? '#10b981' : '#ef4444' }}
                          title={a.resultat}
                        />
                      </div>
                      <div className="dash-activity-meta">
                        {auteur ? `${auteur.prenom} ${auteur.nom}` : a.role} · {formatDateTimeFR(a.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
