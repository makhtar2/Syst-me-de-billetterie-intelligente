import React, { useState, useEffect } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track input focus states for premium Figma-like active rings
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // SEO Optimization - Title and Meta Description
  useEffect(() => {
    document.title = "Connexion - Système de Billetterie Intelligente";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Portail de connexion sécurisé pour le Système de Billetterie Intelligente. Gérer vos voyages, tickets et abonnements.";
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError("Veuillez saisir votre adresse email ou votre identifiant.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsLoading(true);

    // Simulate API Auth Request
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      console.log('Utilisateur connecté :', email);
    }, 1500);
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        {/* Brand & Logo Section */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <span className="material-symbols-outlined" style={styles.logoIcon}>
              local_activity
            </span>
          </div>
          <h1 id="login-title" style={styles.title}>Billetterie Intelligente</h1>
          <p style={styles.subtitle}>Connectez-vous pour accéder à votre tableau de bord</p>
        </div>

        {/* Action Alerts */}
        {error && (
          <div id="login-error" style={styles.errorAlert}>
            <span className="material-symbols-outlined" style={styles.alertIcon}>
              error
            </span>
            <span style={styles.alertText}>{error}</span>
          </div>
        )}

        {success && (
          <div id="login-success" style={styles.successAlert}>
            <span className="material-symbols-outlined" style={styles.alertIcon}>
              check_circle
            </span>
            <span style={styles.alertText}>Authentification réussie. Redirection...</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label htmlFor="login-email" style={styles.label}>Adresse email ou Identifiant</label>
            <div 
              style={{
                ...styles.inputWrapper,
                borderColor: isEmailFocused ? '#2563eb' : 'rgba(0, 0, 0, 0.08)',
                boxShadow: isEmailFocused ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
              }}
            >
              <span className="material-symbols-outlined" style={styles.inputIcon}>
                alternate_email
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                disabled={isLoading || success}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.labelRow}>
              <label htmlFor="login-password" style={styles.label}>Mot de passe</label>
              <a href="#forgot-password" style={styles.forgotLink}>Oublié ?</a>
            </div>
            <div 
              style={{
                ...styles.inputWrapper,
                borderColor: isPasswordFocused ? '#2563eb' : 'rgba(0, 0, 0, 0.08)',
                boxShadow: isPasswordFocused ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
              }}
            >
              <span className="material-symbols-outlined" style={styles.inputIcon}>
                lock
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                disabled={isLoading || success}
                style={styles.input}
                required
              />
              <button
                id="toggle-password-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                disabled={isLoading || success}
              >
                <span className="material-symbols-outlined" style={styles.eyeIcon}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading || success}
            style={{
              ...styles.submitBtn,
              opacity: (isLoading || success) ? 0.8 : 1,
              cursor: (isLoading || success) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={styles.loader}></span>
            ) : (
              <>
                Se connecter
                <span className="material-symbols-outlined" style={styles.btnIcon}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer Branding */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Plateforme Sécurisée de Billetterie & Transport 
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '1.5rem',
    backgroundColor: '#ffffff', // Clean white theme background
    backgroundImage: `
      radial-gradient(at 0% 0%, #eff6ff 0px, transparent 50%),
      radial-gradient(at 100% 100%, #dbeafe 0px, transparent 50%)
    `,
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.02),
      0 10px 15px -3px rgba(0, 0, 0, 0.03),
      0 4px 6px -4px rgba(0, 0, 0, 0.03)
    `,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  logoIcon: {
    fontSize: '24px',
    color: '#2563eb', // Royal blue accent
  },
  title: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#1e3a8a', // Deep navy/blue title
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b', // Slate-500
    lineHeight: '1.4',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
  },
  alertIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  alertText: {
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#334155', // Slate-700
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: '0.75rem',
    color: '#2563eb',
    fontWeight: 500,
    textDecoration: 'none',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
    color: '#64748b',
    fontSize: '20px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.625rem 2.5rem 0.625rem 2.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0f172a',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
  },
  eyeIcon: {
    fontSize: '20px',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#2563eb', // Clean primary blue
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.06)',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  },
  btnIcon: {
    fontSize: '18px',
  },
  loader: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
    marginTop: '0.25rem',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: 500,
  }
};

export default Login;
