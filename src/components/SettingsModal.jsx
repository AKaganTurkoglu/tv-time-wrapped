import React, { useState, useEffect } from 'react';
import { X, Key, Shield, HelpCircle, Check } from 'lucide-react';

const DEFAULT_TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('tvt_wrapped_tmdb_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Pre-fill with the user's key as a convenience default
      setApiKey(DEFAULT_TMDB_KEY);
      localStorage.setItem('tvt_wrapped_tmdb_key', DEFAULT_TMDB_KEY);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('tvt_wrapped_tmdb_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('tvt_wrapped_tmdb_key');
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Key size={20} className="text-gradient-purple-pink" />
            <h2 style={styles.title}>TMDB API Settings</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.infoBox}>
            <Shield size={24} style={styles.infoIcon} />
            <div style={styles.infoText}>
              <strong>100% Client-Side Security Guarantee</strong>
              <p style={styles.subtitle}>
                Your API key is saved directly inside your browser's local storage.
                It never leaves your computer and is only used to fetch TV show/movie posters.
              </p>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>TMDB API Key (v3 auth)</label>
            <input
              type="text"
              placeholder="Paste your TMDB API Key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.helpTextContainer}>
            <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={styles.helpText}>
              Need a key? Register for free at{' '}
              <a
                href="https://www.themoviedb.org/signup"
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                themoviedb.org
              </a>{' '}
              and generate a Developer key.
            </span>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={handleClear} style={styles.clearBtn}>
            Clear Key
          </button>
          <button onClick={handleSave} style={styles.saveBtn}>
            {saved ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 3, 7, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '450px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), var(--shadow-glow)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  infoBox: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(168, 85, 247, 0.05)',
    border: '1px solid rgba(168, 85, 247, 0.15)',
    padding: '12px',
    borderRadius: '12px'
  },
  infoIcon: {
    color: 'var(--color-primary)',
    flexShrink: 0
  },
  infoText: {
    fontSize: '0.85rem',
    lineHeight: '1.4'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  input: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid var(--border-glass)',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'var(--transition-smooth)'
  },
  helpTextContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  helpText: {
    lineHeight: '1.3'
  },
  link: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: '500'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  clearBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    fontWeight: '600',
    padding: '10px 18px',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)'
  },
  saveBtn: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
    border: 'none',
    fontWeight: '600',
    padding: '10px 20px',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    boxShadow: '0 4px 12px 0 rgba(168, 85, 247, 0.2)',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};
