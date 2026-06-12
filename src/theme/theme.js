// Design tokens for Aftertaste. Mirrors the CSS variables in index.css so inline
// styles and CSS stay in sync. Pure JS objects — zero runtime cost.

export const colors = {
  brg: '#004225',          // brand green (british racing green)
  brgDeep: '#00301B',      // darker green for gradients
  brgLight: '#E8F0EB',
  brg20: 'rgba(0,66,37,0.2)',

  // Oxblood + gold — the regal counterpart to the green.
  racingRed: '#76202F',    // oxblood, primary red accent
  racingRedDeep: '#4F1320',
  redBlush: '#F4EDE0',     // parchment ivory app background
  redTint: '#E3D5B8',      // gold-leaf borders, chips, soft fills
  redGlow: 'rgba(118,32,47,0.18)',

  white: '#FFFEFA',
  offWhite: '#FAF5EB',     // warmed to sit on the parchment background
  cream: '#FFF8F0',
  dark: '#221814',         // warm near-black
  gray: '#6E6356',         // warm gray
  lightGray: '#E5DCCB',
  mediumGray: '#A2937E',
  gold: '#C2A14D',
  goldBright: '#D9BC6B',
  red: '#C0392B',
  orange: '#E67E22',
  green: '#27AE60',
};

export const space = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
};

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  pill: '999px',
};

export const font = {
  brand: "'Playfair Display', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const shadow = {
  card: '0 2px 8px rgba(0,0,0,0.06)',
  raised: '0 4px 12px rgba(0,0,0,0.15)',
  float: '0 4px 12px rgba(0,0,0,0.2)',
};

// Rating scale is 1-10 (per-facet and overall). These helpers are the single
// source of truth for rating color/label so screens stop duplicating the logic.
export function ratingColor(score) {
  if (score == null) return colors.mediumGray;
  if (score <= 3) return colors.red;
  if (score <= 5) return colors.orange;
  if (score <= 7) return colors.gold;
  return colors.brg;
}

export function ratingLabel(score) {
  if (score == null || score === 0) return 'Not rated';
  const labels = {
    1: 'Gnarly',
    2: 'Yikes',
    3: 'Mid',
    4: 'Meh',
    5: 'It Passes',
    6: 'Lowkey Good',
    7: 'Pretty Fire',
    8: 'Slaps',
    9: "Chef's Kiss",
    10: 'Gobsmacking',
  };
  return labels[Math.min(10, Math.max(1, Math.round(score)))];
}
