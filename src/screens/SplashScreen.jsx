import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    setTimeout(() => setShowSlogan(true), 1200);
    setTimeout(() => navigate('/login'), 3500);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h1
        style={{
          ...styles.title,
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        aftertaste
      </h1>
      <p
        style={{
          ...styles.slogan,
          opacity: showSlogan ? 1 : 0,
        }}
      >
        Remember every bite.
      </p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#004225',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '48px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '2px',
    transition: 'all 1.2s ease',
    margin: 0,
  },
  slogan: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '16px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '12px',
    letterSpacing: '1px',
    transition: 'opacity 0.8s ease',
  },
};
