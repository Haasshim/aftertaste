import React from 'react';
import { colors, radius, ratingColor, ratingLabel } from '../theme/theme';

// The three rating facets. `key` matches the dish_logs columns / save payload.
export const RATING_FACETS = [
  { key: 'taste', label: 'Taste' },
  { key: 'ambience', label: 'Ambience' },
  { key: 'service', label: 'Service' },
];

// Compute the overall score for different rating types and normalize to 0-10
export function computeOverall(value, ratingType = '3facet') {
  if (ratingType === '3facet') {
    const vals = RATING_FACETS.map((f) => value?.[f.key]).filter((v) => v != null && v > 0);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  } else if (ratingType === 'single_10') {
    const score = value?.score;
    return score ? score : null;
  } else if (ratingType === 'stars_5') {
    const stars = value?.stars;
    if (!stars) return null;
    // Normalize 5-star scale to 0-10: stars * 2 (5 stars = 10, 4.5 = 9)
    return Math.round(stars * 2);
  } else if (ratingType === '100') {
    const score = value?.score;
    return score ? Math.round(score / 10) : null;
  }
  return null;
}

const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Native per-log readout — shows the rating in the unit it was given, with NO
// cross-type conversion. `value` is the editor state ({stars} / {score} /
// facets). Returns { num, unit } e.g. { num: 4, unit: '/5' }.
export function nativeReadout(value, ratingType) {
  switch (ratingType) {
    case 'stars_5': return { num: value?.stars ?? null, unit: '/5' };
    case '100': return { num: value?.score ?? null, unit: '/100' };
    case 'single_10': return { num: value?.score ?? null, unit: '/10' };
    default: return { num: computeOverall(value, '3facet'), unit: '/10' };
  }
}

// Same idea but for a saved log row (carries ratingType + ratingValue/overall).
export function logReadout(log) {
  switch (log?.ratingType) {
    case 'stars_5': return { num: log.ratingValue ?? log.stars ?? null, unit: '/5' };
    case '100': return { num: log.ratingValue ?? log.score ?? null, unit: '/100' };
    case 'single_10': return { num: log.ratingValue ?? log.score ?? null, unit: '/10' };
    default: return { num: log?.overall ?? log?.rating ?? null, unit: '/10' };
  }
}

// Star rating, touch-first, WHOLE stars only (1-5, no halves). Tap a star to
// set that rating; tap it again to clear. Works identically on phone & web.
function StarRating({ value = 0, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={styles.starsContainer} role="group" aria-label="Star rating">
      {stars.map((star) => {
        const filled = value >= star;
        return (
          <button
            key={star}
            type="button"
            className="press"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={filled}
            onClick={() => onChange(value === star ? 0 : star)}
            style={{
              ...styles.starBtn,
              color: filled ? colors.gold : colors.lightGray,
            }}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}

// 0-100 rating, touch-first: a drag slider with a large live readout. Sliders
// are the standard mobile control for a wide numeric range — no keyboard, no
// modal, no precise tapping required.
function NumericInput({ value = 0, max = 100, onChange }) {
  const c = ratingColor(computeNormalized(value, max));
  return (
    <div style={styles.sliderBlock}>
      <div style={{ ...styles.numericDisplay, color: c }}>
        <span style={styles.numericValue}>{value || 0}</span>
        <span style={styles.numericMax}>/{max}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step="1"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Rating out of ${max}`}
        style={{ ...styles.slider, accentColor: c }}
      />
    </div>
  );
}

function computeNormalized(value, max) {
  if (!value) return null;
  return Math.round((value / max) * 10);
}

// Multi-dimensional rating editor. `value` is { taste, ambience, service }
// (each 1-10 or undefined); `onChange` receives the updated object. Each facet
// is a 1-10 scale of tappable number buttons.
export default function RatingInput({ value = {}, onChange, ratingType = '3facet' }) {
  const overall = computeOverall(value, ratingType);

  const setFacet = (key, n) => onChange({ ...value, [key]: n });
  const setValue = (key, n) => onChange({ ...value, [key]: n });

  // `overall` (normalized 0-10) drives only the color + qualitative label.
  // The displayed NUMBER is always native to the chosen rating type.
  const readout = nativeReadout(value, ratingType);

  return (
    <div role="group" aria-label="Dish rating">
      {/* Overall readout — shown in the rating's own unit, no conversion */}
      <div style={styles.overallRow}>
        <div key={readout.num} className="pop-in" style={{ ...styles.overallBadge, borderColor: ratingColor(overall) }}>
          <span style={{ ...styles.overallNum, color: ratingColor(overall) }}>
            {readout.num ?? '–'}
          </span>
          <span style={styles.overallOf}>{readout.unit}</span>
        </div>
        <div>
          <p style={styles.overallLabelSmall}>Overall</p>
          <p style={{ ...styles.overallLabel, color: ratingColor(overall) }}>
            {ratingLabel(overall)}
          </p>
        </div>
      </div>

      {ratingType === '3facet' && (
        <>
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
                        className="press"
                        aria-label={`${facet.label} ${n} out of 10`}
                        aria-pressed={selected}
                        onClick={() => setFacet(facet.key, n)}
                        style={{
                          ...styles.scaleBtn,
                          background: selected ? c : filled ? `${c}33` : colors.offWhite,
                          color: selected ? colors.white : filled ? c : colors.mediumGray,
                          transform: selected ? 'scale(1.12)' : 'none',
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
        </>
      )}

      {ratingType === 'single_10' && (
        <div style={styles.facetRow} role="group" aria-label="Restaurant rating">
          <div style={styles.facetHead}>
            <span style={styles.facetLabel}>Restaurant Rating</span>
            <span style={{ ...styles.facetScore, color: value.score ? ratingColor(value.score) : colors.mediumGray }}>
              {value.score ? `${value.score}/10` : 'Not rated'}
            </span>
          </div>
          <div style={styles.scaleRow}>
            {SCALE.map((n) => {
              const selected = value.score === n;
              const filled = value.score >= n;
              const c = ratingColor(value.score || null);
              return (
                <button
                  key={n}
                  type="button"
                  className="press"
                  aria-label={`Rating ${n} out of 10`}
                  aria-pressed={selected}
                  onClick={() => setValue('score', n)}
                  style={{
                    ...styles.scaleBtn,
                    background: selected ? c : filled ? `${c}33` : colors.offWhite,
                    color: selected ? colors.white : filled ? c : colors.mediumGray,
                    transform: selected ? 'scale(1.12)' : 'none',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ratingType === 'stars_5' && (
        <div style={styles.facetRow} role="group" aria-label="Star rating">
          <div style={styles.facetHead}>
            <span style={styles.facetLabel}>Star Rating</span>
            <span style={{ ...styles.facetScore, color: value.stars ? ratingColor(computeOverall(value, 'stars_5')) : colors.mediumGray }}>
              {value.stars ? `${value.stars}/5 stars` : 'Not rated'}
            </span>
          </div>
          <div style={styles.starInputContainer}>
            <StarRating value={value.stars} onChange={(stars) => setValue('stars', stars)} />
            <span style={styles.starHint}>Tap a star to rate. Tap it again to clear.</span>
          </div>
        </div>
      )}

      {ratingType === '100' && (
        <div style={styles.facetRow} role="group" aria-label="Numeric rating">
          <div style={styles.facetHead}>
            <span style={styles.facetLabel}>Rating</span>
            <span style={{ ...styles.facetScore, color: value.score ? ratingColor(computeOverall(value, '100')) : colors.mediumGray }}>
              {value.score ? `${value.score}/100` : 'Not rated'}
            </span>
          </div>
          <div style={styles.numericContainer}>
            <NumericInput value={value.score} max={100} onChange={(score) => setValue('score', score)} />
            <span style={styles.numericHint}>Drag to set your score</span>
          </div>
        </div>
      )}
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
    height: '44px', // iOS/Android minimum touch target
    borderRadius: radius.sm,
    border: 'none',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
    padding: 0,
    touchAction: 'manipulation',
  },
  // --- 5-star (whole stars) ---
  starsContainer: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginBottom: '4px',
  },
  starBtn: {
    width: '52px',
    height: '52px',
    flexShrink: 0,
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '46px',
    lineHeight: '52px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    userSelect: 'none',
  },
  starInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  starHint: {
    fontSize: '12px',
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
  // --- 0-100 slider ---
  numericContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sliderBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  numericDisplay: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  numericValue: {
    fontSize: '40px',
    fontWeight: 800,
    lineHeight: 1,
  },
  numericMax: {
    fontSize: '16px',
    color: colors.mediumGray,
    fontWeight: 600,
  },
  slider: {
    width: '100%',
    height: '36px', // tall hit area for the thumb
    cursor: 'pointer',
    touchAction: 'none', // let the slider own horizontal drags
  },
  numericHint: {
    fontSize: '12px',
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
};
