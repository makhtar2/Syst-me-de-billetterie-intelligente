import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const EMPTY_FORM = { nom: '', prenom: '', email: '', telephone: '', role: 'Client' };

function statusBadge(status) {
  const cls =
    status === 'Actif' ? 'badge-actif' : status === 'Bloqué' ? 'badge-bloque' : 'badge-supprime';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [csvFile, setCsvFile] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter !== 'Tous') params.role = roleFilter;
      if (statusFilter !== 'Tous') params.status = statusFilter;
      if (search) params.search = search;
      const data = await api.getUsers(params);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? users.map((u) => u.id) : []);
  };

  const handleBulk = async (action) => {
    if (!selectedIds.length) return;
    try {
      await api.bulkStatus(selectedIds, action);
      setMessage(`${selectedIds.length} compte(s) mis à jour`);
      setSelectedIds([]);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    const next = user.status === 'Actif' ? 'Bloqué' : 'Actif';
    try {
      await api.updateUserStatus(user.id, next);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setMessage('Utilisateur créé (statut: Bloqué)');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    try {
      const result = await api.importUsers(csvFile);
      setMessage(`${result.count} utilisateur(s) importé(s)`);
      setCsvFile(null);
      e.target.reset();
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const stats = {
    total: users.length,
    actif: users.filter((u) => u.status === 'Actif').length,
    bloque: users.filter((u) => u.status === 'Bloqué').length,
  };

  return (
    <>
      <h1 className="page-title">Gestion des utilisateurs</h1>
      <p className="page-subtitle">API connectée — interface minimaliste pour le dev front</p>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="stats-grid">
        <div className="card stat-card">
          <h3>Total</h3>
          <p>{stats.total}</p>
        </div>
        <div className="card stat-card">
          <h3>Actifs</h3>
          <p>{stats.actif}</p>
        </div>
        <div className="card stat-card">
          <h3>Bloqués</h3>
          <p>{stats.bloque}</p>
        </div>
      </div>

      <div className="toolbar">
        <label>
          Recherche
          <input
            type="text"
            placeholder="nom, email, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Rôle
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="Tous">Tous</option>
            <option value="Administrateur">Administrateur</option>
            <option value="Agent">Agent</option>
            <option value="Client">Client</option>
          </select>
        </label>
        <label>
          Statut
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="Tous">Tous</option>
            <option value="Actif">Actif</option>
            <option value="Bloqué">Bloqué</option>
            <option value="Supprimé">Supprimé</option>
          </select>
        </label>
        <button type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Créer'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>Nouvel utilisateur</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <label>
                Nom
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </label>
              <label>
                Prénom
                <input
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Téléphone
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  required
                />
              </label>
              <label>
                Rôle
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Client">Client</option>
                  <option value="Agent">Agent</option>
                  <option value="Administrateur">Administrateur</option>
                </select>
              </label>
            </div>
            <button type="submit" className="primary">
              Enregistrer
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Import CSV</h3>
        <p style={{ margin: '0 0 12px', color: '#666', fontSize: '13px' }}>
          Format: nom,prenom,email,telephone,role
        </p>
        <form onSubmit={handleImport} className="form-row">
          <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
          <button type="submit" className="primary" disabled={!csvFile}>
            Importer
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="empty">Aucun utilisateur</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td>{user.id.slice(-6)}</td>
                  <td>
                    {user.prenom} {user.nom}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{statusBadge(user.status)}</td>
                  <td>
                    <div className="actions">
                      {user.status !== 'Supprimé' && (
                        <>
                          <button type="button" onClick={() => handleToggleStatus(user)}>
                            {user.status === 'Actif' ? 'Bloquer' : 'Activer'}
                          </button>
                          <button type="button" className="danger" onClick={() => handleDelete(user.id)}>
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedIds.length} sélectionné(s)</span>
          <button type="button" onClick={() => handleBulk('Actif')}>
            Activer
          </button>
          <button type="button" onClick={() => handleBulk('Bloqué')}>
            Bloquer
          </button>
          <button type="button" onClick={() => handleBulk('Supprimé')}>
            Supprimer
          </button>
          <button type="button" onClick={() => setSelectedIds([])}>
            Annuler
          </button>
        </div>
      )}
    </>
  );
}

export default UserManagement;
