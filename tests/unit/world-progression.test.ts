import { describe, expect, it } from 'vitest';
import {
  isLevelUnlocked,
  isWorldUnlocked,
  recordLevelResult,
  starsInWorld,
  type LevelProgressRecord,
} from '../../src/domains/campaign/WorldProgression';

function progressWithStars(stars: number): LevelProgressRecord[] {
  const records: LevelProgressRecord[] = [];
  let remaining = stars;
  for (let level = 1; level <= 20 && remaining > 0; level += 1) {
    const earned = Math.min(3, remaining);
    records.push({
      level,
      stars: earned,
      bestTimeLeft: 10,
      fewestBallsUsed: 4,
      bestCoins: 5,
      attempts: 1,
    });
    remaining -= earned;
  }
  return records;
}

describe('world progression', () => {
  it('requires fifty of sixty stars to unlock the next world', () => {
    expect(isWorldUnlocked(1, progressWithStars(49))).toBe(false);
    expect(isWorldUnlocked(1, progressWithStars(50))).toBe(true);
  });

  it('still requires levels to unlock sequentially inside an open world', () => {
    const progress = progressWithStars(50);
    expect(isLevelUnlocked(21, progress, 20)).toBe(true);
    expect(isLevelUnlocked(22, progress, 20)).toBe(false);
  });

  it('keeps best stats while counting every attempt', () => {
    let progress = recordLevelResult([], {
      level: 1,
      win: true,
      stars: 2,
      timeLeft: 12.4,
      ballsUsed: 5,
      coinsEarned: 8,
    });
    progress = recordLevelResult(progress, {
      level: 1,
      win: true,
      stars: 3,
      timeLeft: 9,
      ballsUsed: 3,
      coinsEarned: 6,
    });
    progress = recordLevelResult(progress, {
      level: 1,
      win: false,
      stars: 0,
      timeLeft: 0,
      ballsUsed: 6,
      coinsEarned: 0,
    });

    expect(progress[0]).toEqual({
      level: 1,
      stars: 3,
      bestTimeLeft: 12.4,
      fewestBallsUsed: 3,
      bestCoins: 8,
      attempts: 3,
    });
    expect(starsInWorld(progress, 0)).toBe(3);
  });
});
