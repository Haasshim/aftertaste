import React from 'react';
import Icon from './Icon';
import { STAMPS } from '../utils/constants';
import { colors } from '../theme/theme';

// Read-only stamp pill (icon + label). Uniform gold "wax seal" styling — the
// per-stamp accent colors were dropped so a row of stamps reads as one set.
// Gold-on-pill works on both light (Home) and oxblood (Dish Log) surfaces.
export default function StampChip({ stampId, size = 'sm' }) {
  const stamp = STAMPS.find((s) => s.id === stampId);
  if (!stamp) return null;

  const dims =
    size === 'md'
      ? { padding: '8px 12px', fontSize: '14px', icon: 15, radius: '999px', gap: '6px' }
      : { padding: '4px 10px', fontSize: '11px', icon: 13, radius: '999px', gap: '5px' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dims.gap,
        padding: dims.padding,
        borderRadius: dims.radius,
        fontSize: dims.fontSize,
        fontWeight: 700,
        background: colors.gold,
        color: colors.racingRedDeep,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon name={stamp.icon} size={dims.icon} color={colors.racingRedDeep} strokeWidth={2} />
      {stamp.label}
    </span>
  );
}
