import { describe, expect, it } from 'vitest';
import { liveStarCount, measureCoverage } from '../../src/game/systems/CoverageSystem';
import { followPointerTarget, growBallIntoAvailableSpace } from '../../src/game/systems/GrowthSystem';

describe('growth system', () => {
  it('smoothly follows a touch target while respecting arena bounds', () => {
    const ball = {
      x: 20,
      y: 20,
      r: 10,
      pointerFollowActive: true,
      pointerTargetX: 200,
      pointerTargetY: -20,
      followRate: 20,
    };
    followPointerTarget(ball, 1 / 60, 100, 100, []);
    expect(ball.x).toBeGreaterThan(20);
    expect(ball.x).toBeLessThan(90);
    expect(ball.y).toBeGreaterThanOrEqual(10);
  });

  it('nudges a growing ball inward instead of freezing against a wall', () => {
    const ball = { x: 10, y: 50, r: 10 };
    const result = growBallIntoAvailableSpace(ball, 14, [], 100, 100);
    expect(result).toEqual({ grew: true, shifted: true });
    expect(ball.r).toBe(14);
    expect(ball.x).toBeGreaterThanOrEqual(14);
  });
});

describe('coverage system', () => {
  it('measures a circle as occupied area without double counting', () => {
    const one = measureCoverage([{ x: 50, y: 50, r: 25 }], 100, 100, 200);
    const duplicate = measureCoverage([
      { x: 50, y: 50, r: 25 },
      { x: 50, y: 50, r: 25 },
    ], 100, 100, 200);
    expect(one).toBeCloseTo(Math.PI * 25 * 25 / 100, 0);
    expect(duplicate).toBe(one);
  });

  it('awards more stars to an efficient run', () => {
    expect(liveStarCount({
      coverage: 30,
      targetCoverage: 30,
      timeLeft: 40,
      startTime: 45,
      ballsLeft: 8,
      startBalls: 10,
    })).toBe(3);
  });
});
