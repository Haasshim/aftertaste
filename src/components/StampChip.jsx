import React from 'react';
import Icon from './Icon';
import { STAMPS } from '../utils/constants';

// Read-only stamp pill (icon + label), color-tinted per stamp. Used in
// HomeScreen cards and DishDetailScreen. Resolves a stamp id to its config.
export default function StampChip({ stampId, size = 'sm' }) {
  const stamp = STAMPS.find((s) => s.id === stampId);
  if (!stamp) return null;

  const dims =
    size === 'md'
      ? { padding: '8px 12px', fontSize: '14px', icon: 15, radius: '10px', gap: '6px' }
      : { padding: '4px 9px', fontSize: '11px', icon: 13, radius: '8px', gap: '5px' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dims.gap,
        padding: dims.padding,
        borderRadius: dims.radius,
        fontSize: dims.fontSize,
        fontWeight: 600,
        background: stamp.color + '18',
        color: stamp.color,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon name={stamp.icon} size={dims.icon} color={stamp.color} strokeWidth={2} />
      {stamp.label}
    </span>
  );
}
