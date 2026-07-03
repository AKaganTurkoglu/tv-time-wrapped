import React, { useState, useRef } from 'react';
import { Upload, ShieldAlert, Key, Film, Tv, Loader2 } from 'lucide-react';
import { parseTVTimeZip } from '../utils/dataParser';

export default function UploadZone({ onDataParsed }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    
    // Check if zip
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a valid TV Time data export (.zip file).');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const stats = await parseTVTimeZip(file);
      onDataParsed(stats);
    } catch (err) {
      console.error(err);
      setError('Failed to parse ZIP file. Make sure it is a valid TV Time export.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background visual shapes */}
      <div style={styles.glowLeft}></div>
      <div style={styles.glowRight}></div>

      {/* Top Navbar */}
      <div style={styles.navbar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>T</div>
          <h1 style={styles.logoText}>TV Time <span className="text-gradient-purple-pink">Wrapped</span></h1>
        </div>

      </div>

      {/* Main Upload Card */}
      <div className="glass-panel pulse-glow-animation" style={styles.card}>
        <div style={styles.iconContainer}>
          {loading ? (
            <Loader2 size={40} style={styles.loadingSpinner} />
          ) : (
            <Upload size={40} style={{ color: 'var(--color-primary)' }} />
          )}
        </div>

        <h2 style={styles.cardTitle}>
          {loading ? 'Analyzing your TV Time journey...' : 'Drop your GDPR Export ZIP'}
        </h2>
        <p style={styles.cardSubtitle}>
          {loading 
            ? 'We are unzipping, reading CSV files, and compiling your personalized statistics.' 
            : 'Select or drag your tv-time gdpr-data.zip file to see your Wrapped statistics.'
          }
        </p>

        {!loading && (
          <button 
            className="btn-primary" 
            onClick={() => fileInputRef.current.click()}
            style={{ width: '100%', marginTop: '10px' }}
          >
            Choose File
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip"
          style={{ display: 'none' }}
        />

        {error && <div style={styles.errorText}>{error}</div>}

        {/* Security / Offline Pledge */}
        <div style={styles.pledgeBox}>
          <ShieldAlert size={20} style={styles.pledgeIcon} />
          <div style={styles.pledgeText}>
            <strong>100% Offline & Private</strong>
            <p style={styles.pledgeSub}>
              None of your data will leave your PC. Processing runs entirely in your browser.
              You can even disconnect from the internet and upload your ZIP file, and the site will still work.
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone Overlay when active */}
      {isDragActive && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={styles.dragOverlay}
        >
          <div style={styles.dragBox}>
            <Upload size={60} style={styles.dragIcon} />
            <h3 style={styles.dragText}>Drop it here!</h3>
          </div>
        </div>
      )}
      
      {/* Background drag catcher */}
      {!loading && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          style={styles.dragCatcher}
        ></div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden'
  },
  glowLeft: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(255, 208, 0, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1
  },
  glowRight: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(142, 142, 147, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    zIndex: 10
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoBadge: {
    width: '28px',
    height: '28px',
    backgroundColor: '#1a1a1f',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '900',
    color: 'var(--color-primary)',
    fontSize: '18px',
    lineHeight: '1',
    paddingBottom: '2px',
    fontFamily: 'var(--font-header)'
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.03em'
  },
  settingsIconBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    padding: '10px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'var(--transition-smooth)'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '24px',
    zIndex: 5,
    borderWidth: '2px',
    borderColor: 'rgba(255, 208, 0, 0.15)'
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    background: 'rgba(255, 208, 0, 0.05)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(255, 208, 0, 0.2)'
  },
  loadingSpinner: {
    color: 'var(--color-primary)',
    animation: 'spin 1.5s linear infinite'
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  cardSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  errorText: {
    color: '#f87171',
    fontSize: '0.85rem',
    fontWeight: '500',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: '12px',
    width: '100%',
    marginTop: '10px'
  },
  pledgeBox: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    padding: '16px',
    borderRadius: '16px',
    textAlign: 'left',
    marginTop: '10px'
  },
  pledgeIcon: {
    color: 'var(--color-success)',
    flexShrink: 0,
    marginTop: '2px'
  },
  pledgeText: {
    fontSize: '0.8rem',
    lineHeight: '1.4'
  },
  pledgeSub: {
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  dragOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 3, 7, 0.9)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: '24px'
  },
  dragBox: {
    border: '3px dashed var(--color-primary)',
    width: '100%',
    max_width: '500px',
    height: '60%',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'rgba(255, 208, 0, 0.03)'
  },
  dragIcon: {
    color: 'var(--color-primary)',
    animation: 'bounce 1s infinite alternate'
  },
  dragText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  dragCatcher: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2
  }
};
