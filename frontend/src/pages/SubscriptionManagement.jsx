import React, { useState, useEffect } from 'react';
import CreatePlanModal from '../components/CreatePlanModal';
import './UserManagement.css'; // Reuses table/modal skeleton structures
import './SubscriptionManagement.css'; // Plan grids specific styling

const API_BASE_URL = 'http://localhost:5050/api/subscriptions';

const FALLBACK_PLANS = [
  { id: 'PLN-001', name: 'Ticket Simple', type: 'simple', price: 500, durationDays: 1, tripsLimit: 1, description: "Ticket valide pour un voyage unique sur le réseau de transport.", active: true },
  { id: 'PLN-002', name: 'Pass Mensuel Étudiant', type: 'limited', price: 7500, durationDays: 30, tripsLimit: 40, description: "Tarif réduit pour étudiants de moins de 26 ans.", active: true },
  { id: 'PLN-003', name: 'Pass Mensuel Illimité', type: 'unlimited', price: 25000, durationDays: 30, tripsLimit: null, description: "Voyages illimités sur l'ensemble des bus et navettes.", active: true }
];

const FALLBACK_CONTRACTS = [
  { id: 'SUB-001', clientName: 'Ibrahima Ndiaye', clientEmail: 'ibrahima.ndiaye@email.com', planName: 'Pass Mensuel Étudiant', dateDebut: '2026-06-15', dateFin: '2026-07-15', tripsLeft: 34, status: 'Actif' },
  { id: 'SUB-002', clientName: 'Awa Fall', clientEmail: 'awa.fall@email.com', planName: 'Pass Mensuel Illimité', dateDebut: '2026-06-01', dateFin: '2026-07-01', tripsLeft: 'Illimité', status: 'Expiré' }
];

function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters for contracts
  const [searchContract, setSearchContract] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');

  // SEO Updates
  useEffect(() => {
    document.title = "Gestion des Abonnements - Système de Billetterie";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = "Configurer les formules d'abonnements de transport et suivre les souscriptions des clients.";
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/plans`),
        fetch(`${API_BASE_URL}/contracts`)
      ]);

      if (plansRes.ok && contractsRes.ok) {
        const plansData = await plansRes.json();
        const contractsData = await contractsRes.json();
        setPlans(plansData);
        setContracts(contractsData);
        setIsOffline(false);
      } else {
        throw new Error("Erreur de récupération serveur");
      }
    } catch (err) {
      console.warn("API Abonnements non détectée. Passage en mode démo local.");
      setIsOffline(true);
      if (plans.length === 0) setPlans(FALLBACK_PLANS);
      if (contracts.length === 0) setContracts(FALLBACK_CONTRACTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Revenue and Subscription metrics
  const activeContracts = contracts.filter(c => c.status === 'Actif');
  const revenueTotal = contracts.reduce((acc, current) => {
    // Sum prices - lookup plan price from fallback or api
    const matchedPlan = plans.find(p => p.name === current.planName);
    return acc + (matchedPlan ? matchedPlan.price : 0);
  }, 0);

  // Filtered contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.clientName.toLowerCase().includes(searchContract.toLowerCase()) ||
      contract.clientEmail.toLowerCase().includes(searchContract.toLowerCase()) ||
      contract.planName.toLowerCase().includes(searchContract.toLowerCase());
    const matchesStatus = statusFilter === 'Tous' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action: Create subscription plan
  const handleCreatePlan = async (newPlanData) => {
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlanData)
        });
        if (response.ok) {
          fetchData();
          setIsCreateModalOpen(false);
          return;
        }
      } catch (err) {
        console.error("Échec de création du plan sur l'API, repli local.", err);
      }
    }

    // Local Fallback
    const localNewPlan = {
      id: `PLN-0${plans.length + 1}`,
      name: newPlanData.name,
      type: newPlanData.type,
      price: newPlanData.price,
      durationDays: newPlanData.durationDays,
      tripsLimit: newPlanData.tripsLimit,
      description: newPlanData.description,
      active: true
    };
    setPlans([...plans, localNewPlan]);
    setIsCreateModalOpen(false);
  };

  // Action: Toggle plan active status
  const handleTogglePlanActive = async (id, currentActive) => {
    const nextActive = !currentActive;
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/plans/${id}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: nextActive })
        });
        if (response.ok) {
          fetchData();
          return;
        }
      } catch (err) {
        console.error("Échec de mise à jour du plan sur l'API, repli local.", err);
      }
    }

    setPlans(plans.map(p => p.id === id ? { ...p, active: nextActive } : p));
  };

  // Action: Suspend contract
  const handleToggleContractStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Actif' ? 'Suspendu' : 'Actif';
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/contracts/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (response.ok) {
          fetchData();
          return;
        }
      } catch (err) {
        console.error("Échec de mise à jour de la souscription, repli local.", err);
      }
    }

    setContracts(contracts.map(c => c.id === id ? { ...c, status: nextStatus } : c));
  };

  return (
    <div className="sub-container dashboard-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="material-symbols-outlined nav-brand-icon">
            local_activity
          </span>
          <span className="nav-brand-text">Billetterie Intelligente</span>
        </div>
        <div className="nav-user">
          <div className="nav-user-avatar">A</div>
          <span className="nav-user-name">Administrateur</span>
        </div>
      </header>

      <main className="sub-main main-content">
        {/* Offline Warning Notice */}
        {isOffline && (
          <div className="offline-notice">
            <span className="material-symbols-outlined offline-icon">cloud_off</span>
            <div>
              <div className="offline-title">Mode Démo Local Actif</div>
              <div className="offline-text">Le serveur API backend ({API_BASE_URL}) n'est pas actif. Modulations faites en mémoire locale.</div>
            </div>
          </div>
        )}

        {/* Page title and actions */}
        <section className="page-header">
          <div>
            <h1 className="page-title">Offres & Abonnements</h1>
            <p className="page-subtitle">Créer des formules tarifaires et suivre les souscriptions actives.</p>
          </div>
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <span className="material-symbols-outlined btn-icon">add_circle</span>
            Créer une formule
          </button>
        </section>

        {/* Stats segment */}
        <section className="stats-grid">
          <div className="stats-card highlighted">
            <h3 className="stats-card-title">Souscriptions Actives</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{activeContracts.length}</span>
                <span className="metric-label">Contrats en cours</span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title">Chiffre d'Affaire</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#166534' }}>
                  {revenueTotal.toLocaleString()} F
                </span>
                <span className="metric-label">Ventes globales</span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title">Catalogue</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{plans.length}</span>
                <span className="metric-label">Offres configurées</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLANS GRID SECTION */}
        <section className="plans-section">
          <h2 className="section-title">
            <span className="material-symbols-outlined">card_membership</span>
            Catalogue de Tarifs
          </h2>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.id} className="plan-card" style={{ opacity: plan.active ? 1 : 0.65 }}>
                <div>
                  <div className="plan-header">
                    <span className={`plan-badge ${plan.type}`}>
                      {plan.type === 'simple' ? 'Ticket' : plan.type === 'limited' ? 'Voyages limités' : 'Illimité'}
                    </span>
                    <span className="material-symbols-outlined" style={{ color: plan.active ? '#10b981' : '#94a3b8' }}>
                      {plan.active ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </div>
                  <h3 className="plan-title">{plan.name}</h3>
                  <div className="plan-price-row">
                    <span className="plan-price">{plan.price}</span>
                    <span className="plan-price-currency">XOF</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  
                  <ul className="plan-features">
                    <li className="plan-feature-item">
                      <span className="material-symbols-outlined plan-feature-icon">schedule</span>
                      <span>Validité : {plan.durationDays} jour(s)</span>
                    </li>
                    <li className="plan-feature-item">
                      <span className="material-symbols-outlined plan-feature-icon">directions_bus</span>
                      <span>
                        {plan.tripsLimit ? `${plan.tripsLimit} trajets inclus` : 'Trajets illimités'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="plan-actions">
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                    onClick={() => handleTogglePlanActive(plan.id, plan.active)}
                  >
                    {plan.active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTRACTS TABLE LIST */}
        <section className="contracts-section">
          <div className="contracts-header-row">
            <h2 className="section-title">
              <span className="material-symbols-outlined">group</span>
              Souscriptions Clients
            </h2>
            <div className="filter-dropdowns">
              <input
                type="text"
                placeholder="Rechercher client, offre..."
                value={searchContract}
                onChange={(e) => setSearchContract(e.target.value)}
                className="search-input"
                style={{ maxWidth: '240px' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Actif">Actifs</option>
                <option value="Expiré">Expirés</option>
                <option value="Suspendu">Suspendus</option>
              </select>
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="user-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-th">Client</th>
                    <th className="table-header-th">Formule souscrite</th>
                    <th className="table-header-th">Date de début</th>
                    <th className="table-header-th">Date d'expiration</th>
                    <th className="table-header-th">Trajets restants</th>
                    <th className="table-header-th">Statut</th>
                    <th className="table-header-th-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract) => (
                      <tr key={contract.id} className="table-row">
                        <td className="table-td-user">
                          <div className="user-name-text">{contract.clientName}</div>
                          <div className="user-email-text">{contract.clientEmail}</div>
                        </td>
                        <td className="table-td" style={{ fontWeight: 600, color: '#1e3a8a' }}>
                          {contract.planName}
                        </td>
                        <td className="table-td">{contract.dateDebut}</td>
                        <td className="table-td">{contract.dateFin}</td>
                        <td className="table-td" style={{ fontWeight: 600 }}>
                          {contract.tripsLeft}
                        </td>
                        <td className="table-td">
                          <span className={`contract-status-badge ${contract.status.toLowerCase()}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="table-td-action">
                          {contract.status !== 'Expiré' && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => handleToggleContractStatus(contract.id, contract.status)}
                            >
                              {contract.status === 'Actif' ? 'Suspendre' : 'Réactiver'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="table-empty-cell">
                        Aucun abonnement trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* CREATE PLAN MODAL */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlan}
      />
    </div>
  );
}

export default SubscriptionManagement;
