// Native-only setup (status bar). Safe no-op on the web — guarded by the
// Capacitor platform check so the web bundle never touches native APIs.
import { Capacitor } from '@capacitor/core';

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#004225' });
    }
  } catch {
    // status-bar plugin not available; ignore.
  }
}
