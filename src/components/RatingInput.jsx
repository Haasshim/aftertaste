import React, { useState } from 'react';
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

// Star rating component (for 5-star rating type)
function StarRating({ value = 0, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const displayValue = value ? Math.round(value * 2) / 2 : 0;

  return (
    <div style={styles.starsContainer}>
      {stars.map((star) => {
        const isFilled = displayValue >= star;
        const isHalfFilled = displayValue >= star - 0.5 && displayValue < star;
        return (
          <button
            key={star}
            type="button"
            className="press"
            onClick={() => {
              const newVal = value === star ? 0 : star;
              onChange(newVal);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const newVal = value === star - 0.5 ? 0 : star - 0.5;
              onChange(newVal);
            }}
            aria-label={`${displayValue} stars`}
            style={{
              ...styles.starBtn,
              fontSize: '48px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              color: isFilled || isHalfFilled ? ratingColor(displayValue * 2) : colors.mediumGray,
            }}
          >
            {isFilled ? '★' : isHalfFilled ? '⭐' : '☆'}
          </button>
        );
      })}
    </div>
  );
}

// Numeric input component (for 1-100 scale)
function NumericInput({ value = 0, max = 100, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value || ''));

  const handleCommit = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 0 && num <= max) {
      onChange(num);
    } else {
      setInputValue(String(value || ''));
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        max={max}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCommit();
          if (e.key === 'Escape') {
            setInputValue(String(value || ''));
            setIsEditing(false);
          }
        }}
        autoFocus
        style={{
          ...styles.numericInput,
          borderColor: ratingColor(computeNormalized(value, max)),
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setIsEditing(true);
        setInputValue(String(value || ''));
      }}
      style={{
        ...styles.numericDisplay,
        color: ratingColor(computeNormalized(value, max)),
      }}
    >
      <span style={styles.numericValue}>{value || '–'}</span>
      <span style={styles.numericMax}>/{max}</span>
    </button>
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

  return (
    <div role="group" aria-label="Dish rating">
      {/* Overall readout */}
      <div style={styles.overallRow}>
        <div key={overall} className="pop-in" style={{ ...styles.overallBadge, borderColor: ratingColor(overall) }}>
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
            <span style={styles.starHint}>Right-click for half stars</span>
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
            <span style={styles.numericHint}>Click to edit</span>
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
    height: '36px',
    borderRadius: radius.sm,
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
    padding: 0,
  },
  starsContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  starBtn: {
    lineHeight: 1,
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
  numericContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  numericDisplay: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '4px',
    padding: '12px 16px',
    borderRadius: radius.sm,
    border: 'none',
    background: colors.offWhite,
    cursor: 'pointer',
    transition: 'background 0.12s',
  },
  numericValue: {
    fontSize: '28px',
    fontWeight: 700,
  },
  numericMax: {
    fontSize: '14px',
    color: colors.mediumGray,
    fontWeight: 600,
  },
  numericInput: {
    width: '100%',
    maxWidth: '120px',
    padding: '12px 16px',
    borderRadius: radius.sm,
    border: '2px solid',
    fontSize: '16px',
    fontWeight: 700,
  },
  numericHint: {
    fontSize: '12px',
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
};
