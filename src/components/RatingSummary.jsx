import React from 'react';
import { colors, ratingColor, ratingLabel } from '../theme/theme';
import { RATING_FACETS } from './RatingInput';

// Read-only rating display.
//  variant="badge"   -> compact overall pill (HomeScreen cards)
//  variant="detail"  -> large circle + per-facet breakdown (DishDetailScreen)
// `log` may carry facet fields (taste/value/...) and/or `overall`.
export default function RatingSummary({ log, variant = 'badge' }) {
  const overall = log.overall ?? log.rating ?? null; // rating = legacy single score
  const c = ratingColor(overall);

  if (variant === 'badge') {
    return (
      <div style={{ ...styles.badge, background: c }}>
        <span style={styles.badgeNum}>{overall ?? '–'}</span>
        <span style={styles.badgeOf}>/10</span>
      </div>
    );
  }

  const facets = RATING_FACETS.map((f) => ({ ...f, score: log[f.key] })).filter(
    (f) => f.score != null && f.score > 0
  );

  return (
    <div style={styles.detailWrap}>
      <div style={{ ...styles.circle, borderColor: c }}>
        <span style={{ ...styles.circleNum, color: c }}>{overall ?? '–'}</span>
        <span style={styles.circleOf}>/10</span>
      </div>
      <p style={{ ...styles.circleLabel, color: colors.goldBright }}>{ratingLabel(overall)}</p>

      {facets.length > 0 && (
        <div style={styles.facetList}>
          {facets.map((f) => (
            <div key={f.key} style={styles.facetRow}>
              <span style={styles.facetLabel}>{f.label}</span>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${f.score * 10}%`,
                    background: colors.goldBright,
                  }}
                />
              </div>
              <span style={{ ...styles.facetScore, color: colors.white }}>
                {f.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  badge: {
    padding: '6px 12px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  badgeNum: { fontSize: '20px', fontWeight: 800, color: colors.white },
  badgeOf: { fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginLeft: '1px' },

  detailWrap: { textAlign: 'center' },
  circle: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    border: '4px solid',
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: colors.offWhite,
  },
  circleNum: { fontSize: '48px', fontWeight: 800, lineHeight: 1 },
  circleOf: { fontSize: '16px', color: colors.mediumGray, marginTop: '2px' },
  circleLabel: { fontSize: '18px', fontWeight: 700, marginTop: '12px' },

  facetList: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    maxWidth: '320px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  facetRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  facetLabel: { fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', width: '90px', flexShrink: 0 },
  barTrack: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: '4px' },
  facetScore: { fontSize: '13px', fontWeight: 700, width: '20px', textAlign: 'right', flexShrink: 0 },
};
