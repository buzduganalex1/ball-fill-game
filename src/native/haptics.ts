import { Capacitor } from '@capacitor/core';

export type NativeFeedback = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
export type GrowthFeedback = 'move' | 'grow';
export type GrowthEndFeedback = 'locked' | 'hit' | 'complete' | 'cancelled';

export const nativeHapticsAvailable = Capacitor.isNativePlatform();

type HapticsModule = typeof import('@capacitor/haptics');

let modulePromise: Promise<HapticsModule> | null = null;
let feedbackQueue: Promise<void> = Promise.resolve();
let growthSelectionActive = false;
let lastGrowthPulseAt = 0;

function loadHaptics(): Promise<HapticsModule> {
  modulePromise ??= import('@capacitor/haptics');
  return modulePromise;
}

function enqueueFeedback(operation: (module: HapticsModule) => Promise<void>): Promise<void> {
  if (!nativeHapticsAvailable) return Promise.resolve();
  const next = feedbackQueue.then(async () => operation(await loadHaptics()));
  feedbackQueue = next.catch(() => undefined);
  return next.catch(() => undefined);
}

export function triggerNativeFeedback(feedback: NativeFeedback): Promise<void> {
  return enqueueFeedback(async ({ Haptics, ImpactStyle, NotificationType }) => {
    if (feedback === 'success' || feedback === 'warning' || feedback === 'error') {
      await Haptics.notification({
        type: {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        }[feedback],
      });
      return;
    }
    await Haptics.impact({
      style: {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }[feedback],
    });
  });
}

export function beginNativeGrowthFeedback(): Promise<void> {
  if (!nativeHapticsAvailable || growthSelectionActive) return Promise.resolve();
  growthSelectionActive = true;
  lastGrowthPulseAt = performance.now();
  return enqueueFeedback(async ({ Haptics, ImpactStyle }) => {
    await Haptics.selectionStart();
    await Haptics.impact({ style: ImpactStyle.Medium });
  });
}

export function pulseNativeGrowthFeedback(feedback: GrowthFeedback): Promise<void> {
  if (!nativeHapticsAvailable || !growthSelectionActive) return Promise.resolve();
  const now = performance.now();
  const minimumInterval = feedback === 'move' ? 90 : 155;
  if (now - lastGrowthPulseAt < minimumInterval) return Promise.resolve();
  lastGrowthPulseAt = now;

  return enqueueFeedback(async ({ Haptics, ImpactStyle }) => {
    if (feedback === 'move') await Haptics.selectionChanged();
    else await Haptics.impact({ style: ImpactStyle.Light });
  });
}

export function endNativeGrowthFeedback(feedback: GrowthEndFeedback): Promise<void> {
  if (!nativeHapticsAvailable || !growthSelectionActive) return Promise.resolve();
  growthSelectionActive = false;
  lastGrowthPulseAt = 0;

  return enqueueFeedback(async ({ Haptics, ImpactStyle }) => {
    await Haptics.selectionEnd();
    if (feedback === 'locked') await Haptics.impact({ style: ImpactStyle.Medium });
    else if (feedback === 'hit') await Haptics.impact({ style: ImpactStyle.Heavy });
  });
}
