import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../theme/theme';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [show, setShow] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 100);
    const t2 = setTimeout(() => setShowSlogan(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // After the intro plays, route to home if already signed in, else to login.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => navigate(session ? '/home' : '/login', { replace: true }), 2600);
    return () => clearTimeout(t);
  }, [loading, session, navigate]);

  return (
    <div style={styles.container}>
      <h1 style={{ ...styles.title, opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(30px)' }}>
        Aftertaste
      </h1>
      <p style={{ ...styles.slogan, opacity: showSlogan ? 1 : 0 }}>Remember every bite.</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'var(--app-h)',
    background: colors.brg,
  },
  title: {
    fontFamily: font.script,
    fontSize: '90px',
    fontWeight: 400,
    color: colors.white,
    letterSpacing: '1px',
    transition: 'all 1.2s ease',
    margin: 0,
    lineHeight: 1.1,
  },
  slogan: {
    fontFamily: font.brand,
    fontSize: '16px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '12px',
    letterSpacing: '1px',
    transition: 'opacity 0.8s ease',
  },
};
