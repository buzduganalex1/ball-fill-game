import { BALL_IDS, isBallId } from '../data/balls';
import { isBoosterId } from '../data/boosters';
import { DEFAULT_SAVE_DATA, SAVE_VERSION, type SaveDataV1 } from './SaveData';

const MAX_LEVEL = 200;

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function normalizeSaveData(value: unknown, legacyTutorialSeen = false): SaveDataV1 {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const settings = raw.settings && typeof raw.settings === 'object'
    ? raw.settings as Record<string, unknown>
    : {};
  const starterPackOpened = Boolean(raw.starterPackOpened);
  const ownedBallIds = unique(
    (Array.isArray(raw.ownedBallIds) ? raw.ownedBallIds : []).filter(isBallId),
  );
  if (starterPackOpened && !ownedBallIds.includes('normal')) ownedBallIds.unshift('normal');

  const equippedBallId = isBallId(raw.equippedBallId) && ownedBallIds.includes(raw.equippedBallId)
    ? raw.equippedBallId
    : ownedBallIds[0] ?? BALL_IDS[0];
  const currentLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(finiteNumber(raw.currentLevel, 1))));

  return {
    version: SAVE_VERSION,
    currentLevel,
    highestCompletedLevel: Math.max(
      0,
      Math.min(MAX_LEVEL, Math.floor(finiteNumber(raw.highestCompletedLevel, currentLevel - 1))),
    ),
    walletCoins: Math.max(0, Math.round(finiteNumber(raw.walletCoins, 0) * 100) / 100),
    ownedBallIds,
    equippedBallId,
    unlockedBoosterIds: unique(
      (Array.isArray(raw.unlockedBoosterIds) ? raw.unlockedBoosterIds : []).filter(isBoosterId),
    ),
    starterPackOpened,
    tutorialSeen: Boolean(raw.tutorialSeen) || legacyTutorialSeen,
    firstPackMilestoneSeen: Boolean(raw.firstPackMilestoneSeen),
    settings: {
      soundEnabled: settings.soundEnabled === undefined
        ? DEFAULT_SAVE_DATA.settings.soundEnabled
        : Boolean(settings.soundEnabled),
      reducedMotion: Boolean(settings.reducedMotion),
    },
  };
}
