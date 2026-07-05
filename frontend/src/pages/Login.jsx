import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // SEO Optimization - Title and Meta Description
  useEffect(() => {
    document.title = "Connexion - Système de Billetterie Intelligente";
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Connectez-vous à la plateforme de billetterie intelligente pour gérer vos transports, tickets et abonnements.";
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError("L'adresse email ou l'identifiant est obligatoire.");
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    // Mock API call to simulate login flow
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      console.log('Connexion réussie avec :', email);
    }, 1500);
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🎟️</span>
          </div>
          <h1 id="login-title" style={styles.title}>Billetterie Intelligente</h1>
          <p style={styles.subtitle}>Connectez-vous pour accéder à votre espace sécurisé</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div id="login-error" style={styles.errorAlert}>
            <AlertCircle size={18} style={{ minWidth: '18px' }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div id="login-success" style={styles.successAlert}>
            <CheckCircle size={18} style={{ minWidth: '18px' }} />
            <span>Connexion réussie ! Redirection en cours...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label htmlFor="login-email" style={styles.label}>Adresse Email ou Identifiant</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="login-email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || success}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.passwordLabelRow}>
              <label htmlFor="login-password" style={styles.label}>Mot de passe</label>
              <a href="#forgot-password" style={styles.forgotLink}>Mot de passe oublié ?</a>
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading || success}
            style={{
              ...styles.submitBtn,
              opacity: (isLoading || success) ? 0.7 : 1,
              cursor: (isLoading || success) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={styles.loader}></span>
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Plateforme de gestion de transport urbain.
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline styles leveraging CSS variables for premium look & styling control
const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '1.5rem',
    background: 'var(--bg-main)',
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.12) 0px, transparent 50%)
    `,
  },
  loginCard: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--shadow-lg), var(--shadow-neon)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    transition: 'var(--transition-all)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoContainer: {
    width: '60px',
    height: '60px',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, var(--color-todo), var(--color-test))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.25)',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.75rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    background: 'linear-gradient(to right, #ffffff, #d1d5db)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-done-bg)',
    border: `1px solid var(--color-done)`,
    color: '#a7f3d0',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  passwordLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: '0.75rem',
    color: 'var(--color-todo)',
    textDecoration: 'none',
    transition: 'var(--transition-all)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    transition: 'var(--transition-all)',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    transition: 'var(--transition-all)',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem',
    background: 'linear-gradient(135deg, var(--color-todo), #7c3aed)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.95rem',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
    transition: 'var(--transition-all)',
    marginTop: '0.5rem',
  },
  loader: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};

export default Login;
