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

// Inline styles for ultra-modern light theme
const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '1.5rem',
    backgroundColor: '#f8fafc', // Ultra clean slate light background
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 45%),
      radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.15) 0px, transparent 45%)
    `,
  },
  loginCard: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Light glassmorphic card
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '16px', // smooth radius
    padding: '2.5rem 2.25rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(99, 102, 241, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)', // Soft violet-cyan gradient
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
  },
  logoIcon: {
    fontSize: '1.75rem',
  },
  title: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.625rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#0f172a', // Deep slate for primary typography
    marginBottom: '0.375rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#475569', // Medium slate for body/subtitle
    lineHeight: '1.4',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#fef2f2', // Light red bg
    border: '1px solid #fecaca',
    color: '#b91c1c', // Dark red text
    fontSize: '0.85rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#ecfdf5', // Light green bg
    border: '1px solid #a7f3d0',
    color: '#047857', // Dark green text
    fontSize: '0.85rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.825rem',
    fontWeight: 600,
    color: '#334155', // Slate-700
  },
  passwordLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: '0.75rem',
    color: '#4f46e5', // Indigo link
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
    color: '#94a3b8', // Muted slate-400
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem 0.7rem 2.5rem',
    backgroundColor: '#ffffff', // Clean white background for inputs
    border: '1px solid #cbd5e1', // Light gray border
    borderRadius: '8px',
    color: '#0f172a', // Dark text inside input
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    transition: 'color 0.2s ease',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)', // Modern Indigo/Purple gradient
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.925rem',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
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
    marginTop: '0.5rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#64748b', // Slate-500
  }
};

export default Login;
