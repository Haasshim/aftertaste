import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { colors, font, radius } from '../theme/theme';

export default function SignupScreen() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter an email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: authError, needsConfirmation } = await signUp(email, password);
    if (authError) {
      setError(authError.message || 'Could not create your account. Please try again.');
      setBusy(false);
      return;
    }
    if (needsConfirmation) {
      setConfirmSent(true);
      setBusy(false);
      return;
    }
    navigate('/home', { replace: true });
  };

  if (confirmSent) {
    return (
      <div style={styles.container}>
        <div style={styles.topSection}>
          <h1 style={styles.brand}>Aftertaste</h1>
        </div>
        <div style={styles.formSection}>
          <h2 style={styles.welcome}>Check your inbox</h2>
          <p style={styles.subtitle}>
            We sent a confirmation link to {email}. Tap it to activate your account, then sign in.
          </p>
          <Link to="/login" style={styles.backLink}>Back to sign in</Link>
        </div>
      </div>
    );
  }

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
        <h2 style={styles.welcome}>Create account</h2>
        <p style={styles.subtitle}>Start your food journal</p>

        <form onSubmit={handleSignup}>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>CONFIRM PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={{ ...styles.signupBtn, opacity: busy ? 0.7 : 1 }} disabled={busy}>
            {busy ? <Spinner size={20} color={colors.white} /> : 'Create Account'}
          </button>
        </form>

        <p style={styles.loginRow}>
          Already have an account? <Link to="/login" style={styles.loginLink}>Sign in</Link>
        </p>
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
  subtitle: { fontSize: '15px', color: colors.gray, marginBottom: '30px', lineHeight: '22px' },
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
  signupBtn: {
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
  loginRow: { textAlign: 'center', marginTop: '22px', fontSize: '15px', color: colors.gray },
  loginLink: { color: colors.brg, fontWeight: 700, textDecoration: 'underline', textDecorationColor: colors.gold, textUnderlineOffset: '3px' },
  backLink: { color: colors.brg, fontWeight: 700, textDecoration: 'underline', textDecorationColor: colors.gold, textUnderlineOffset: '3px', fontSize: '15px' },
};
