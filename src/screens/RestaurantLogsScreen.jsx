import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDishLogs } from '../lib/dataClient';
import Icon from '../components/Icon';
import StampChip from '../components/StampChip';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OfflineBanner from '../components/OfflineBanner';
import { colors, font, radius, shadow, ratingColor, ratingLabel } from '../theme/theme';

// All of the user's logs at one restaurant, grouped under date headings —
// the "your history at this place" view reached from the Home journal.
export default function RestaurantLogsScreen() {
  const { restaurantKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const key = decodeURIComponent(restaurantKey || '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getDishLogs();
      setLogs(all.filter((l) => (l.restaurantId || l.restaurantName || 'unknown') === key));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const name = location.state?.name || logs[0]?.restaurantName || 'Restaurant';

  const avg = useMemo(() => {
    const rated = logs.map((l) => l.overall).filter((v) => v != null);
    return rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null;
  }, [logs]);

  // Group logs by calendar day so visits read as diary entries.
  const days = useMemo(() => {
    const map = new Map();
    for (const log of logs) {
      const d = new Date(log.date);
      const dayKey = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(log);
    }
    return [...map.entries()];
  }, [logs]);

  const restaurantId = logs[0]?.restaurantId;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button className="press" style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>{name}</h2>
        <div style={{ width: '40px' }} />
      </div>

      <OfflineBanner />

      {loading ? (
        <div style={styles.center}><Spinner size={32} /></div>
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : (
        <div style={styles.body}>
          {/* Hero summary */}
          <div style={styles.hero} className="fade-up">
            <h2 style={styles.heroName}>{name}</h2>
            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{logs.length}</span>
                <span style={styles.heroStatLabel}>{logs.length === 1 ? 'bite logged' : 'bites logged'}</span>
              </div>
              {avg != null && (
                <div style={styles.heroStat}>
                  <span style={styles.heroStatNum}>{avg}</span>
                  <span style={styles.heroStatLabel}>{ratingLabel(Math.round(avg))}</span>
                </div>
              )}
            </div>
          </div>

          {days.map(([day, dayLogs], di) => (
            <div key={day} className="fade-up" style={{ animationDelay: `${Math.min(di * 70, 350)}ms` }}>
              <div style={styles.dayRow}>
                <span style={styles.dayDot} />
                <p style={styles.dayLabel}>{day}</p>
              </div>
              {dayLogs.map((log) => (
                <div
                  key={log.id}
                  className="card-pop"
                  style={styles.card}
                  onClick={() => navigate(`/dish/${log.id}`, { state: { log } })}
                >
                  <div style={styles.cardHead}>
                    <h3 style={styles.dishName}>{log.dishName}</h3>
                    {log.overall != null && (
                      <div style={{ ...styles.badge, background: ratingColor(log.overall) }}>
                        <span style={styles.badgeNum}>{log.overall}</span>
                        <span style={styles.badgeOf}>/10</span>
                      </div>
                    )}
                  </div>
                  {log.overall != null && (
                    <p style={{ ...styles.verdict, color: ratingColor(log.overall) }}>{ratingLabel(log.overall)}</p>
                  )}
                  {log.comment && <p style={styles.comment}>"{log.comment}"</p>}
                  {log.stamps?.length > 0 && (
                    <div style={styles.stampRow}>
                      {log.stamps.map((s) => <StampChip key={s} stampId={s} size="sm" />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {logs.length === 0 && (
            <div style={styles.empty}>
              <p style={{ color: colors.gray }}>No bites here yet.</p>
            </div>
          )}

          {restaurantId && (
            <button
              className="press"
              style={styles.logAgainBtn}
              onClick={() => navigate(`/restaurant/${restaurantId}`)}
            >
              <Icon name="plus" size={16} color={colors.white} style={{ marginRight: '6px' }} />
              Log another bite here
            </button>
          )}

          <div style={{ height: '40px' }} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.redBlush },
  header: {
    background: `linear-gradient(135deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderBottom: `2px solid ${colors.gold}`,
  },
  iconBtn: { width: '40px', height: '40px', borderRadius: '20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  headerTitle: { fontSize: '17px', fontWeight: 700, color: colors.white, margin: 0, flex: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  center: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, overflow: 'auto', padding: '16px' },
  hero: {
    background: `linear-gradient(135deg, ${colors.racingRed} 0%, ${colors.racingRedDeep} 100%)`,
    borderRadius: '20px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 6px 18px rgba(15,42,36,0.35)',
    border: `1.5px solid ${colors.gold}`,
    textAlign: 'center',
  },
  heroName: { fontFamily: font.brand, fontSize: '25px', fontWeight: 800, color: colors.white, margin: 0 },
  heroStats: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' },
  heroStat: { width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroStatNum: { fontSize: '28px', fontWeight: 800, color: colors.goldBright, lineHeight: 1.1 },
  heroStatLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px', fontWeight: 600 },
  dayRow: { display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 2px 10px' },
  dayDot: { width: '8px', height: '8px', borderRadius: '4px', background: colors.racingRed, flexShrink: 0 },
  dayLabel: { fontSize: '13px', fontWeight: 700, color: colors.racingRedDeep, margin: 0, letterSpacing: '0.3px' },
  card: {
    background: colors.white,
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: shadow.card,
    border: `1px solid ${colors.redTint}`,
    cursor: 'pointer',
  },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' },
  dishName: { fontSize: '17px', fontWeight: 700, color: colors.dark, margin: 0 },
  badge: { display: 'flex', alignItems: 'baseline', borderRadius: '10px', padding: '4px 10px', flexShrink: 0 },
  badgeNum: { fontSize: '16px', fontWeight: 800, color: colors.white },
  badgeOf: { fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginLeft: '1px' },
  verdict: { fontSize: '13px', fontWeight: 700, marginTop: '4px' },
  comment: { fontSize: '13px', color: colors.gray, fontStyle: 'italic', marginTop: '8px', lineHeight: '19px' },
  stampRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' },
  empty: { textAlign: 'center', padding: '40px 0' },
  logAgainBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    maxWidth: '100%',
    margin: '32px auto 0',
    background: `linear-gradient(135deg, ${colors.racingRed} 0%, ${colors.racingRedDeep} 100%)`,
    color: colors.white,
    border: `1.5px solid ${colors.goldBright}`,
    borderRadius: radius.pill,
    padding: '14px 30px',
    fontSize: '15px',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(15,42,36,0.3)',
  },
};
