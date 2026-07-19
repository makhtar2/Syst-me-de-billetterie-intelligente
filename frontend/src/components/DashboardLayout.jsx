import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth, api, photoUrl } from '../services/api';
import '../styles/dashboard.css';

function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);

    // Mot de passe temporaire : écran dédié en dehors du dashboard, rien
    // d'autre n'est accessible tant que ce n'est pas fait.
    if (storedUser.mustChangePassword) {
      navigate('/change-password', { replace: true });
    }
  }, [navigate, currentPath]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Gemini Background Depth */}
      <div className="gemini-bg" />
      <div className="gemini-aura">
        <div className="aura-spot spot-1" />
        <div className="aura-spot spot-2" />
        <div className="aura-spot spot-3" />
      </div>

      {/* Centralized Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="material-symbols-outlined nav-brand-icon">
            local_activity
          </span>
          <span className="nav-brand-text">Billetterie Intelligente</span>
        </div>

        {/* Centralized Navigation Tabs for Admin Area */}
        <div className="nav-right-area">
          <nav className="nav-links">
            <Link
              to="/users"
              title="Utilisateurs"
              className={`nav-link-item ${currentPath === '/users' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="nav-link-text">Utilisateurs</span>
            </Link>
            <Link
              to="/formules"
              title="Formules"
              className={`nav-link-item ${currentPath === '/formules' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              <span className="nav-link-text">Formules</span>
            </Link>
            <Link
              to="/abonnements"
              title="Abonnements"
              className={`nav-link-item ${currentPath.startsWith('/abonnements') ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">card_membership</span>
              <span className="nav-link-text">Abonnements</span>
            </Link>
            <Link
              to="/stats"
              title="Tableau de bord"
              className={`nav-link-item ${currentPath === '/stats' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">bar_chart</span>
              <span className="nav-link-text">Tableau de bord</span>
            </Link>
            <Link
              to="/profile"
              title="Mon profil"
              className={`nav-link-item ${currentPath === '/profile' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">account_circle</span>
              <span className="nav-link-text">Mon profil</span>
            </Link>
          </nav>

          {user && (
            <div className="nav-user">
              <div className="nav-user-avatar">
                {user.photo ? (
                  <img
                    src={photoUrl(user.photo)}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  user.prenom ? user.prenom[0].toUpperCase() : 'U'
                )}
              </div>
              <span className="nav-user-name">{user.prenom} {user.nom}</span>
              <button
                onClick={handleLogout}
                className="icon-btn logout-btn"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Render children pages */}
      <Outlet />
    </div>
  );
}

export default DashboardLayout;
