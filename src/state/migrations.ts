import { BALL_IDS, isBallId } from '../data/balls';
import { isBoosterId } from '../data/boosters';
import { roundCoinAmount } from '../data/economy';
import { LEVELS_PER_WORLD, WORLD_COUNT, normalizeLevelProgress } from '../domains/campaign/WorldProgression';
import { DEFAULT_SAVE_DATA, SAVE_VERSION, type SaveData } from './SaveData';

const MAX_LEVEL = 200;

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function normalizeSaveData(value: unknown, legacyTutorialSeen = false): SaveData {
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
  const highestCompletedLevel = Math.max(
    0,
    Math.min(MAX_LEVEL, Math.floor(finiteNumber(raw.highestCompletedLevel, currentLevel - 1))),
  );
  const derivedLegacyWorldCount = Math.max(1, Math.floor(highestCompletedLevel / LEVELS_PER_WORLD) + 1);

  return {
    version: SAVE_VERSION,
    currentLevel,
    highestCompletedLevel,
    levelProgress: normalizeLevelProgress(raw.levelProgress, highestCompletedLevel),
    grandfatheredWorldCount: Math.max(1, Math.min(
      WORLD_COUNT,
      Math.floor(finiteNumber(raw.grandfatheredWorldCount, derivedLegacyWorldCount)),
    )),
    walletCoins: Math.max(0, roundCoinAmount(finiteNumber(raw.walletCoins, 0))),
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
