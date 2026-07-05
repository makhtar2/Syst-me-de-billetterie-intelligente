import React, { useState, useEffect } from 'react';

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
  
  // Form states
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newRole, setNewRole] = useState('Client');

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
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
        // Assume API returns array of users
        setUsers(data);
        setIsOffline(false);
      } else {
        throw new Error("Réponse serveur incorrecte");
      }
    } catch (err) {
      console.warn("API Backend inaccessible. Mode démo local activé.");
      setIsOffline(true);
      // Initialize with tiny demo data if state is empty
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
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newNom || !newPrenom || !newEmail || !newTelephone) return;

    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: newNom,
            prenom: newPrenom,
            email: newEmail,
            telephone: newTelephone,
            role: newRole
          })
        });
        if (response.ok) {
          fetchUsers();
          setIsCreateModalOpen(false);
          setNewNom('');
          setNewPrenom('');
          setNewEmail('');
          setNewTelephone('');
          setNewRole('Client');
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
      nom: newNom,
      prenom: newPrenom,
      email: newEmail,
      telephone: newTelephone,
      role: newRole,
      status: 'Bloqué',
      date: new Date().toISOString().split('T')[0]
    };

    setUsers([newUser, ...users]);
    setNewNom('');
    setNewPrenom('');
    setNewEmail('');
    setNewTelephone('');
    setNewRole('Client');
    setIsCreateModalOpen(false);
  };

  // CSV Import Handler (API + Fallback)
  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvSuccessMessage("Importation en cours...");

    if (!isOffline) {
      try {
        const formData = new FormData();
        formData.append('file', csvFile);

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
            setCsvFile(null);
            setCsvSuccessMessage('');
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
        setCsvFile(null);
        setCsvSuccessMessage('');
      }, 1500);
    }, 1500);
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <span className="material-symbols-outlined" style={styles.navBrandIcon}>
            local_activity
          </span>
          <span style={styles.navBrandText}>Billetterie Intelligente</span>
        </div>
        <div style={styles.navUser}>
          <div style={styles.navUserAvatar}>A</div>
          <span style={styles.navUserName}>Administrateur</span>
        </div>
      </header>

      <main style={styles.mainContent}>
        {/* API Offline Notice */}
        {isOffline && (
          <div style={styles.offlineNotice}>
            <span className="material-symbols-outlined" style={styles.offlineIcon}>cloud_off</span>
            <div>
              <div style={styles.offlineTitle}>Mode Démo Local Actif</div>
              <div style={styles.offlineText}>Le serveur API backend ({API_BASE_URL}) n'est pas démarré. Les actions sont simulées en mémoire locale.</div>
            </div>
          </div>
        )}

        {/* Page Title & Main Action Buttons */}
        <section style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Gestion des Comptes</h1>
            <p style={styles.pageSubtitle}>Consulter, créer et administrer les comptes utilisateurs</p>
          </div>
          <div style={styles.actionButtonGroup}>
            <button style={styles.btnSecondary} onClick={() => setIsImportModalOpen(true)}>
              <span className="material-symbols-outlined" style={styles.btnIcon}>upload_file</span>
              Importer CSV
            </button>
            <button style={styles.btnPrimary} onClick={() => setIsCreateModalOpen(true)}>
              <span className="material-symbols-outlined" style={styles.btnIcon}>person_add</span>
              Ajouter Individuel
            </button>
          </div>
        </section>

        {/* Stats Grid Dashboard */}
        <section style={styles.statsGrid}>
          {/* Global Statistics Card */}
          <div style={{ ...styles.statsCard, borderLeft: '4px solid #2563eb' }}>
            <h3 style={styles.statsCardTitle}>Global</h3>
            <div style={styles.statsMetricsRow}>
              <div style={styles.metricItem}>
                <span style={styles.metricValue}>{globalStats.total}</span>
                <span style={styles.metricLabel}>Total</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#166534' }}>{globalStats.actif}</span>
                <span style={styles.metricLabel}>Actifs</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#991b1b' }}>{globalStats.bloque}</span>
                <span style={styles.metricLabel}>Bloqués</span>
              </div>
            </div>
          </div>

          {/* Admins Card */}
          <div style={styles.statsCard}>
            <h3 style={styles.statsCardTitle}>Administrateurs</h3>
            <div style={styles.statsMetricsRow}>
              <div style={styles.metricItem}>
                <span style={styles.metricValue}>{adminStats.total}</span>
                <span style={styles.metricLabel}>Total</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#166534' }}>{adminStats.actif}</span>
                <span style={styles.metricLabel}>Actifs</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#991b1b' }}>{adminStats.bloque}</span>
                <span style={styles.metricLabel}>Bloqués</span>
              </div>
            </div>
          </div>

          {/* Agents Card */}
          <div style={styles.statsCard}>
            <h3 style={styles.statsCardTitle}>Agents</h3>
            <div style={styles.statsMetricsRow}>
              <div style={styles.metricItem}>
                <span style={styles.metricValue}>{agentStats.total}</span>
                <span style={styles.metricLabel}>Total</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#166534' }}>{agentStats.actif}</span>
                <span style={styles.metricLabel}>Actifs</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#991b1b' }}>{agentStats.bloque}</span>
                <span style={styles.metricLabel}>Bloqués</span>
              </div>
            </div>
          </div>

          {/* Clients Card */}
          <div style={styles.statsCard}>
            <h3 style={styles.statsCardTitle}>Clients</h3>
            <div style={styles.statsMetricsRow}>
              <div style={styles.metricItem}>
                <span style={styles.metricValue}>{clientStats.total}</span>
                <span style={styles.metricLabel}>Total</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#166534' }}>{clientStats.actif}</span>
                <span style={styles.metricLabel}>Actifs</span>
              </div>
              <div style={styles.metricItem}>
                <span style={{ ...styles.metricValue, color: '#991b1b' }}>{clientStats.bloque}</span>
                <span style={styles.metricLabel}>Bloqués</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section style={styles.filterToolbar}>
          <div style={styles.searchWrapper}>
            <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterDropdowns}>
            <div style={styles.filterDropdownItem}>
              <label style={styles.filterLabel}>Rôle</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)} 
                style={styles.filterSelect}
              >
                <option value="Tous">Tous les rôles</option>
                <option value="Administrateur">Administrateurs</option>
                <option value="Agent">Agents</option>
                <option value="Client">Clients</option>
              </select>
            </div>

            <div style={styles.filterDropdownItem}>
              <label style={styles.filterLabel}>Statut</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                style={styles.filterSelect}
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
        <section style={styles.tableCard}>
          <div style={styles.tableResponsive}>
            {isLoadingList ? (
              <div style={styles.loaderContainer}>
                <span style={styles.pageLoader}></span>
                <p style={styles.loaderText}>Chargement des comptes...</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeaderThCheckbox}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        style={styles.checkbox}
                      />
                    </th>
                    <th style={styles.tableHeaderTh}>Identifiant</th>
                    <th style={styles.tableHeaderTh}>Utilisateur</th>
                    <th style={styles.tableHeaderTh}>Rôle</th>
                    <th style={styles.tableHeaderTh}>Téléphone</th>
                    <th style={styles.tableHeaderTh}>Statut</th>
                    <th style={styles.tableHeaderTh}>Date de création</th>
                    <th style={styles.tableHeaderThAction}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} style={styles.tableRow}>
                        <td style={styles.tableTdCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            style={styles.checkbox}
                          />
                        </td>
                        <td style={styles.tableTdId}>{user.id}</td>
                        <td style={styles.tableTdUser}>
                          <div style={styles.userInfoCell}>
                            <div style={styles.userAvatar}>
                              {user.prenom[0]}{user.nom[0]}
                            </div>
                            <div>
                              <div style={styles.userNameText}>{user.prenom} {user.nom}</div>
                              <div style={styles.userEmailText}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableTd}>
                          <span 
                            style={{
                              ...styles.roleBadge,
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
                        <td style={styles.tableTdPhone}>{user.telephone}</td>
                        <td style={styles.tableTd}>
                          <div style={styles.statusCell}>
                            <span 
                              style={{
                                ...styles.statusDot,
                                backgroundColor: 
                                  user.status === 'Actif' ? '#10b981' :
                                  user.status === 'Bloqué' ? '#f59e0b' : '#ef4444'
                              }}
                            ></span>
                            <span style={styles.statusText}>{user.status}</span>
                          </div>
                        </td>
                        <td style={styles.tableTdDate}>{user.date}</td>
                        <td style={styles.tableTdAction}>
                          <div style={styles.actionCell}>
                            {user.status !== 'Supprimé' && (
                              <>
                                <button
                                  style={styles.iconBtn}
                                  onClick={() => handleToggleStatus(user.id, user.status)}
                                  title={user.status === 'Actif' ? 'Bloquer le compte' : 'Activer le compte'}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>
                                    {user.status === 'Actif' ? 'block' : 'check_circle'}
                                  </span>
                                </button>
                                <button
                                  style={styles.iconBtn}
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
                      <td colSpan="8" style={styles.tableEmptyCell}>
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
          <div style={styles.bulkActionBar}>
            <div style={styles.bulkActionInfo}>
              <span className="material-symbols-outlined" style={styles.bulkActionInfoIcon}>
                check_box
              </span>
              <span>{selectedUserIds.length} sélectionné(s)</span>
            </div>
            <div style={styles.bulkActionButtons}>
              <button 
                style={{ ...styles.bulkActionBtn, backgroundColor: '#10b981' }}
                onClick={() => handleBulkAction('Actif')}
              >
                Activer
              </button>
              <button 
                style={{ ...styles.bulkActionBtn, backgroundColor: '#f59e0b' }}
                onClick={() => handleBulkAction('Bloqué')}
              >
                Bloquer
              </button>
              <button 
                style={{ ...styles.bulkActionBtn, backgroundColor: '#ef4444' }}
                onClick={() => handleBulkAction('Supprimé')}
              >
                Supprimer
              </button>
              <button 
                style={styles.bulkActionCancelBtn} 
                onClick={() => setSelectedUserIds([])}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalPanel}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Créer un Utilisateur</h2>
              <button style={styles.modalCloseBtn} onClick={() => setIsCreateModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateUser} style={styles.modalForm}>
              <div style={styles.modalGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Prénom</label>
                  <input
                    type="text"
                    required
                    value={newPrenom}
                    onChange={(e) => setNewPrenom(e.target.value)}
                    style={styles.formInput}
                    placeholder="Ex: Jean"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nom</label>
                  <input
                    type="text"
                    required
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                    style={styles.formInput}
                    placeholder="Ex: Dupont"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Adresse email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.formInput}
                  placeholder="jean.dupont@entreprise.com"
                />
              </div>

              <div style={styles.modalGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Téléphone</label>
                  <input
                    type="tel"
                    required
                    value={newTelephone}
                    onChange={(e) => setNewTelephone(e.target.value)}
                    style={styles.formInput}
                    placeholder="+221 77 123 45 67"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Rôle</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="Client">Client</option>
                    <option value="Agent">Agent</option>
                    <option value="Administrateur">Administrateur</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecondary} onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalPanel}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Importation massive d'utilisateurs</h2>
              <button style={styles.modalCloseBtn} onClick={() => setIsImportModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCsvSubmit} style={styles.modalForm}>
              <p style={styles.modalHelperText}>
                Importez des comptes en masse. Le fichier CSV doit comporter les en-têtes suivants : 
                <code> nom,prenom,email,telephone,role</code>
              </p>

              {csvSuccessMessage && (
                <div style={{
                  ...styles.successAlert,
                  backgroundColor: csvSuccessMessage.includes("Succès") || csvSuccessMessage.includes("succès") ? '#ecfdf5' : '#eff6ff',
                  borderColor: csvSuccessMessage.includes("Succès") || csvSuccessMessage.includes("succès") ? '#a7f3d0' : '#bfdbfe',
                  color: csvSuccessMessage.includes("Succès") || csvSuccessMessage.includes("succès") ? '#047857' : '#1d4ed8'
                }}>
                  <span className="material-symbols-outlined">info</span>
                  <span>{csvSuccessMessage}</span>
                </div>
              )}

              <div style={styles.dropzone}>
                <span className="material-symbols-outlined" style={styles.dropzoneIcon}>
                  cloud_upload
                </span>
                <p style={styles.dropzoneText}>
                  {csvFile ? `Fichier prêt : ${csvFile.name}` : "Cliquez ou glissez-déposez le fichier CSV ici"}
                </p>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  style={styles.dropzoneInput}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecondary} onClick={() => setIsImportModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimary} disabled={!csvFile}>
                  Lancer l'importation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for Figma blue/white theme
const styles = {
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'var(--font-sans)',
  },
  navbar: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  navBrandIcon: {
    color: '#2563eb',
    fontSize: '24px',
  },
  navBrandText: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#1e3a8a',
  },
  navUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  navUserAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  navUserName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
  },
  mainContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  offlineNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '12px',
    color: '#b45309',
  },
  offlineIcon: {
    fontSize: '24px',
    color: '#d97706',
  },
  offlineTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
  },
  offlineText: {
    fontSize: '0.8rem',
    marginTop: '0.125rem',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.08)',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnIcon: {
    fontSize: '18px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
  },
  statsCardTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  statsMetricsRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: '0.7rem',
    fontWeight: 500,
    color: '#94a3b8',
    marginTop: '0.125rem',
  },
  filterToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flexGrow: 1,
    maxWidth: '480px',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '0.625rem 1rem 0.625rem 2.5rem',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  filterDropdowns: {
    display: 'flex',
    gap: '1rem',
  },
  filterDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#64748b',
  },
  filterSelect: {
    padding: '0.5rem 1.75rem 0.5rem 0.75rem',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '0.825rem',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
    overflow: 'hidden',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  loaderContainer: {
    padding: '3rem',
    textAlign: 'center',
  },
  pageLoader: {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    border: '3px solid rgba(37, 99, 235, 0.1)',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loaderText: {
    marginTop: '0.75rem',
    fontSize: '0.85rem',
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: '#fafafa',
  },
  tableHeaderThCheckbox: {
    padding: '1rem',
    width: '40px',
  },
  tableHeaderTh: {
    padding: '1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableHeaderThAction: {
    padding: '1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'right',
  },
  tableRow: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease',
  },
  tableTdCheckbox: {
    padding: '1rem',
  },
  tableTd: {
    padding: '1rem',
    fontSize: '0.85rem',
  },
  tableTdId: {
    padding: '1rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#64748b',
  },
  tableTdUser: {
    padding: '1.25rem 1rem',
  },
  tableTdPhone: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: '#475569',
  },
  tableTdDate: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: '#64748b',
  },
  tableTdAction: {
    padding: '1rem',
    textAlign: 'right',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1.5px solid #cbd5e1',
    cursor: 'pointer',
  },
  userInfoCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    border: '1.5px solid #bfdbfe',
  },
  userNameText: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  userEmailText: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  roleBadge: {
    padding: '0.2rem 0.625rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  actionCell: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  tableEmptyCell: {
    textAlign: 'center',
    padding: '3rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  bulkActionBar: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    padding: '0.875rem 1.5rem',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    zIndex: 100,
  },
  bulkActionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  bulkActionInfoIcon: {
    color: '#38bdf8',
    fontSize: '20px',
  },
  bulkActionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  bulkActionBtn: {
    border: 'none',
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  bulkActionCancelBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0.375rem 0.5rem',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  modalPanel: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  modalForm: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#475569',
  },
  formInput: {
    padding: '0.625rem 0.875rem',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#0f172a',
  },
  formSelect: {
    padding: '0.625rem 0.875rem',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    color: '#0f172a',
    cursor: 'pointer',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  modalHelperText: {
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: '1.4',
  },
  dropzone: {
    border: '2px dashed #bfdbfe',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '2.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropzoneIcon: {
    fontSize: '36px',
    color: '#2563eb',
  },
  dropzoneText: {
    fontSize: '0.85rem',
    color: '#475569',
    fontWeight: 500,
    textAlign: 'center',
  },
  dropzoneInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  }
};

export default UserManagement;
