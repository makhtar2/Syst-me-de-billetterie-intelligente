import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import ImportCsvModal from '../components/ImportCsvModal';
import StatCard from '../components/StatCard';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Dashboard statistics state
  const [stats, setStats] = useState(null);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // CSV import state
  const [csvSuccessMessage, setCsvSuccessMessage] = useState('');
  const [csvErrors, setCsvErrors] = useState([]);

  // SEO updates
  useEffect(() => {
    document.title = "Gestion des Utilisateurs - Système de Billetterie";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = "Gérer les administrateurs, agents et clients du réseau de transport.";
    }
  }, []);

  // Fetch users and stats from the Node.js API
  const fetchUsers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const params = {};
      if (roleFilter !== 'Tous') params.role = roleFilter;
      if (statusFilter !== 'Tous') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const data = await api.getUsers(params);
      setUsers(data);
      setIsOffline(false);
      
      // Fetch statistics
      try {
        const statsData = await api.getStats();
        setStats(statsData.stats);
      } catch (statsErr) {
        console.warn("Impossible de récupérer les statistiques du backend.", statsErr);
      }
    } catch (err) {
      console.error("API Backend inaccessible.", err);
      setIsOffline(true);
    } finally {
      setIsLoadingList(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Compute local fallback stats if backend stats are not loaded
  const getLocalStats = (role) => {
    const filtered = role === 'Global' ? users : users.filter(u => u.role === role);
    return {
      total: filtered.length,
      actif: filtered.filter(u => u.status === 'Actif').length,
      bloque: filtered.filter(u => u.status === 'Bloqué').length,
      supprime: filtered.filter(u => u.status === 'Supprimé').length,
    };
  };

  const getRoleStats = (roleName) => {
    if (stats && stats.byRole && stats.byRole[roleName]) {
      return {
        total: stats.byRole[roleName].total || 0,
        actif: stats.byRole[roleName].Actif || 0,
        bloque: stats.byRole[roleName].Bloqué || 0,
        supprime: stats.byRole[roleName].Supprimé || 0,
      };
    }
    return getLocalStats(roleName);
  };

  const getGlobalStats = () => {
    if (stats) {
      return {
        total: stats.total || 0,
        actif: stats.byStatus?.Actif || 0,
        bloque: stats.byStatus?.Bloqué || 0,
        supprime: stats.byStatus?.Supprimé || 0,
      };
    }
    return getLocalStats('Global');
  };

  const globalStats = getGlobalStats();
  const adminStats = getRoleStats('Administrateur');
  const agentStats = getRoleStats('Agent');
  const clientStats = getRoleStats('Client');

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telephone.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.prenom} ${user.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    // Par défaut (aucun filtre de statut choisi), les comptes Supprimés sont
    // cachés de la liste — comme une corbeille, ils ne s'affichent que si on
    // filtre explicitement dessus.
    const matchesStatus =
      statusFilter === 'Tous' ? user.status !== 'Supprimé' : user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const isTrashView = statusFilter === 'Supprimé';

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

  // Bulk Actions
  const handleBulkAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.bulkStatus(selectedUserIds, action);
      fetchUsers();
      setSelectedUserIds([]);
    } catch (err) {
      console.error("Échec de l'action groupée via API", err);
    }
  };

  // Single User Actions
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Actif' ? 'Bloqué' : 'Actif';
    try {
      await api.updateUserStatus(id, nextStatus);
      fetchUsers();
    } catch (err) {
      console.error("Échec modification statut via API", err);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Échec de suppression via API", err);
    }
  };

  // Restaure un compte Supprimé vers Bloqué (pas Actif : la restauration ne
  // doit pas déclencher une nouvelle activation ni un nouvel e-mail).
  const handleRestoreUser = async (id) => {
    try {
      await api.updateUserStatus(id, 'Bloqué');
      fetchUsers();
    } catch (err) {
      console.error("Échec de la restauration via API", err);
    }
  };

  // Create User Handler
  const handleCreateUser = async (userData) => {
    try {
      await api.createUser(userData);
      fetchUsers();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Échec création utilisateur via API", err);
    }
  };

  // Edit User Handler
  const handleUpdateUser = async (id, userData) => {
    try {
      await api.updateUser(id, userData);
      fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error("Échec de la mise à jour via API", err);
    }
  };

  // CSV Import Handler
  const handleCsvImport = async (file, onDone) => {
    setCsvSuccessMessage("Importation en cours...");
    setCsvErrors([]);
    try {
      const resData = await api.importUsers(file);
      const errors = resData.summary?.errors || [];
      setCsvSuccessMessage(`${resData.count || 0} utilisateurs importés avec succès !`);
      setCsvErrors(errors);
      fetchUsers();
      if (onDone) onDone();

      // Si tout s'est bien passé, la modale se ferme seule ; sinon on laisse
      // l'administrateur lire le détail des lignes ignorées avant de fermer.
      if (errors.length === 0) {
        setTimeout(() => {
          setIsImportModalOpen(false);
          setCsvSuccessMessage('');
        }, 1500);
      }
    } catch (err) {
      console.error("Échec de l'importation via API", err);
      setCsvSuccessMessage(`Erreur: ${err.message}`);
    }
  };

  return (
    <>
      <main className="main-content">
        {/* API Offline Notice */}
        {isOffline && (
          <div className="offline-notice">
            <span className="material-symbols-outlined offline-icon">cloud_off</span>
            <div>
              <div className="offline-title">Mode Démo Local Actif</div>
              <div className="offline-text">Le serveur API backend n'est pas démarré. La base de données est indisponible.</div>
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
          <StatCard title="Global" icon="insights" accent="global" stats={globalStats} />
          <StatCard title="Administrateurs" icon="admin_panel_settings" accent="admin" stats={adminStats} />
          <StatCard title="Agents" icon="support_agent" accent="agent" stats={agentStats} />
          <StatCard title="Clients" icon="person" accent="client" stats={clientStats} />
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

            <button
              type="button"
              className={`trash-toggle-btn${isTrashView ? ' active' : ''}`}
              onClick={() => setStatusFilter(isTrashView ? 'Tous' : 'Supprimé')}
              title="Voir les comptes supprimés"
            >
              <span className="material-symbols-outlined btn-icon">delete</span>
              Corbeille ({globalStats.supprime})
            </button>
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
                            {user.status === 'Supprimé' ? (
                              <button
                                className="icon-btn"
                                onClick={() => handleRestoreUser(user.id)}
                                title="Restaurer le compte"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#166534' }}>
                                  restore_from_trash
                                </span>
                              </button>
                            ) : (
                              <>
                                <button
                                  className="icon-btn"
                                  onClick={() => setEditingUser(user)}
                                  title="Modifier l'utilisateur"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>
                                    edit
                                  </span>
                                </button>
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
                        {isTrashView
                          ? 'La corbeille est vide.'
                          : 'Aucun utilisateur trouvé correspondant aux filtres.'}
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
              {isTrashView ? (
                <button
                  className="bulk-action-btn"
                  style={{ backgroundColor: '#10b981' }}
                  onClick={() => handleBulkAction('Bloqué')}
                >
                  Restaurer
                </button>
              ) : (
                <>
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
                </>
              )}
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

      {/* EDIT USER MODAL */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
      />

      {/* CSV IMPORT MODAL */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setCsvSuccessMessage('');
          setCsvErrors([]);
        }}
        onImport={handleCsvImport}
        successMessage={csvSuccessMessage}
        errors={csvErrors}
      />
    </>
  );
}

export default UserManagement;
