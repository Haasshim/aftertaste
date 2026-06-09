import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteLog } from '../lib/dataClient';
import Icon from '../components/Icon';
import StampChip from '../components/StampChip';
import RatingSummary from '../components/RatingSummary';
import Spinner from '../components/Spinner';
import { colors, font, radius } from '../theme/theme';

export default function DishDetailScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const log = state?.log;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!log) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No log data</div>;
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteLog(log.id);
      navigate('/home');
    } catch (e) {
      setError(e?.message || 'Could not delete. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>Dish Log</h2>
        <button style={styles.iconBtn} aria-label="Delete log" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={22} color={colors.white} />
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.ratingHero}>
          <RatingSummary log={log} variant="detail" />
        </div>

        <div style={styles.dishSection}>
          <h2 style={styles.dishName}>{log.dishName}</h2>
          {log.dishCategory && <p style={styles.dishCat}>{log.dishCategory}</p>}
        </div>

        <div style={styles.infoRow}>
          <Icon name="menu" size={18} color={colors.brg} />
          <div style={{ marginLeft: '12px' }}>
            <p style={styles.infoTitle}>{log.restaurantName}</p>
          </div>
        </div>

        <div style={{ ...styles.infoRow, marginTop: '2px' }}>
          <Icon name="calendar" size={18} color={colors.brg} />
          <div style={{ marginLeft: '12px' }}>
            <p style={styles.infoTitle}>{formatDate(log.date)}</p>
            <p style={styles.infoSub}>{log.day}</p>
          </div>
        </div>

        {log.stamps?.length > 0 && (
          <div style={styles.stampSection}>
            <p style={styles.sectionLabel}>STAMPS</p>
            <div style={styles.stampRow}>
              {log.stamps.map((stampId) => (
                <StampChip key={stampId} stampId={stampId} size="md" />
              ))}
            </div>
          </div>
        )}

        {log.comment && (
          <div style={styles.commentSection}>
            <p style={styles.sectionLabel}>YOUR NOTES</p>
            <div style={styles.commentBox}>
              <p style={styles.commentText}>"{log.comment}"</p>
            </div>
          </div>
        )}

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

        {log.voiceClips?.length > 0 && (
          <div style={styles.attachmentSection}>
            <p style={styles.sectionLabel}>VOICE NOTES</p>
            <div style={styles.voiceList}>
              {log.voiceClips.map((clip, i) => (
                <div key={i} style={styles.voiceRow}>
                  <Icon name="mic" size={18} color={colors.brg} />
                  <audio controls src={clip.data} style={styles.detailAudio} />
                </div>
              ))}
            </div>
          </div>
        )}

        {log.links?.length > 0 && (
          <div style={styles.attachmentSection}>
            <p style={styles.sectionLabel}>LINKS</p>
            <div style={styles.linksList}>
              {log.links.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                  <Icon name="link" size={16} color={colors.brg} />
                  <span style={styles.detailLinkText}>{url}</span>
                  <Icon name="external-link" size={14} color={colors.mediumGray} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: '40px' }} />
      </div>

      {confirming && (
        <div style={styles.modalOverlay} onClick={() => !deleting && setConfirming(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Remove this log?</h3>
            <p style={styles.modalText}>
              Your log for "{log.dishName}" will be permanently deleted.
            </p>
            {error && <p style={styles.modalError}>{error}</p>}
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} disabled={deleting} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button style={styles.deleteConfirmBtn} disabled={deleting} onClick={handleDelete}>
                {deleting ? <Spinner size={18} color={colors.white} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.offWhite },
  header: {
    background: colors.brg,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: colors.white, margin: 0 },
  body: { flex: 1, overflow: 'auto' },
  ratingHero: { background: colors.white, padding: '30px' },
  dishSection: { background: colors.white, padding: '0 20px 20px', textAlign: 'center', borderBottom: `1px solid ${colors.offWhite}` },
  dishName: { fontSize: '26px', fontWeight: 800, color: colors.dark, margin: 0 },
  dishCat: { fontSize: '14px', color: colors.mediumGray, marginTop: '4px' },
  infoRow: { display: 'flex', alignItems: 'center', background: colors.white, marginTop: '10px', padding: '18px' },
  infoTitle: { fontSize: '16px', fontWeight: 700, color: colors.dark, margin: 0 },
  infoSub: { fontSize: '13px', color: colors.gray, marginTop: '2px' },
  stampSection: { background: colors.white, marginTop: '10px', padding: '18px' },
  sectionLabel: { fontSize: '13px', fontWeight: 700, color: colors.gray, letterSpacing: '0.5px', marginBottom: '12px' },
  stampRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  commentSection: { background: colors.white, marginTop: '10px', padding: '18px' },
  commentBox: { background: colors.cream, padding: '16px', borderRadius: radius.md, borderLeft: `4px solid ${colors.brg}` },
  commentText: { fontSize: '16px', color: colors.dark, fontStyle: 'italic', lineHeight: '24px', margin: 0 },
  attachmentSection: { background: colors.white, marginTop: '10px', padding: '18px' },
  photoGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  detailPhoto: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' },
  voiceList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  voiceRow: { display: 'flex', alignItems: 'center', gap: '10px', background: colors.offWhite, borderRadius: '10px', padding: '10px 12px' },
  detailAudio: { flex: 1, height: '36px' },
  linksList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  detailLink: { display: 'flex', alignItems: 'center', gap: '10px', background: colors.offWhite, borderRadius: '10px', padding: '12px 14px', textDecoration: 'none' },
  detailLinkText: { flex: 1, fontSize: '14px', color: colors.brg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 50,
  },
  modal: { background: colors.white, borderRadius: radius.lg, padding: '24px', width: '100%', maxWidth: '320px' },
  modalTitle: { fontSize: '19px', fontWeight: 700, color: colors.dark, margin: 0 },
  modalText: { fontSize: '14px', color: colors.gray, marginTop: '8px', lineHeight: '20px' },
  modalError: { fontSize: '13px', color: colors.red, marginTop: '10px' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { flex: 1, background: colors.offWhite, color: colors.dark, border: 'none', borderRadius: radius.md, padding: '13px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  deleteConfirmBtn: { flex: 1, background: colors.red, color: colors.white, border: 'none', borderRadius: radius.md, padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
