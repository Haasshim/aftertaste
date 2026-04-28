import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { STAMPS } from '../utils/constants';
import { deleteLog } from '../utils/storage';
import restaurants from '../data/restaurants';

export default function DishDetailScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const log = state?.log;

  if (!log) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No log data</div>;
  }

  const restaurant = restaurants.find((r) => r.id === log.restaurantId);
  const getStamp = (id) => STAMPS.find((s) => s.id === id);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRatingColor = () => {
    if (log.rating <= 3) return '#C0392B';
    if (log.rating <= 5) return '#E67E22';
    if (log.rating <= 7) return '#D4A843';
    return '#004225';
  };

  const getRatingLabel = () => {
    if (log.rating <= 2) return 'Disappointing';
    if (log.rating <= 4) return 'Below Average';
    if (log.rating <= 5) return 'Average';
    if (log.rating <= 6) return 'Decent';
    if (log.rating <= 7) return 'Good';
    if (log.rating <= 8) return 'Great';
    if (log.rating <= 9) return 'Excellent';
    return 'Outstanding!';
  };

  const handleDelete = async () => {
    if (window.confirm(`Remove your log for ${log.dishName}?`)) {
      await deleteLog(log.id);
      navigate('/home');
    }
  };

  const color = getRatingColor();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={styles.headerTitle}>Dish Log</h2>
        <button style={styles.deleteBtn} onClick={handleDelete}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>

      <div style={styles.body}>
        {/* Rating Hero */}
        <div style={styles.ratingHero}>
          <div style={{ ...styles.ratingCircle, borderColor: color }}>
            <span style={{ ...styles.ratingNum, color }}>{log.rating}</span>
            <span style={styles.ratingOut}>/10</span>
          </div>
          <p style={{ ...styles.ratingLabel, color }}>{getRatingLabel()}</p>
        </div>

        {/* Dish info */}
        <div style={styles.dishSection}>
          <h2 style={styles.dishName}>{log.dishName}</h2>
          <p style={styles.dishCat}>{log.dishCategory}</p>
        </div>

        {/* Restaurant */}
        <div style={styles.infoRow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2">
            <path d="M3 7c0-1.1.9-2 2-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            <path d="M8 12h8M8 16h4"/>
          </svg>
          <div style={{ marginLeft: '12px' }}>
            <p style={styles.infoTitle}>{restaurant?.name || log.restaurantName}</p>
            <p style={styles.infoSub}>{restaurant?.location || ''}</p>
          </div>
        </div>

        {/* Date */}
        <div style={{ ...styles.infoRow, marginTop: '2px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style={{ marginLeft: '12px' }}>
            <p style={styles.infoTitle}>{formatDate(log.date)}</p>
            <p style={styles.infoSub}>{log.day}</p>
          </div>
        </div>

        {/* Stamps */}
        {log.stamps?.length > 0 && (
          <div style={styles.stampSection}>
            <p style={styles.sectionLabel}>STAMPS</p>
            <div style={styles.stampRow}>
              {log.stamps.map((stampId) => {
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
          </div>
        )}

        {/* Comments */}
        {log.comment && (
          <div style={styles.commentSection}>
            <p style={styles.sectionLabel}>YOUR NOTES</p>
            <div style={styles.commentBox}>
              <p style={styles.commentText}>"{log.comment}"</p>
            </div>
          </div>
        )}

        {/* Photos */}
        {log.photos?.length > 0 && (
          <div style={styles.attachmentSection}>
            <p style={styles.sectionLabel}>PHOTOS</p>
            <div style={styles.photoGrid}>
              {log.photos.map((photo, i) => (
                <img key={i} src={photo.data} alt={photo.name} style={styles.detailPhoto} />
              ))}
            </div>
          </div>
        )}

        {/* Voice Clips */}
        {log.voiceClips?.length > 0 && (
          <div style={styles.attachmentSection}>
            <p style={styles.sectionLabel}>VOICE NOTES</p>
            <div style={styles.voiceList}>
              {log.voiceClips.map((clip, i) => (
                <div key={i} style={styles.voiceRow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  </svg>
                  <audio controls src={clip.data} style={styles.detailAudio} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {log.links?.length > 0 && (
          <div style={styles.attachmentSection}>
            <p style={styles.sectionLabel}>LINKS</p>
            <div style={styles.linksList}>
              {log.links.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  <span style={styles.detailLinkText}>{url}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#F8F8F6',
  },
  header: {
    background: '#004225',
    padding: '50px 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0,
  },
  deleteBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  body: {
    flex: 1,
    overflow: 'auto',
  },
  ratingHero: {
    background: '#FFF',
    padding: '30px',
    textAlign: 'center',
  },
  ratingCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    border: '4px solid',
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#F8F8F6',
  },
  ratingNum: {
    fontSize: '48px',
    fontWeight: 800,
  },
  ratingOut: {
    fontSize: '16px',
    color: '#9E9E9E',
    marginTop: '-6px',
  },
  ratingLabel: {
    fontSize: '18px',
    fontWeight: 700,
    marginTop: '12px',
  },
  dishSection: {
    background: '#FFF',
    padding: '0 20px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #F8F8F6',
  },
  dishName: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: 0,
  },
  dishCat: {
    fontSize: '14px',
    color: '#9E9E9E',
    marginTop: '4px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    background: '#FFF',
    marginTop: '10px',
    padding: '18px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  infoSub: {
    fontSize: '13px',
    color: '#6B6B6B',
    marginTop: '2px',
  },
  stampSection: {
    background: '#FFF',
    marginTop: '10px',
    padding: '18px',
  },
  sectionLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#6B6B6B',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  stampRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stampChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
  },
  commentSection: {
    background: '#FFF',
    marginTop: '10px',
    padding: '18px',
  },
  commentBox: {
    background: '#FFF8F0',
    padding: '16px',
    borderRadius: '12px',
    borderLeft: '4px solid #004225',
  },
  commentText: {
    fontSize: '16px',
    color: '#1A1A1A',
    fontStyle: 'italic',
    lineHeight: '24px',
    margin: 0,
  },
  attachmentSection: {
    background: '#FFF',
    marginTop: '10px',
    padding: '18px',
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  detailPhoto: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  voiceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  voiceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#F8F8F6',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  detailAudio: {
    flex: 1,
    height: '36px',
  },
  linksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#F8F8F6',
    borderRadius: '10px',
    padding: '12px 14px',
    textDecoration: 'none',
  },
  detailLinkText: {
    flex: 1,
    fontSize: '14px',
    color: '#004225',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
