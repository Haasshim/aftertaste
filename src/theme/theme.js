// Design tokens for Aftertaste. Mirrors the CSS variables in index.css so inline
// styles and CSS stay in sync. Pure JS objects — zero runtime cost.

// Regal palette: deep green #003B2F, dark green #0F2A24, champagne gold
// #C2A46F, cream #F4EFE3, charcoal #2E2E2E. Cream is the canvas, deep green
// the brand structure (headers, FAB, detail cards), gold the metal accent,
// charcoal the text. (Token names kept for compatibility — only values
// changed, so every screen repalettes from this one object.)
export const colors = {
  brg: '#003B2F',          // deep green — headers, "good" ratings
  brgDeep: '#0F2A24',      // darker green for gradients
  brgLight: '#E4EBE7',     // pale green tint (chips, GPS button)
  brg20: 'rgba(0,59,47,0.2)',

  racingRed: '#003B2F',    // (now green) primary action / detail cards / hero
  racingRedDeep: '#0F2A24',
  redBlush: '#F4EFE3',     // cream app background
  redTint: '#E7DCC4',      // pale gold — soft fills, subtle borders, chips
  redGlow: 'rgba(194,164,111,0.3)',

  white: '#FFFDF7',        // warm near-white card surface / light text on green
  offWhite: '#ECE6D8',     // slightly deeper cream for inset fields
  cream: '#F4EFE3',
  dark: '#2E2E2E',         // charcoal text
  gray: '#6E685D',         // muted charcoal
  lightGray: '#DAD2C2',    // borders / tracks on cream
  mediumGray: '#9C9486',
  gold: '#C2A46F',         // champagne gold accent
  goldBright: '#D4BC8A',   // lighter gold for numbers/labels on green
  red: '#A6402E',          // restrained brick — errors / destructive only
  orange: '#A6402E',
  green: '#003B2F',
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
  // Formal copperplate script reserved for the "Aftertaste" wordmark.
  script: "'Pinyon Script', cursive",
  // Playfair Display for headings / restaurant names (elegant accent).
  brand: "'Playfair Display', serif",
  // Nunito for body / UI text — friendly, rounded, soft.
  sans: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const shadow = {
  card: '0 2px 8px rgba(0,0,0,0.06)',
  raised: '0 4px 12px rgba(0,0,0,0.15)',
  float: '0 4px 12px rgba(0,0,0,0.2)',
};

// Rating scale is 1-10 (per-facet and overall). These helpers are the single
// source of truth for rating color/label so screens stop duplicating the logic.
// Heat scale: brick (bad) -> antique bronze (meh) -> deep green (good).
// Warm earth tones that harmonize with the gold; all dark enough for cream text.
export function ratingColor(score) {
  if (score == null) return colors.mediumGray;
  if (score <= 3) return '#A6402E';  // brick
  if (score <= 6) return '#8A6D34';  // antique bronze
  return '#003B2F';                  // deep green
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
