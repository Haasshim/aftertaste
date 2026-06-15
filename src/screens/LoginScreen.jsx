import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { colors, font, radius } from '../theme/theme';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { signIn, isLocalMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message || 'Could not sign in. Check your details and try again.');
      setBusy(false);
      return;
    }
    navigate('/home', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <h1 style={styles.brand}>Aftertaste</h1>
        <p style={styles.tagline}>Remember every bite.</p>
        <div style={styles.flourish}>
          <span style={styles.flourishLine} />
          <span style={styles.flourishDiamond} />
          <span style={styles.flourishLine} />
        </div>
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
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={{ ...styles.loginBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
            {busy ? <Spinner size={20} color={colors.white} /> : 'Sign In'}
          </button>
        </form>

        <p style={styles.signupRow}>
          New here? <Link to="/signup" style={styles.signupLink}>Create an account</Link>
        </p>

        {isLocalMode && (
          <div style={styles.noticeBox}>
            <p style={styles.noticeTitle}>Local mode</p>
            <p style={styles.noticeText}>
              Supabase isn't configured, so data stays on this device. Add your Supabase keys
              to enable secure cloud accounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.cream, overflow: 'auto' },
  topSection: {
    background: `linear-gradient(160deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    padding: 'calc(env(safe-area-inset-top, 0px) + 60px) 24px 40px',
    textAlign: 'center',
    flexShrink: 0,
    borderBottom: `2px solid ${colors.gold}`,
  },
  brand: { fontFamily: font.script, fontSize: '92px', fontWeight: 400, color: colors.white, letterSpacing: '1px', margin: 0, lineHeight: 1.05 },
  tagline: { fontFamily: font.brand, fontSize: '15px', fontStyle: 'italic', color: colors.goldBright, marginTop: '16px' },
  flourish: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '18px' },
  flourishLine: { width: '46px', height: '1.5px', background: colors.gold, opacity: 0.85 },
  flourishDiamond: { width: '8px', height: '8px', background: colors.gold, transform: 'rotate(45deg)' },
  formSection: { flex: 1, padding: '34px 30px', overflow: 'auto' },
  welcome: { fontFamily: font.brand, fontSize: '30px', fontWeight: 800, color: colors.brg, margin: '0 0 4px' },
  subtitle: { fontSize: '15px', color: colors.gray, marginBottom: '30px' },
  inputGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: colors.gray, marginBottom: '6px', letterSpacing: '0.5px' },
  input: {
    width: '100%',
    border: `1.5px solid ${colors.lightGray}`,
    borderRadius: radius.md,
    padding: '14px 16px',
    fontSize: '16px',
    color: colors.dark,
    background: colors.offWhite,
    boxSizing: 'border-box',
  },
  error: { color: colors.red, fontSize: '14px', marginBottom: '10px' },
  loginBtn: {
    width: '100%',
    background: `linear-gradient(160deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    color: colors.white,
    border: `1.5px solid ${colors.goldBright}`,
    borderRadius: radius.md,
    padding: '16px',
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(15,42,36,0.25)',
  },
  signupRow: { textAlign: 'center', marginTop: '22px', fontSize: '15px', color: colors.gray },
  signupLink: { color: colors.brg, fontWeight: 700, textDecoration: 'underline', textDecorationColor: colors.gold, textUnderlineOffset: '3px' },
  noticeBox: { marginTop: '30px', padding: '16px', background: colors.brgLight, borderRadius: radius.md, border: `1px solid ${colors.brg20}` },
  noticeTitle: { fontSize: '13px', fontWeight: 700, color: colors.brg, marginBottom: '4px', letterSpacing: '0.5px' },
  noticeText: { fontSize: '13px', color: colors.brg, lineHeight: '18px' },
};
