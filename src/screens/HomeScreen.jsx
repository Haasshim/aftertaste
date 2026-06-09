import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDishLogs } from '../lib/dataClient';
import Icon from '../components/Icon';
import StampChip from '../components/StampChip';
import RatingSummary from '../components/RatingSummary';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OfflineBanner from '../components/OfflineBanner';
import { colors, font, radius, shadow, space } from '../theme/theme';

export default function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDishLogs();
      setLogs(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload on mount and whenever we navigate back to Home (location.key changes
  // on every navigation, unlike window.location.pathname under HashRouter).
  useEffect(() => {
    loadLogs();
  }, [loadLogs, location.key]);

  useEffect(() => {
    const onFocus = () => loadLogs();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadLogs]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>aftertaste</h1>
          <p style={styles.headerSub}>Your Food Journal</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.logCount}>
            <span style={styles.logNumber}>{logs.length}</span>
            <span style={styles.logLabel}>LOGS</span>
          </div>
          <button
            style={styles.signOutBtn}
            aria-label="Sign out"
            onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
          >
            <Icon name="log-out" size={20} color="rgba(255,255,255,0.85)" />
          </button>
        </div>
      </div>

      <OfflineBanner />

      <div style={styles.body}>
        {loading ? (
          <div style={styles.center}>
            <Spinner size={32} />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={loadLogs} />
        ) : logs.length === 0 ? (
          <div style={styles.empty}>
            <Icon name="menu" size={56} color={colors.mediumGray} strokeWidth={1.5} />
            <h3 style={styles.emptyTitle}>No dishes logged yet</h3>
            <p style={styles.emptyText}>
              Tap the + button to log your first dish and start building your food journal.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={styles.card}
              onClick={() => navigate(`/dish/${log.id}`, { state: { log } })}
            >
              <div style={styles.cardHeader}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={styles.dishName}>{log.dishName}</h3>
                  <p style={styles.restName}>{log.restaurantName || 'Unknown'}</p>
                </div>
                <div style={{ marginLeft: space.md }}>
                  <RatingSummary log={log} variant="badge" />
                </div>
              </div>

              {log.comment && <p style={styles.comment}>"{log.comment}"</p>}

              <div style={styles.cardFooter}>
                {log.stamps?.length > 0 && (
                  <div style={styles.stampRow}>
                    {log.stamps.map((stampId) => (
                      <StampChip key={stampId} stampId={stampId} size="sm" />
                    ))}
                  </div>
                )}
                <p style={styles.dateText}>
                  {log.day}, {formatDate(log.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <button style={styles.fab} aria-label="Log a dish" onClick={() => navigate('/search')}>
        <Icon name="plus" size={30} color={colors.white} strokeWidth={2.5} />
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: colors.offWhite,
    position: 'relative',
  },
  header: {
    background: colors.brg,
    padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 24px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: font.brand,
    fontSize: '28px',
    fontWeight: 700,
    color: colors.white,
    letterSpacing: '1px',
    margin: 0,
  },
  headerSub: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  signOutBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '19px',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  logCount: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logNumber: { fontSize: '24px', fontWeight: 700, color: colors.white },
  logLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' },
  body: { flex: 1, overflow: 'auto', padding: space.lg, paddingBottom: '100px' },
  center: { display: 'flex', justifyContent: 'center', paddingTop: '60px' },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '0 20px',
    gap: '6px',
  },
  emptyTitle: { fontSize: '22px', fontWeight: 700, color: colors.dark, marginTop: '8px' },
  emptyText: { fontSize: '15px', color: colors.gray, lineHeight: '22px' },
  card: {
    background: colors.white,
    borderRadius: radius.lg,
    padding: '18px',
    marginBottom: '14px',
    boxShadow: shadow.card,
    cursor: 'pointer',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  dishName: {
    fontSize: '18px',
    fontWeight: 700,
    color: colors.dark,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  restName: { fontSize: '14px', color: colors.gray, marginTop: '2px' },
  comment: {
    fontSize: '14px',
    color: colors.gray,
    fontStyle: 'italic',
    marginTop: '10px',
    lineHeight: '20px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: { marginTop: '12px' },
  stampRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  dateText: { fontSize: '12px', color: colors.mediumGray },
  fab: {
    position: 'absolute',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    background: colors.brg,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: shadow.float,
    cursor: 'pointer',
    zIndex: 10,
  },
};
