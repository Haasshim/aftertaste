import React from 'react';
import { colors } from '../theme/theme';

// Lightweight CSS spinner. `@keyframes spin` lives in index.css.
export default function Spinner({ size = 28, color = colors.brg, style }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        border: `3px solid ${colors.lightGray}`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        ...style,
      }}
    />
  );
}

export function FullScreenSpinner({ label }) {
  return (
    <div
      style={{
        height: 'var(--app-h)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        background: colors.offWhite,
      }}
    >
      <Spinner size={36} />
      {label && <p style={{ color: colors.gray, fontSize: '15px' }}>{label}</p>}
    </div>
  );
}
