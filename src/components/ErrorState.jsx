import React from 'react';
import Icon from './Icon';
import { colors, radius } from '../theme/theme';

// Inline error block with an optional retry button. Used in place of silent
// failures / blank screens when a data load or save fails.
export default function ErrorState({ error, onRetry, compact = false }) {
  const offline = error?.type === 'network';
  const message =
    error?.message ||
    (offline
      ? "You're offline. Check your connection and try again."
      : 'Something went wrong. Please try again.');

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: compact ? '20px' : '40px 24px',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.red + '14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={offline ? 'wifi-off' : 'alert-triangle'} size={26} color={colors.red} />
      </div>
      <p style={{ fontSize: '15px', color: colors.dark, fontWeight: 600, maxWidth: 280 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: colors.brg,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
