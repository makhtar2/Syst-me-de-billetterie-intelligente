import React, { useState, useEffect } from 'react';
import CreatePlanModal from '../components/CreatePlanModal';
import './SubscriptionManagement.css';

const INITIAL_PLANS = [
  {
    id: 'PLAN-1',
    name: 'Pass Étudiant Mensuel',
    price: 5000,
    type: 'limited',
    durationDays: 30,
    tripsLimit: 50,
    description: 'Accès prioritaire au réseau urbain pour tous les étudiants sur présentation de justificatif.'
  },
  {
    id: 'PLAN-2',
    name: 'Pass Navette Classique',
    price: 15000,
    type: 'unlimited',
    durationDays: 30,
    tripsLimit: null,
    description: 'Déplacements illimités sur l\'ensemble des lignes de bus et tramways pour les professionnels.'
  },
  {
    id: 'PLAN-3',
    name: 'Ticket Unitaire',
    price: 500,
    type: 'simple',
    durationDays: 1,
    tripsLimit: 1,
    description: 'Valable pour un voyage unique sur le réseau avec correspondance autorisée dans l\'heure.'
  }
];

const INITIAL_CONTRACTS = [
  {
    id: 'SUB-1024',
    client: 'Moussa Sow',
    plan: 'Pass Navette Classique',
    purchaseDate: '2026-06-12',
    expiryDate: '2026-07-12',
    status: 'Actif'
  },
  {
    id: 'SUB-1025',
    client: 'Fatou Diop',
    plan: 'Pass Étudiant Mensuel',
    purchaseDate: '2026-05-01',
    expiryDate: '2026-05-31',
    status: 'Expiré'
  },
  {
    id: 'SUB-1026',
    client: 'Modou Ndiaye',
    plan: 'Pass Navette Classique',
    purchaseDate: '2026-07-01',
    expiryDate: '2026-08-01',
    status: 'Suspendu'
  }
];

function SubscriptionManagement() {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // SEO Updates
  useEffect(() => {
    document.title = "Gestion des Abonnements - Système de Billetterie";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = "Gérer les offres de transport public, tickets unitaires, abonnements et contrats clients.";
    }
  }, []);

  const handleCreatePlan = (planData) => {
    const newPlan = {
      id: `PLAN-${plans.length + 1}`,
      name: planData.name,
      price: planData.price,
      type: planData.type,
      durationDays: planData.durationDays,
      tripsLimit: planData.tripsLimit,
      description: planData.description
    };
    setPlans([...plans, newPlan]);
    setIsCreateModalOpen(false);
  };

  const handleDeletePlan = (id) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const handleToggleContractStatus = (id) => {
    setContracts(contracts.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Actif' ? 'Suspendu' : 'Actif';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Offres & Abonnements</h1>
          <p className="page-subtitle">Configurez le catalogue de tarifs et suivez les souscriptions actives.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Nouvelle formule
        </button>
      </div>

      {/* Catalog of Plans */}
      <section>
        <h2 className="section-title">
          <span className="material-symbols-outlined">sell</span>
          Catalogue Tarifaire Actuel
        </h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div>
                <div className="plan-header">
                  <span className={`plan-badge ${plan.type}`}>
                    {plan.type === 'simple' && 'Ticket'}
                    {plan.type === 'limited' && 'Limité'}
                    {plan.type === 'unlimited' && 'Illimité'}
                  </span>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="icon-btn" 
                    title="Supprimer la formule"
                    style={{ color: '#ef4444' }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <h3 className="plan-title">{plan.name}</h3>
                <div className="plan-price-row">
                  <span className="plan-price">{plan.price.toLocaleString()}</span>
                  <span className="plan-price-currency">FCFA</span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div>
                <ul className="plan-features">
                  <li className="plan-feature-item">
                    <span className="material-symbols-outlined plan-feature-icon">schedule</span>
                    Validité : {plan.durationDays} jour(s)
                  </li>
                  <li className="plan-feature-item">
                    <span className="material-symbols-outlined plan-feature-icon">
                      {plan.type === 'unlimited' ? 'all_inclusive' : 'local_activity'}
                    </span>
                    Voyages : {plan.type === 'unlimited' ? 'Illimités' : `${plan.tripsLimit || 1} trajet(s)`}
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Purchased Contracts Table */}
      <section className="contracts-section" style={{ marginTop: '2.5rem' }}>
        <h2 className="section-title">
          <span className="material-symbols-outlined">badge</span>
          Suivi des Souscriptions Clients (Simulé)
        </h2>
        
        <div className="table-card">
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-th">ID Contrat</th>
                  <th className="table-header-th">Client</th>
                  <th className="table-header-th">Formule Souscrite</th>
                  <th className="table-header-th">Date d'achat</th>
                  <th className="table-header-th">Fin de validité</th>
                  <th className="table-header-th">Statut</th>
                  <th className="table-header-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="table-row">
                    <td className="table-td-id">{contract.id}</td>
                    <td className="table-td" style={{ fontWeight: 700, color: '#1e1b4b' }}>
                      {contract.client}
                    </td>
                    <td className="table-td">{contract.plan}</td>
                    <td className="table-td table-td-date">{contract.purchaseDate}</td>
                    <td className="table-td table-td-date">{contract.expiryDate}</td>
                    <td className="table-td">
                      <span className={`contract-status-badge ${contract.status.toLowerCase()}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="table-td action-cell">
                      {contract.status !== 'Expiré' && (
                        <button 
                          onClick={() => handleToggleContractStatus(contract.id)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {contract.status === 'Actif' ? 'pause_circle' : 'play_circle'}
                          </span>
                          {contract.status === 'Actif' ? 'Suspendre' : 'Activer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Creation Modal */}
      <CreatePlanModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlan}
      />
    </div>
  );
}

export default SubscriptionManagement;
