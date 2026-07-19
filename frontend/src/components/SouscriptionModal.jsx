import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getFormules } from '../services/apiAbonnements';
import { validateSouscriptionForm } from '../utils/validatorsAbonnements';

const EMPTY_FORM = { utilisateurId: '', formuleId: '', dateDebut: new Date().toISOString().slice(0, 10) };

// Souscrit un client actif a une formule active. Les deux listes viennent
// de deux services differents : les clients du Service Utilisateurs (Mongo),
// les formules du Service Abonnements (simule pour l'instant).
function SouscriptionModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [formules, setFormules] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setError(null);

    api.getUsers({ role: 'Client', status: 'Actif' })
      .then(setClients)
      .catch((err) => console.error('Impossible de récupérer les clients', err));

    getFormules({ actif: true })
      .then(setFormules)
      .catch((err) => console.error('Impossible de récupérer les formules', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validateSouscriptionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSave({ ...form, formuleId: Number(form.formuleId) });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Nouvelle souscription</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Client<span className="required-mark">*</span></label>
            <select
              value={form.utilisateurId}
              onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })}
              className="form-select"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom} ({client.email})
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="form-hint">
                Aucun client actif trouvé. Un client doit être créé puis activé avant de pouvoir
                souscrire — depuis <Link to="/users" onClick={onClose}>Gestion des Comptes</Link>.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Formule<span className="required-mark">*</span></label>
            <select
              value={form.formuleId}
              onChange={(e) => setForm({ ...form, formuleId: e.target.value })}
              className="form-select"
            >
              <option value="">Sélectionner une formule</option>
              {formules.map((formule) => (
                <option key={formule.id} value={formule.id}>
                  {formule.nom} — {formule.tarif.toLocaleString('fr-FR')} FCFA
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date de début<span className="required-mark">*</span></label>
            <input
              type="date"
              value={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Souscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SouscriptionModal;
