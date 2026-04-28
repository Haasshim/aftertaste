import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'test@aftertaste.com' && password === 'taste123') {
      navigate('/home');
    } else if (!email || !password) {
      setError('Please enter email and password.');
    } else {
      setError('Invalid credentials. See test credentials below.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <h1 style={styles.brand}>aftertaste</h1>
        <p style={styles.tagline}>Remember every bite.</p>
      </div>

      <div style={styles.formSection}>
        <h2 style={styles.welcome}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to your food journal</p>

        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>EMAIL</label>
            <input
              style={styles.input}
              type="email"
              placeholder="test@aftertaste.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              placeholder="taste123"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.loginBtn}>Sign In</button>
        </form>

        <button style={styles.googleBtn} disabled>
          Sign in with Google (Coming Soon)
        </button>

        <div style={styles.testBox}>
          <p style={styles.testLabel}>TEST CREDENTIALS</p>
          <p style={styles.testText}>Email: test@aftertaste.com</p>
          <p style={styles.testText}>Password: taste123</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    overflow: 'auto',
  },
  topSection: {
    background: '#004225',
    padding: '60px 24px 40px',
    textAlign: 'center',
    flexShrink: 0,
  },
  brand: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '36px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '2px',
    margin: 0,
  },
  tagline: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '6px',
  },
  formSection: {
    flex: 1,
    padding: '36px 30px',
    overflow: 'auto',
  },
  welcome: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6B6B6B',
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#6B6B6B',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    border: '1.5px solid #E0E0E0',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '16px',
    color: '#1A1A1A',
    background: '#F8F8F6',
    boxSizing: 'border-box',
  },
  error: {
    color: '#C0392B',
    fontSize: '14px',
    marginBottom: '10px',
  },
  loginBtn: {
    width: '100%',
    background: '#004225',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  googleBtn: {
    width: '100%',
    background: 'transparent',
    color: '#6B6B6B',
    border: '1.5px solid #E0E0E0',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '12px',
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  testBox: {
    marginTop: '30px',
    padding: '16px',
    background: '#E8F0EB',
    borderRadius: '12px',
    border: '1px solid rgba(0,66,37,0.15)',
  },
  testLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#004225',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  testText: {
    fontSize: '14px',
    color: '#004225',
    fontFamily: 'monospace',
    marginTop: '2px',
  },
};
