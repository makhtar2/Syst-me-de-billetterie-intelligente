import React, { useState, useEffect } from 'react';
import { validateUserForm } from '../utils/validators';

// L'email n'est pas modifiable ici : PUT /api/admin/users/:id ne l'accepte pas côté back
// (identifiant de connexion figé après création).
function EditUserModal({ isOpen, user, onClose, onSave }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState('Client');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setPrenom(user.prenom || '');
      setTelephone(user.telephone || '');
      setRole(user.role || 'Client');
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validateUserForm({ nom, prenom, telephone }, { requireEmail: false });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSave(user.id, { nom, prenom, telephone, role });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Modifier l'utilisateur</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse email</label>
            <input type="email" value={user.email} className="form-input" disabled />
          </div>

          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                required
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="form-input"
                placeholder="+221771234567"
                pattern="^\+221\d{9}$"
                title="Format attendu : +221 suivi de 9 chiffres, ex. +221771234567"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value="Client">Client</option>
                <option value="Agent">Agent</option>
                <option value="Administrateur">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
