import { MAX_LEVEL } from '../../data/encounters';
import { roundCoinAmount } from '../../data/economy';

export const LEVELS_PER_WORLD = 20;
export const STARS_PER_LEVEL = 3;
export const WORLD_STAR_CAP = LEVELS_PER_WORLD * STARS_PER_LEVEL;
export const WORLD_UNLOCK_STARS = 50;
export const WORLD_COUNT = Math.ceil(MAX_LEVEL / LEVELS_PER_WORLD);

export const WORLD_NAMES = [
  'Crimson Fields',
  'Frost Reach',
  'Clockwork Dunes',
  'Storm Citadel',
  'Void Dominion',
  'Verdant Wilds',
  'Solar Forge',
  'Toxic Marsh',
  'Nebula Rift',
  'Prism Crown',
] as const;

export interface LevelProgressRecord {
  level: number;
  stars: number;
  bestTimeLeft: number;
  fewestBallsUsed: number;
  bestCoins: number;
  attempts: number;
}

export interface LevelResultRecordInput {
  level: number;
  win: boolean;
  stars: number;
  timeLeft: number;
  ballsUsed: number;
  coinsEarned: number;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampInteger(value: unknown, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Math.floor(finiteNumber(value, minimum))));
}

export function worldIndexForLevel(level: number): number {
  return Math.max(0, Math.min(WORLD_COUNT - 1, Math.floor((level - 1) / LEVELS_PER_WORLD)));
}

export function worldLevelRange(worldIndex: number): { start: number; end: number } {
  const safeIndex = Math.max(0, Math.min(WORLD_COUNT - 1, Math.floor(worldIndex)));
  const start = safeIndex * LEVELS_PER_WORLD + 1;
  return { start, end: Math.min(MAX_LEVEL, start + LEVELS_PER_WORLD - 1) };
}

export function normalizeLevelProgress(
  value: unknown,
  legacyHighestCompletedLevel = 0,
): LevelProgressRecord[] {
  const records = new Map<number, LevelProgressRecord>();
  if (Array.isArray(value)) {
    for (const candidate of value) {
      if (!candidate || typeof candidate !== 'object') continue;
      const raw = candidate as Record<string, unknown>;
      const level = clampInteger(raw.level, 1, MAX_LEVEL);
      const normalized: LevelProgressRecord = {
        level,
        stars: clampInteger(raw.stars, 0, STARS_PER_LEVEL),
        bestTimeLeft: Math.max(0, Math.round(finiteNumber(raw.bestTimeLeft) * 10) / 10),
        fewestBallsUsed: Math.max(0, Math.floor(finiteNumber(raw.fewestBallsUsed))),
        bestCoins: Math.max(0, roundCoinAmount(finiteNumber(raw.bestCoins))),
        attempts: Math.max(0, Math.floor(finiteNumber(raw.attempts))),
      };
      const previous = records.get(level);
      if (!previous) {
        records.set(level, normalized);
        continue;
      }
      records.set(level, {
        level,
        stars: Math.max(previous.stars, normalized.stars),
        bestTimeLeft: Math.max(previous.bestTimeLeft, normalized.bestTimeLeft),
        fewestBallsUsed: previous.fewestBallsUsed && normalized.fewestBallsUsed
          ? Math.min(previous.fewestBallsUsed, normalized.fewestBallsUsed)
          : Math.max(previous.fewestBallsUsed, normalized.fewestBallsUsed),
        bestCoins: Math.max(previous.bestCoins, normalized.bestCoins),
        attempts: Math.max(previous.attempts, normalized.attempts),
      });
    }
  }

  // Older saves only knew the furthest completed level. A completion proves
  // at least one star, while leaving two stars available to earn on replay.
  const legacyEnd = Math.max(0, Math.min(MAX_LEVEL, Math.floor(legacyHighestCompletedLevel)));
  for (let level = 1; level <= legacyEnd; level += 1) {
    if (!records.has(level)) {
      records.set(level, {
        level,
        stars: 1,
        bestTimeLeft: 0,
        fewestBallsUsed: 0,
        bestCoins: 0,
        attempts: 1,
      });
    }
  }

  return [...records.values()].sort((left, right) => left.level - right.level);
}

export function recordLevelResult(
  records: readonly LevelProgressRecord[],
  input: LevelResultRecordInput,
): LevelProgressRecord[] {
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(input.level)));
  const previous = records.find(record => record.level === level);
  const next: LevelProgressRecord = {
    level,
    stars: previous?.stars ?? 0,
    bestTimeLeft: previous?.bestTimeLeft ?? 0,
    fewestBallsUsed: previous?.fewestBallsUsed ?? 0,
    bestCoins: previous?.bestCoins ?? 0,
    attempts: (previous?.attempts ?? 0) + 1,
  };

  if (input.win) {
    next.stars = Math.max(next.stars, clampInteger(input.stars, 1, STARS_PER_LEVEL));
    next.bestTimeLeft = Math.max(next.bestTimeLeft, Math.max(0, Math.round(input.timeLeft * 10) / 10));
    const ballsUsed = Math.max(1, Math.floor(input.ballsUsed));
    next.fewestBallsUsed = next.fewestBallsUsed
      ? Math.min(next.fewestBallsUsed, ballsUsed)
      : ballsUsed;
    next.bestCoins = Math.max(next.bestCoins, Math.max(0, roundCoinAmount(input.coinsEarned)));
  }

  return [...records.filter(record => record.level !== level), next]
    .sort((left, right) => left.level - right.level);
}

export function starsInWorld(records: readonly LevelProgressRecord[], worldIndex: number): number {
  const { start, end } = worldLevelRange(worldIndex);
  return records.reduce((total, record) => (
    record.level >= start && record.level <= end ? total + Math.max(0, Math.min(3, record.stars)) : total
  ), 0);
}

export function isWorldUnlocked(
  worldIndex: number,
  records: readonly LevelProgressRecord[],
  grandfatheredWorldCount = 1,
): boolean {
  const target = Math.max(0, Math.min(WORLD_COUNT - 1, Math.floor(worldIndex)));
  const baseline = Math.max(1, Math.min(WORLD_COUNT, Math.floor(grandfatheredWorldCount)));
  if (target < baseline) return true;
  for (let candidate = baseline; candidate <= target; candidate += 1) {
    if (starsInWorld(records, candidate - 1) < WORLD_UNLOCK_STARS) return false;
  }
  return true;
}

export function isLevelUnlocked(
  level: number,
  records: readonly LevelProgressRecord[],
  highestCompletedLevel: number,
  grandfatheredWorldCount = 1,
): boolean {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  if (!isWorldUnlocked(worldIndexForLevel(safeLevel), records, grandfatheredWorldCount)) return false;
  if (records.some(record => record.level === safeLevel && record.stars > 0)) return true;
  return safeLevel <= Math.min(MAX_LEVEL, Math.max(1, Math.floor(highestCompletedLevel) + 1));
}

export function starsNeededForNextWorld(
  level: number,
  records: readonly LevelProgressRecord[],
): number {
  return Math.max(0, WORLD_UNLOCK_STARS - starsInWorld(records, worldIndexForLevel(level)));
}
