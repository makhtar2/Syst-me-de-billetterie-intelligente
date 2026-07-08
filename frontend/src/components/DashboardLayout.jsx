import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth, api } from '../services/api';
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
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

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
              className={`nav-link-item ${currentPath === '/users' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">group</span>
              Utilisateurs
            </Link>
            <Link 
              to="/subscriptions" 
              className={`nav-link-item ${currentPath === '/subscriptions' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">card_membership</span>
              Abonnements
            </Link>
          </nav>

          {user && (
            <div className="nav-user">
              <div className="nav-user-avatar">
                {user.prenom ? user.prenom[0].toUpperCase() : 'U'}
              </div>
              <span className="nav-user-name">{user.prenom} {user.nom}</span>
              <button 
                onClick={handleLogout} 
                className="icon-btn" 
                title="Se déconnecter" 
                style={{ color: '#ef4444', marginLeft: '0.5rem' }}
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
