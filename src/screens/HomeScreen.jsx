import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRatingType } from '../context/RatingTypeContext';
import { getDishLogs } from '../lib/dataClient';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OfflineBanner from '../components/OfflineBanner';
import { colors, font, radius, shadow, space, ratingColor, ratingLabel } from '../theme/theme';

const RATING_TYPES = {
  '3facet': 'Multiple Factors (Taste, Ambience, Service)',
  'single_10': 'Single Rating (1-10)',
  'stars_5': '5 Stars',
  '100': 'Out of 100',
};

// Group flat logs into one card per restaurant, newest activity first.
function groupByRestaurant(logs) {
  const groups = new Map();
  for (const log of logs) {
    const key = log.restaurantId || log.restaurantName || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, { key, restaurantId: log.restaurantId, name: log.restaurantName || 'Unknown spot', logs: [] });
    }
    groups.get(key).logs.push(log);
  }
  const list = [...groups.values()];
  for (const g of list) {
    const rated = g.logs.map((l) => l.overall).filter((v) => v != null);
    g.avg = rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null;
    g.latest = g.logs[0]?.date;
    g.dishPreview = [...new Set(g.logs.map((l) => l.dishName))].slice(0, 3);
  }
  list.sort((a, b) => new Date(b.latest) - new Date(a.latest));
  return list;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { ratingType, setRatingType, ratingTypeLabel } = useRatingType();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await getDishLogs());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs, location.key]);

  useEffect(() => {
    const onFocus = () => loadLogs();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadLogs]);

  const groups = useMemo(() => groupByRestaurant(logs), [logs]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Aftertaste</h1>
          <p style={styles.headerSub}>every bite, remembered</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statPill}>
            <span style={styles.statNum}>{logs.length}</span>
            <span style={styles.statLabel}>bites</span>
          </div>
          <div style={styles.statPill}>
            <span style={styles.statNum}>{groups.length}</span>
            <span style={styles.statLabel}>spots</span>
          </div>
          <button
            className="press"
            style={styles.iconBtn}
            aria-label="Settings"
            onClick={() => setShowSettings(true)}
          >
            <Icon name="settings" size={18} color="rgba(255,255,255,0.85)" />
          </button>
          <button
            className="press"
            style={styles.iconBtn}
            aria-label="Sign out"
            onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
          >
            <Icon name="log-out" size={18} color="rgba(255,255,255,0.85)" />
          </button>
        </div>
      </div>

      <OfflineBanner />

      <div style={styles.body}>
        {loading ? (
          <div style={styles.center}><Spinner size={32} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={loadLogs} />
        ) : groups.length === 0 ? (
          <div style={styles.empty} className="fade-up">
            <div style={styles.emptyBlob}>
              <Icon name="menu" size={48} color={colors.racingRed} strokeWidth={1.5} />
            </div>
            <h3 style={styles.emptyTitle}>Nothing logged... yet</h3>
            <p style={styles.emptyText}>
              Hit the + and immortalize your next bite. Future you will thank present you.
            </p>
          </div>
        ) : (
          groups.map((g, i) => (
            <div
              key={g.key}
              className="card-pop fade-up"
              style={{ ...styles.card, animationDelay: `${Math.min(i * 60, 360)}ms` }}
              onClick={() => navigate(`/journal/${encodeURIComponent(g.key)}`, { state: { name: g.name } })}
            >
              <div style={styles.cardTop}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={styles.restName}>{g.name}</h3>
                  <p style={styles.dishPreview}>
                    {g.dishPreview.join(' • ')}
                    {g.logs.length > 3 ? ` +${g.logs.length - 3} more` : ''}
                  </p>
                </div>
                {g.avg != null && (
                  <div style={{ ...styles.avgBadge, background: ratingColor(Math.round(g.avg)) }}>
                    <span style={styles.avgNum}>{g.avg}</span>
                    <span style={styles.avgLabel}>{ratingLabel(Math.round(g.avg))}</span>
                  </div>
                )}
              </div>
              <div style={styles.cardBottom}>
                <span style={styles.countChip}>
                  {g.logs.length} {g.logs.length === 1 ? 'bite' : 'bites'}
                </span>
                <span style={styles.dateText}>last visit {formatDate(g.latest)}</span>
                <Icon name="chevron-right" size={18} color={colors.mediumGray} style={{ marginLeft: 'auto' }} />
              </div>
            </div>
          ))
        )}
      </div>

      <button className="fab-fun" style={styles.fab} aria-label="Log a dish" onClick={() => navigate('/search')}>
        <Icon name="plus" size={30} color={colors.white} strokeWidth={2.5} />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Rating Preferences</h2>
              <button
                style={styles.closeBtn}
                aria-label="Close"
                onClick={() => setShowSettings(false)}
              >
                <Icon name="x" size={24} color={colors.dark} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.settingLabel}>Choose your default rating type:</p>
              <div style={styles.ratingTypeList}>
                {Object.entries(RATING_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    style={{
                      ...styles.ratingTypeBtn,
                      background: ratingType === key ? colors.gold : colors.offWhite,
                      borderColor: ratingType === key ? colors.gold : colors.lightGray,
                      color: ratingType === key ? colors.racingRedDeep : colors.dark,
                    }}
                    onClick={() => {
                      setRatingType(key);
                      setShowSettings(false);
                    }}
                  >
                    {label}
                    {ratingType === key && <span style={styles.checkmark}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: colors.redBlush,
    position: 'relative',
  },
  header: {
    background: `linear-gradient(135deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexShrink: 0,
    borderBottom: `2px solid ${colors.gold}`,
  },
  headerTitle: {
    fontFamily: font.script,
    fontSize: '66px',
    fontWeight: 400,
    color: colors.white,
    letterSpacing: '0.5px',
    margin: 0,
    lineHeight: 1,
  },
  headerSub: { fontSize: '13px', color: colors.goldBright, marginTop: '14px', fontStyle: 'italic', fontFamily: font.brand },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  statPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '6px 12px',
  },
  statNum: { fontSize: '17px', fontWeight: 800, color: colors.white, lineHeight: 1.1 },
  statLabel: { fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' },
  signOutBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  body: { flex: 1, overflow: 'auto', padding: space.lg, paddingBottom: '100px' },
  center: { display: 'flex', justifyContent: 'center', paddingTop: '60px' },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '0 24px',
    gap: '6px',
  },
  emptyBlob: {
    width: '110px',
    height: '110px',
    borderRadius: '42% 58% 55% 45% / 50% 44% 56% 50%',
    background: colors.redTint,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  emptyTitle: { fontFamily: font.brand, fontSize: '24px', fontWeight: 700, color: colors.dark, marginTop: '4px' },
  emptyText: { fontSize: '15px', color: colors.gray, lineHeight: '22px' },
  card: {
    background: colors.white,
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '14px',
    boxShadow: shadow.card,
    cursor: 'pointer',
    border: `1px solid ${colors.redTint}`,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  restName: {
    fontFamily: font.brand,
    fontSize: '20px',
    fontWeight: 700,
    color: colors.dark,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dishPreview: {
    fontSize: '13px',
    color: colors.gray,
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  avgBadge: {
    width: '78px',
    height: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    padding: '4px 6px',
    flexShrink: 0,
  },
  avgNum: { fontSize: '19px', fontWeight: 800, color: colors.white, lineHeight: 1.1 },
  avgLabel: { fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.15, marginTop: '2px' },
  cardBottom: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' },
  countChip: {
    background: colors.redTint,
    color: colors.racingRedDeep,
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: radius.pill,
  },
  dateText: { fontSize: '12px', color: colors.mediumGray },
  fab: {
    position: 'absolute',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
    right: '24px',
    width: '62px',
    height: '62px',
    borderRadius: '31px',
    background: `linear-gradient(135deg, ${colors.racingRed} 0%, ${colors.racingRedDeep} 100%)`,
    border: `2px solid ${colors.goldBright}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 6px 18px rgba(15,42,36,0.45)',
    cursor: 'pointer',
    zIndex: 10,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center', // keep the sheet within the phone-frame width
    zIndex: 100,
  },
  modal: {
    background: colors.white,
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: '430px', // match #root so it doesn't span a wide desktop window
    maxHeight: '80dvh',
    overflow: 'auto',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: `1px solid ${colors.lightGray}`,
    position: 'sticky',
    top: 0,
    background: colors.white,
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: colors.dark,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '20px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.dark,
    marginBottom: '12px',
    marginTop: 0,
  },
  ratingTypeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  ratingTypeBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: radius.sm,
    border: '2px solid',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.12s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: '18px',
    fontWeight: 700,
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
  },
};
