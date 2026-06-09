import React from 'react';
import { colors, radius, ratingColor, ratingLabel } from '../theme/theme';

// The three rating facets. `key` matches the dish_logs columns / save payload.
export const RATING_FACETS = [
  { key: 'taste', label: 'Taste' },
  { key: 'ambience', label: 'Ambience' },
  { key: 'service', label: 'Service' },
];

// Compute the overall score as the rounded mean of the facets that were rated.
// Returns null when nothing is rated yet.
export function computeOverall(facets) {
  const vals = RATING_FACETS.map((f) => facets?.[f.key]).filter((v) => v != null && v > 0);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Multi-dimensional rating editor. `value` is { taste, ambience, service }
// (each 1-10 or undefined); `onChange` receives the updated object. Each facet
// is a 1-10 scale of tappable number buttons.
export default function RatingInput({ value = {}, onChange }) {
  const overall = computeOverall(value);

  const setFacet = (key, n) => onChange({ ...value, [key]: n });

  return (
    <div role="group" aria-label="Dish rating">
      {/* Overall readout */}
      <div style={styles.overallRow}>
        <div style={{ ...styles.overallBadge, borderColor: ratingColor(overall) }}>
          <span style={{ ...styles.overallNum, color: ratingColor(overall) }}>
            {overall ?? '–'}
          </span>
          <span style={styles.overallOf}>/10</span>
        </div>
        <div>
          <p style={styles.overallLabelSmall}>Overall</p>
          <p style={{ ...styles.overallLabel, color: ratingColor(overall) }}>
            {ratingLabel(overall)}
          </p>
        </div>
      </div>

      {RATING_FACETS.map((facet) => {
        const score = value[facet.key] || 0;
        const c = ratingColor(score || null);
        return (
          <div key={facet.key} style={styles.facetRow} role="group" aria-label={facet.label}>
            <div style={styles.facetHead}>
              <span style={styles.facetLabel}>{facet.label}</span>
              <span style={{ ...styles.facetScore, color: score ? c : colors.mediumGray }}>
                {score ? `${score}/10` : 'Not rated'}
              </span>
            </div>
            <div style={styles.scaleRow}>
              {SCALE.map((n) => {
                const selected = score === n;
                const filled = score >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${facet.label} ${n} out of 10`}
                    aria-pressed={selected}
                    onClick={() => setFacet(facet.key, n)}
                    style={{
                      ...styles.scaleBtn,
                      background: selected ? colors.brg : filled ? colors.brg20 : colors.offWhite,
                      color: selected ? colors.white : filled ? colors.brg : colors.mediumGray,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  overallRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '22px',
  },
  overallBadge: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.offWhite,
    flexShrink: 0,
  },
  overallNum: { fontSize: '34px', fontWeight: 800, lineHeight: 1 },
  overallOf: { fontSize: '12px', color: colors.mediumGray, marginTop: '2px' },
  overallLabelSmall: {
    fontSize: '12px',
    fontWeight: 700,
    color: colors.mediumGray,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    margin: 0,
  },
  overallLabel: { fontSize: '20px', fontWeight: 700, margin: '2px 0 0' },
  facetRow: { marginBottom: '18px' },
  facetHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  },
  facetLabel: { fontSize: '15px', fontWeight: 600, color: colors.dark },
  facetScore: { fontSize: '14px', fontWeight: 700 },
  scaleRow: {
    display: 'flex',
    gap: '5px',
    justifyContent: 'space-between',
  },
  scaleBtn: {
    flex: 1,
    minWidth: 0,
    height: '36px',
    borderRadius: radius.sm,
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s',
    padding: 0,
  },
};
