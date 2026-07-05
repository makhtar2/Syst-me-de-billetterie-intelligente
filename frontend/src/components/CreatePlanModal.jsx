import React, { useState } from 'react';

function CreatePlanModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('limited');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [tripsLimit, setTripsLimit] = useState('30');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !description || !durationDays) return;

    onCreate({
      name,
      type,
      price: parseFloat(price),
      description,
      durationDays: parseInt(durationDays),
      tripsLimit: type === 'limited' ? parseInt(tripsLimit) : null
    });

    // Reset fields
    setName('');
    setType('limited');
    setPrice('');
    setDescription('');
    setDurationDays('30');
    setTripsLimit('30');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Créer une formule d'abonnement</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Nom de la formule</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Ex: Pass Étudiant Mensuel"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type de formule</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="simple">Ticket Simple (1 Voyage)</option>
                <option value="limited">Abonnement Voyages Limités</option>
                <option value="unlimited">Abonnement Voyages Illimités</option>
              </select>
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Prix (XOF)</label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
                placeholder="Ex: 5000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Durée de validité (Jours)</label>
              <input
                type="number"
                min="1"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="form-input"
                placeholder="Ex: 30"
              />
            </div>
          </div>

          {type === 'limited' && (
            <div className="form-group">
              <label className="form-label">Nombre max de voyages</label>
              <input
                type="number"
                min="1"
                required
                value={tripsLimit}
                onChange={(e) => setTripsLimit(e.target.value)}
                className="form-input"
                placeholder="Ex: 30"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description commerciale</label>
            <textarea
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical' }}
              placeholder="Ex: Accès prioritaire au réseau urbain pour tous les étudiants de moins de 26 ans."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer la formule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePlanModal;
