import React, { useState, useEffect } from 'react';
import CreateUserModal from '../components/CreateUserModal';
import ImportCsvModal from '../components/ImportCsvModal';
import './UserManagement.css';

const API_BASE_URL = 'http://localhost:5050/api/admin';

// Tiny mock dataset for local offline fallback/demo mode
const FALLBACK_USERS = [
  { id: 'USR-DEMO1', nom: 'Sow', prenom: 'Moussa', email: 'moussa.sow@email.com', telephone: '+221 77 123 45 67', role: 'Administrateur', status: 'Actif', date: '2026-05-12' },
  { id: 'USR-DEMO2', nom: 'Diop', prenom: 'Fatou', email: 'fatou.diop@email.com', telephone: '+221 78 234 56 78', role: 'Agent', status: 'Bloqué', date: '2026-06-01' }
];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // CSV import state
  const [csvSuccessMessage, setCsvSuccessMessage] = useState('');

  // SEO updates
  useEffect(() => {
    document.title = "Gestion des Utilisateurs - Système de Billetterie";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = "Gérer les administrateurs, agents et clients du réseau de transport.";
    }
  }, []);

  // Fetch users from the Node.js API
  const fetchUsers = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setIsOffline(false);
      } else {
        throw new Error("Réponse serveur incorrecte");
      }
    } catch (err) {
      console.warn("API Backend inaccessible. Mode démo local activé.");
      setIsOffline(true);
      if (users.length === 0) {
        setUsers(FALLBACK_USERS);
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute Statistics
  const getStats = (role) => {
    const filtered = role === 'Global' ? users : users.filter(u => u.role === role);
    return {
      total: filtered.length,
      actif: filtered.filter(u => u.status === 'Actif').length,
      bloque: filtered.filter(u => u.status === 'Bloqué').length,
      supprime: filtered.filter(u => u.status === 'Supprimé').length,
    };
  };

  const globalStats = getStats('Global');
  const adminStats = getStats('Administrateur');
  const agentStats = getStats('Agent');
  const clientStats = getStats('Client');

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telephone.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.prenom} ${user.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'Tous' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(item => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Bulk Actions (API + Fallback)
  const handleBulkAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/bulk-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUserIds, action })
        });
        if (response.ok) {
          fetchUsers();
          setSelectedUserIds([]);
          return;
        }
      } catch (err) {
        console.error("Échec de l'action groupée via API, repli local.", err);
      }
    }

    // Offline local fallback
    setUsers(users.map(user => {
      if (selectedUserIds.includes(user.id)) {
        return { ...user, status: action };
      }
      return user;
    }));
    setSelectedUserIds([]);
  };

  // Single User Actions (API + Fallback)
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Actif' ? 'Bloqué' : 'Actif';
    
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (response.ok) {
          fetchUsers();
          return;
        }
      } catch (err) {
        console.error("Échec modification statut via API, repli local.", err);
      }
    }

    // Fallback
    setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));
  };

  const handleDeleteUser = async (id) => {
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchUsers();
          return;
        }
      } catch (err) {
        console.error("Échec de suppression via API, repli local.", err);
      }
    }

    // Fallback
    setUsers(users.map(u => u.id === id ? { ...u, status: 'Supprimé' } : u));
  };

  // Create User Handler (API + Fallback)
  const handleCreateUser = async (userData) => {
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        if (response.ok) {
          fetchUsers();
          setIsCreateModalOpen(false);
          return;
        }
      } catch (err) {
        console.error("Échec création utilisateur via API, repli local.", err);
      }
    }

    // Fallback local creation
    const newId = `USR-0${users.length + 1}`;
    const newUser = {
      id: newId,
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      telephone: userData.telephone,
      role: userData.role,
      status: 'Bloqué',
      date: new Date().toISOString().split('T')[0]
    };

    setUsers([newUser, ...users]);
    setIsCreateModalOpen(false);
  };

  // CSV Import Handler (API + Fallback)
  const handleCsvImport = async (file, onDone) => {
    setCsvSuccessMessage("Importation en cours...");

    if (!isOffline) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/users/import`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const resData = await response.json();
          setCsvSuccessMessage(`${resData.count || 'Importation'} utilisateurs importés avec succès !`);
          setTimeout(() => {
            fetchUsers();
            setIsImportModalOpen(false);
            setCsvSuccessMessage('');
            onDone();
          }, 1500);
          return;
        }
      } catch (err) {
        console.error("Échec de l'importation via API, repli local.", err);
      }
    }

    // Fallback simulation
    setTimeout(() => {
      const importedUsers = [
        { id: `USR-00${users.length + 1}`, nom: 'Baye', prenom: 'Modou', email: 'modou.baye@email.com', telephone: '+221 77 987 65 43', role: 'Client', status: 'Bloqué', date: new Date().toISOString().split('T')[0] }
      ];
      setUsers([...importedUsers, ...users]);
      setCsvSuccessMessage("1 utilisateur importé en local.");
      setTimeout(() => {
        setIsImportModalOpen(false);
        setCsvSuccessMessage('');
        onDone();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="dashboard-container">
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

      <main className="main-content">
        {/* API Offline Notice */}
        {isOffline && (
          <div className="offline-notice">
            <span className="material-symbols-outlined offline-icon">cloud_off</span>
            <div>
              <div className="offline-title">Mode Démo Local Actif</div>
              <div className="offline-text">Le serveur API backend ({API_BASE_URL}) n'est pas démarré. Les actions sont simulées en mémoire locale.</div>
            </div>
          </div>
        )}

        {/* Page Title & Main Action Buttons */}
        <section className="page-header">
          <div>
            <h1 className="page-title">Gestion des Comptes</h1>
            <p className="page-subtitle">Consulter, créer et administrer les comptes utilisateurs</p>
          </div>
          <div className="action-button-group">
            <button className="btn-secondary" onClick={() => setIsImportModalOpen(true)}>
              <span className="material-symbols-outlined btn-icon">upload_file</span>
              Importer CSV
            </button>
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <span className="material-symbols-outlined btn-icon">person_add</span>
              Ajouter Individuel
            </button>
          </div>
        </section>

        {/* Stats Grid Dashboard */}
        <section className="stats-grid">
          {/* Global Statistics Card */}
          <div className="stats-card highlighted">
            <h3 className="stats-card-title">Global</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{globalStats.total}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#166534' }}>{globalStats.actif}</span>
                <span className="metric-label">Actifs</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#991b1b' }}>{globalStats.bloque}</span>
                <span className="metric-label">Bloqués</span>
              </div>
            </div>
          </div>

          {/* Admins Card */}
          <div className="stats-card">
            <h3 className="stats-card-title">Administrateurs</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{adminStats.total}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#166534' }}>{adminStats.actif}</span>
                <span className="metric-label">Actifs</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#991b1b' }}>{adminStats.bloque}</span>
                <span className="metric-label">Bloqués</span>
              </div>
            </div>
          </div>

          {/* Agents Card */}
          <div className="stats-card">
            <h3 className="stats-card-title">Agents</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{agentStats.total}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#166534' }}>{agentStats.actif}</span>
                <span className="metric-label">Actifs</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#991b1b' }}>{agentStats.bloque}</span>
                <span className="metric-label">Bloqués</span>
              </div>
            </div>
          </div>

          {/* Clients Card */}
          <div className="stats-card">
            <h3 className="stats-card-title">Clients</h3>
            <div className="stats-metrics-row">
              <div className="metric-item">
                <span className="metric-value">{clientStats.total}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#166534' }}>{clientStats.actif}</span>
                <span className="metric-label">Actifs</span>
              </div>
              <div className="metric-item">
                <span className="metric-value" style={{ color: '#991b1b' }}>{clientStats.bloque}</span>
                <span className="metric-label">Bloqués</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="filter-toolbar">
          <div className="search-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-dropdowns">
            <div className="filter-dropdown-item">
              <label className="filter-label">Rôle</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)} 
                className="filter-select"
              >
                <option value="Tous">Tous les rôles</option>
                <option value="Administrateur">Administrateurs</option>
                <option value="Agent">Agents</option>
                <option value="Client">Clients</option>
              </select>
            </div>

            <div className="filter-dropdown-item">
              <label className="filter-label">Statut</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="filter-select"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Actif">Actifs</option>
                <option value="Bloqué">Bloqués</option>
                <option value="Supprimé">Supprimés</option>
              </select>
            </div>
          </div>
        </section>

        {/* User Table Card */}
        <section className="table-card">
          <div className="table-responsive">
            {isLoadingList ? (
              <div className="loader-container">
                <span className="page-loader"></span>
                <p className="loader-text">Chargement des comptes...</p>
              </div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-th-checkbox">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        className="checkbox-custom"
                      />
                    </th>
                    <th className="table-header-th">Identifiant</th>
                    <th className="table-header-th">Utilisateur</th>
                    <th className="table-header-th">Rôle</th>
                    <th className="table-header-th">Téléphone</th>
                    <th className="table-header-th">Statut</th>
                    <th className="table-header-th">Date de création</th>
                    <th className="table-header-th-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="table-row">
                        <td className="table-td-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="checkbox-custom"
                          />
                        </td>
                        <td className="table-td-id">{user.id}</td>
                        <td className="table-td-user">
                          <div className="user-info-cell">
                            <div className="user-avatar">
                              {user.prenom[0]}{user.nom[0]}
                            </div>
                            <div>
                              <div className="user-name-text">{user.prenom} {user.nom}</div>
                              <div className="user-email-text">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-td">
                          <span 
                            className="role-badge"
                            style={{
                              backgroundColor: 
                                user.role === 'Administrateur' ? '#eff6ff' :
                                user.role === 'Agent' ? '#f0fdf4' : '#faf5ff',
                              color: 
                                user.role === 'Administrateur' ? '#1e40af' :
                                user.role === 'Agent' ? '#166534' : '#6b21a8'
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="table-td-phone">{user.telephone}</td>
                        <td className="table-td">
                          <div className="status-cell">
                            <span 
                              className="status-dot"
                              style={{
                                backgroundColor: 
                                  user.status === 'Actif' ? '#10b981' :
                                  user.status === 'Bloqué' ? '#f59e0b' : '#ef4444'
                              }}
                            ></span>
                            <span className="status-text">{user.status}</span>
                          </div>
                        </td>
                        <td className="table-td-date">{user.date}</td>
                        <td className="table-td-action">
                          <div className="action-cell">
                            {user.status !== 'Supprimé' && (
                              <>
                                <button
                                  className="icon-btn"
                                  onClick={() => handleToggleStatus(user.id, user.status)}
                                  title={user.status === 'Actif' ? 'Bloquer le compte' : 'Activer le compte'}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>
                                    {user.status === 'Actif' ? 'block' : 'check_circle'}
                                  </span>
                                </button>
                                <button
                                  className="icon-btn"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Supprimer l'utilisateur"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444' }}>
                                    delete
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="table-empty-cell">
                        Aucun utilisateur trouvé correspondant aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Floating Bulk Actions Bar */}
        {selectedUserIds.length > 0 && (
          <div className="bulk-action-bar">
            <div className="bulk-action-info">
              <span className="material-symbols-outlined bulk-action-info-icon">
                check_box
              </span>
              <span>{selectedUserIds.length} sélectionné(s)</span>
            </div>
            <div className="bulk-action-buttons">
              <button 
                className="bulk-action-btn"
                style={{ backgroundColor: '#10b981' }}
                onClick={() => handleBulkAction('Actif')}
              >
                Activer
              </button>
              <button 
                className="bulk-action-btn"
                style={{ backgroundColor: '#f59e0b' }}
                onClick={() => handleBulkAction('Bloqué')}
              >
                Bloquer
              </button>
              <button 
                className="bulk-action-btn"
                style={{ backgroundColor: '#ef4444' }}
                onClick={() => handleBulkAction('Supprimé')}
              >
                Supprimer
              </button>
              <button 
                className="bulk-action-cancel-btn" 
                onClick={() => setSelectedUserIds([])}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CREATE USER MODAL */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />

      {/* CSV IMPORT MODAL */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleCsvImport}
        successMessage={csvSuccessMessage}
      />
    </div>
  );
}

export default UserManagement;
