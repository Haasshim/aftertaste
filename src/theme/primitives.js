// Reusable inline-style fragments built from theme tokens. Screens spread these
// instead of redefining the same green header / card / button over and over.
import { colors, space, radius, font, shadow } from './theme';

export const screenContainer = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: colors.offWhite,
  position: 'relative',
};

// Green top bar. Uses safe-area inset so it clears the notch on native/Android.
export const greenHeader = {
  background: colors.brg,
  padding: 'calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
};

export const headerTitle = {
  fontSize: '18px',
  fontWeight: 700,
  color: colors.white,
  margin: 0,
};

export const iconBtn = {
  width: '40px',
  height: '40px',
  borderRadius: radius.pill,
  background: 'transparent',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

export const body = {
  flex: 1,
  overflow: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export const card = {
  background: colors.white,
  borderRadius: radius.lg,
  padding: space.lg,
  boxShadow: shadow.card,
};

export const sectionCard = {
  background: colors.white,
  marginTop: '10px',
  padding: space.xl,
};

export const sectionTitle = {
  fontSize: '18px',
  fontWeight: 700,
  color: colors.dark,
  margin: 0,
};

export const sectionLabel = {
  fontSize: '13px',
  fontWeight: 700,
  color: colors.gray,
  letterSpacing: '0.5px',
  marginBottom: space.md,
  textTransform: 'uppercase',
};

export const primaryButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space.sm,
  width: '100%',
  background: colors.brg,
  color: colors.white,
  border: 'none',
  borderRadius: radius.md,
  padding: '16px',
  fontSize: '17px',
  fontWeight: 700,
  letterSpacing: '0.3px',
  cursor: 'pointer',
};

export const inputField = {
  width: '100%',
  border: `1.5px solid ${colors.lightGray}`,
  borderRadius: radius.md,
  padding: '14px 16px',
  fontSize: '16px',
  color: colors.dark,
  background: colors.offWhite,
  boxSizing: 'border-box',
};

export const brandWordmark = {
  fontFamily: font.brand,
  fontWeight: 700,
  color: colors.white,
  letterSpacing: '1px',
  margin: 0,
};
