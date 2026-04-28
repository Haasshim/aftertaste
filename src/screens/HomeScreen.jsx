import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDishLogs } from '../utils/storage';
import { STAMPS } from '../utils/constants';
import restaurants from '../data/restaurants';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  // Reload logs when navigating back
  useEffect(() => {
    const handleFocus = () => loadLogs();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadLogs = async () => {
    const data = await getDishLogs();
    setLogs(data);
  };

  // reload on route changes
  useEffect(() => {
    loadLogs();
  }, [window.location.pathname]);

  const getRestaurant = (id) => restaurants.find((r) => r.id === id);
  const getStamp = (id) => STAMPS.find((s) => s.id === id);

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
        <div style={styles.logCount}>
          <span style={styles.logNumber}>{logs.length}</span>
          <span style={styles.logLabel}>LOGS</span>
        </div>
      </div>

      <div style={styles.body}>
        {logs.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '64px' }}>&#127869;</div>
            <h3 style={styles.emptyTitle}>No dishes logged yet</h3>
            <p style={styles.emptyText}>
              Tap the + button to log your first dish and start building your food journal.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const restaurant = getRestaurant(log.restaurantId);
            return (
              <div
                key={log.id}
                style={styles.card}
                onClick={() => navigate(`/dish/${log.id}`, { state: { log } })}
              >
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.dishName}>{log.dishName}</h3>
                    <p style={styles.restName}>{restaurant?.name || 'Unknown'}</p>
                  </div>
                  <div style={styles.ratingBadge}>
                    <span style={styles.ratingNum}>{log.rating}</span>
                    <span style={styles.ratingOf}>/10</span>
                  </div>
                </div>

                {log.comment && (
                  <p style={styles.comment}>"{log.comment}"</p>
                )}

                <div style={styles.cardFooter}>
                  <div style={styles.stampRow}>
                    {log.stamps?.map((stampId) => {
                      const stamp = getStamp(stampId);
                      if (!stamp) return null;
                      return (
                        <span
                          key={stampId}
                          style={{
                            ...styles.stampChip,
                            background: stamp.color + '18',
                            color: stamp.color,
                          }}
                        >
                          {stamp.emoji} {stamp.label}
                        </span>
                      );
                    })}
                  </div>
                  <p style={styles.dateText}>{log.day}, {formatDate(log.date)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button style={styles.fab} onClick={() => navigate('/search')}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#F8F8F6',
    position: 'relative',
  },
  header: {
    background: '#004225',
    padding: '50px 24px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#FFF',
    letterSpacing: '1px',
    margin: 0,
  },
  headerSub: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '2px',
  },
  logCount: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logNumber: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#FFF',
  },
  logLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '1px',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    paddingBottom: '100px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '0 20px',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1A1A1A',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '15px',
    color: '#6B6B6B',
    lineHeight: '22px',
  },
  card: {
    background: '#FFF',
    borderRadius: '16px',
    padding: '18px',
    marginBottom: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  restName: {
    fontSize: '14px',
    color: '#6B6B6B',
    marginTop: '2px',
  },
  ratingBadge: {
    background: '#004225',
    padding: '6px 12px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'baseline',
    marginLeft: '12px',
    flexShrink: 0,
  },
  ratingNum: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#FFF',
  },
  ratingOf: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: '1px',
  },
  comment: {
    fontSize: '14px',
    color: '#6B6B6B',
    fontStyle: 'italic',
    marginTop: '10px',
    lineHeight: '20px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    marginTop: '12px',
  },
  stampRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '8px',
  },
  stampChip: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  dateText: {
    fontSize: '12px',
    color: '#9E9E9E',
  },
  fab: {
    position: 'absolute',
    bottom: '30px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    background: '#004225',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 10,
  },
};
