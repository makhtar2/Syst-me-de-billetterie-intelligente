import { useState, useEffect } from 'react';
import './App.css';

const API_STATUS_URL = 'http://localhost:5050/api/status';

function App() {
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    connected: false,
    message: '',
    timestamp: null
  });

  // Verify connection to the backend Express/MongoDB server
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(API_STATUS_URL);
        if (!res.ok) throw new Error('API server returned error status');
        const data = await res.json();
        setBackendStatus({
          loading: false,
          connected: true,
          message: data.message,
          timestamp: data.timestamp
        });
      } catch (err) {
        setBackendStatus({
          loading: false,
          connected: false,
          message: 'Impossible de se connecter au serveur backend sur le port 5050.',
          timestamp: null
        });
      }
    };

    checkConnection();
    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header className="app-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div className="header-title-container">
          <div className="header-icon" style={{ fontSize: '2.5rem' }}>🎟️</div>
          <div>
            <h1 className="app-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Système de Billetterie Intelligente</h1>
            <p className="app-subtitle" style={{ color: 'var(--text-secondary)' }}>Architecture du projet initialisée avec succès !</p>
          </div>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Status Panel */}
        <section className="kanban-column" style={{ minHeight: 'auto', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Statut de l'infrastructure</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span 
                className="stat-dot" 
                style={{ 
                  backgroundColor: backendStatus.connected ? 'var(--color-done)' : '#ef4444',
                  boxShadow: backendStatus.connected ? '0 0 10px var(--color-done)' : '0 0 10px #ef4444'
                }}
              ></span>
              <span style={{ fontWeight: 600 }}>Serveur Backend & MongoDB :</span>
              <span style={{ color: backendStatus.connected ? 'var(--color-done)' : '#ef4444' }}>
                {backendStatus.loading ? 'Vérification...' : backendStatus.connected ? 'Connecté' : 'Hors ligne'}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
              {backendStatus.message || 'Tentative de connexion au backend sur http://localhost:5050...'}
            </p>
          </div>
        </section>

        {/* First Card Progress Tracker */}
        <section className="kanban-column" style={{ minHeight: 'auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Étape 1 : Initialisation du projet</h2>
            <span className="column-badge" style={{ backgroundColor: 'var(--color-done-bg)', color: 'var(--color-done)' }}>100% Complété</span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Créer l'architecture du projet React, Node.js et MongoDB.
          </p>

          <div className="progress-bar-bg" style={{ marginBottom: '1.5rem', height: '8px' }}>
            <div className="progress-bar-fill" style={{ width: '100%', backgroundColor: 'var(--color-done)' }}></div>
          </div>

          {/* Steps Checklist */}
          <div className="checklist-wrapper">
            {[
              { text: 'Initialiser le dépôt Git', done: true },
              { text: 'Initialiser React (Vite)', done: true },
              { text: 'Initialiser Node.js', done: true },
              { text: 'Configurer Express', done: true },
              { text: 'Connecter MongoDB', done: true },
              { text: 'Installer les dépendances', done: true },
              { text: 'Tester le démarrage', done: true }
            ].map((step, idx) => (
              <div key={idx} className="checklist-item" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                <div className="checklist-item-left">
                  <span 
                    style={{ 
                      color: 'var(--color-done)', 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      marginRight: '0.5rem'
                    }}
                  >
                    ✓
                  </span>
                  <span className="checklist-item-text completed">
                    {step.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
          <p>Vous pouvez maintenant commencer à développer les fonctionnalités de votre système de billetterie intelligente.</p>
          <p style={{ marginTop: '0.5rem' }}>Le dossier de travail est structuré en <code>frontend/</code> et <code>backend/</code>.</p>
        </section>
      </main>
    </div>
  );
}

export default App;
