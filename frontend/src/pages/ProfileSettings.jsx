import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setStoredUser, photoUrl } from '../services/api';
import { validateNewPassword } from '../utils/validators';
import './ProfileSettings.css';

function ProfileSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Formulaire informations personnelles
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [infoMessage, setInfoMessage] = useState(null);

  // Formulaire mot de passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [photoMessage, setPhotoMessage] = useState(null);

  useEffect(() => {
    document.title = 'Mon profil - Système de Billetterie';

    const load = async () => {
      try {
        const data = await api.getProfile();
        applyUser(data.user);
      } catch (err) {
        console.error('Impossible de charger le profil', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Synchronise l'état local et l'utilisateur stocké après chaque mise à jour
  const applyUser = (u) => {
    setUser(u);
    setNom(u.nom || '');
    setPrenom(u.prenom || '');
    setTelephone(u.telephone || '');
    setStoredUser(u);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoMessage(null);
    try {
      const data = await api.updateProfile({ nom, prenom, telephone });
      applyUser(data.user);
      setInfoMessage({ type: 'success', text: 'Informations enregistrées.' });
    } catch (err) {
      setInfoMessage({ type: 'error', text: err.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);

    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) {
      setPasswordMessage({ type: 'error', text: validationError });
      return;
    }

    try {
      const data = await api.changePassword(oldPassword, newPassword);
      applyUser(data.user);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoMessage(null);
    try {
      const data = await api.uploadPhoto(file);
      applyUser(data.user);
      setPhotoMessage({ type: 'success', text: 'Photo mise à jour.' });
    } catch (err) {
      setPhotoMessage({ type: 'error', text: err.message });
    } finally {
      e.target.value = ''; // permet de re-sélectionner le même fichier
    }
  };

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="loader-container">
          <span className="page-loader" />
          <p className="loader-text">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="main-content">
        <div className="profile-alert error">Impossible de charger votre profil.</div>
      </main>
    );
  }

  const initiales = `${(user.prenom || '?')[0]}${(user.nom || '')[0] || ''}`.toUpperCase();

  return (
    <main className="main-content">
      {/* Bandeau bloquant tant que le mot de passe temporaire n'est pas remplacé */}
      {user.mustChangePassword && (
        <div className="profile-alert warning">
          <span className="material-symbols-outlined">lock_reset</span>
          <div>
            <strong>Changement de mot de passe requis</strong>
            <p>
              Vous utilisez un mot de passe temporaire. Vous devez le remplacer avant d'accéder au
              reste de l'application.
            </p>
          </div>
        </div>
      )}

      <section className="page-header">
        <div>
          <h1 className="page-title">Mon profil</h1>
          <p className="page-subtitle">Gérer vos informations personnelles et votre mot de passe</p>
        </div>
      </section>

      <div className="profile-grid">
        {/* Carte identité + photo */}
        <section className="table-card profile-card">
          <div className="profile-avatar-zone">
            {user.photo ? (
              <img src={photoUrl(user.photo)} alt="Photo de profil" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">{initiales}</div>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={user.mustChangePassword}
            >
              <span className="material-symbols-outlined btn-icon">photo_camera</span>
              Changer la photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="profile-file-input"
            />
            <p className="profile-hint">JPEG, PNG, WEBP ou GIF — 2 Mo maximum</p>
            {photoMessage && (
              <div className={`profile-alert ${photoMessage.type}`}>{photoMessage.text}</div>
            )}
          </div>

          <dl className="profile-meta">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Rôle</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{user.status}</dd>
            </div>
            <div>
              <dt>Membre depuis</dt>
              <dd>{user.date}</dd>
            </div>
          </dl>
        </section>

        {/* Formulaires */}
        <div className="profile-forms">
          <section className="table-card">
            <h2 className="profile-section-title">Informations personnelles</h2>
            <form onSubmit={handleSaveInfo} className="modal-form">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="form-input"
                    disabled={user.mustChangePassword}
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
                    disabled={user.mustChangePassword}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="form-input"
                  disabled={user.mustChangePassword}
                />
              </div>

              {infoMessage && (
                <div className={`profile-alert ${infoMessage.type}`}>{infoMessage.text}</div>
              )}

              <div className="profile-form-footer">
                <button type="submit" className="btn-primary" disabled={user.mustChangePassword}>
                  Enregistrer
                </button>
              </div>
            </form>
          </section>

          <section className="table-card">
            <h2 className="profile-section-title">Changer le mot de passe</h2>
            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmer</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <p className="profile-hint">8 caractères minimum, différent de l'actuel.</p>

              {passwordMessage && (
                <div className={`profile-alert ${passwordMessage.type}`}>{passwordMessage.text}</div>
              )}

              <div className="profile-form-footer">
                {user.mustChangePassword ? null : (
                  <button type="button" className="btn-secondary" onClick={() => navigate('/users')}>
                    Retour
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  Modifier le mot de passe
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ProfileSettings;
