import React from 'react';
import Icon from './Icon';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { colors } from '../theme/theme';

// Thin banner shown under the header when the device is offline.
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: colors.orange,
        color: colors.white,
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      <Icon name="wifi-off" size={15} color={colors.white} />
      You're offline — changes may not be saved
    </div>
  );
}
