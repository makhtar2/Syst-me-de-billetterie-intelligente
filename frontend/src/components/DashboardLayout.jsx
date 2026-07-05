import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../styles/dashboard.css';

function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="dashboard-container">
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

          <div className="nav-user">
            <div className="nav-user-avatar">A</div>
            <span className="nav-user-name">Administrateur</span>
          </div>
        </div>
      </header>

      {/* Render children pages */}
      <Outlet />
    </div>
  );
}

export default DashboardLayout;
