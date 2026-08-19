import { Capacitor } from '@capacitor/core';

export async function initializeNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
  ]);

  await Promise.allSettled([
    StatusBar.setOverlaysWebView({ overlay: false }),
    StatusBar.setBackgroundColor({ color: '#eef7f9' }),
    StatusBar.setStyle({ style: Style.Dark }),
    SplashScreen.hide(),
  ]);

  await App.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new CustomEvent(isActive ? 'ballfill:nativeresume' : 'ballfill:nativepause'));
  });

  await App.addListener('backButton', async () => {
    const event = new CustomEvent('ballfill:nativeback', { cancelable: true });
    const canExit = window.dispatchEvent(event);
    if (canExit) await App.exitApp();
  });
}
