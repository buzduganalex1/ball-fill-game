import { describe, expect, it } from 'vitest';
import {
  evaluateStarPerformance,
  STAR_MAX_BALLS_USED,
  STAR_TIME_LEFT_REQUIRED,
} from '../../src/domains/campaign/StarRules';
import { calculateRunReward } from '../../src/domains/economy/RewardPolicy';

describe('result domain', () => {
  it('awards no stars when the run is lost', () => {
    const report = evaluateStarPerformance({
      win: false,
      timeLeft: 99,
      ballsUsed: 1,
      progressPoints: 72,
    });

    expect(report.stars).toBe(0);
    expect(report.requirements.every(({ passed }) => !passed)).toBe(true);
    expect(report.requirements[0]?.actual).toBe('72 / 100 progress');
  });

  it.each([
    { timeLeft: 0, ballsUsed: STAR_MAX_BALLS_USED + 1, stars: 1 },
    { timeLeft: STAR_TIME_LEFT_REQUIRED, ballsUsed: STAR_MAX_BALLS_USED + 1, stars: 2 },
    { timeLeft: STAR_TIME_LEFT_REQUIRED, ballsUsed: STAR_MAX_BALLS_USED, stars: 3 },
  ])('awards $stars star(s) from explicit requirements', ({ timeLeft, ballsUsed, stars }) => {
    const report = evaluateStarPerformance({ win: true, timeLeft, ballsUsed, progressPoints: 100 });
    expect(report.stars).toBe(stars);
  });

  it('combines the star and encounter multipliers and rounds the payout', () => {
    expect(calculateRunReward({ win: true, runCoins: 10.01, stars: 3, encounterMultiplier: 1.35 })).toEqual({
      baseCoins: 10,
      multiplier: 2.7,
      payout: 27,
    });
  });

  it('never pays a lost run', () => {
    expect(calculateRunReward({ win: false, runCoins: 12, stars: 0, encounterMultiplier: 5 })).toEqual({
      baseCoins: 12,
      multiplier: 1,
      payout: 0,
    });
  });
});
