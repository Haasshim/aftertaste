// Design tokens for Aftertaste. Mirrors the CSS variables in index.css so inline
// styles and CSS stay in sync. Pure JS objects — zero runtime cost.

export const colors = {
  brg: '#004225',          // brand green
  brgLight: '#E8F0EB',
  brg20: 'rgba(0,66,37,0.2)',
  white: '#FFFFFF',
  offWhite: '#F8F8F6',
  cream: '#FFF8F0',
  dark: '#1A1A1A',
  gray: '#6B6B6B',
  lightGray: '#E0E0E0',
  mediumGray: '#9E9E9E',
  gold: '#D4A843',
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
  if (score <= 2) return 'Disappointing';
  if (score <= 4) return 'Below Average';
  if (score <= 5) return 'Average';
  if (score <= 6) return 'Decent';
  if (score <= 7) return 'Good';
  if (score <= 8) return 'Great';
  if (score <= 9) return 'Excellent';
  return 'Outstanding';
}
