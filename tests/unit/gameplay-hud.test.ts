import { describe, expect, it } from 'vitest';
import { buildGameplayHudViewModel } from '../../src/application/gameplay/GameplayHudViewModel';
import { progressPointsFromCoverage, progressStarCount } from '../../src/domains/gameplay/ProgressRules';
import { clearFinishedRunScene, createActiveRun } from '../../src/domains/gameplay/RunState';

describe('gameplay progress and HUD', () => {
  it('maps target coverage to 100 progress points', () => {
    expect(progressPointsFromCoverage(15)).toBe(50);
    expect(progressPointsFromCoverage(30)).toBe(100);
    expect(progressPointsFromCoverage(100)).toBe(100);
  });

  it('keeps checkpoint stars stable inside the visual hysteresis margin', () => {
    expect(progressStarCount(66.5, 2)).toBe(2);
    expect(progressStarCount(64, 2)).toBe(1);
  });

  it('builds a distraction-free level-one HUD', () => {
    const hud = buildGameplayHudViewModel({
      currentLevel: 1,
      onboardingLevel: 1,
      enemyCount: 0,
      timeLeft: 45,
      ballsLeft: 10,
      equippedBallId: 'normal',
      displayedCoverage: 0,
      previousProgressStars: 0,
      boosterFeedbackTime: 0,
      boosterFeedbackText: '',
      boosterFeedbackColor: '#fff',
      frenzyTime: 0,
    });
    expect(hud.levelChallenge).toBe('LEVEL 1 • LEARN TO FILL');
    expect(hud.time).toBe('—');
    expect(hud.difficulty).toContain('No enemies');
  });

  it('clears the finished arena without erasing result metrics', () => {
    const state = createActiveRun({
      running: false,
      startTime: 45,
      startBalls: 10,
      bossEncounter: false,
      onboardingLevel: 0,
      now: 0,
    });
    state.timeLeft = 18;
    state.ballsUsed = 4;
    state.coverage = 31;
    state.liveCoverage = 34;
    state.active = { x: 40, y: 50, r: 12 };
    state.placed.push({ x: 20, y: 20, r: 16 });
    state.enemies.push({
      x: 60, y: 60, vx: 1, vy: 1, r: 12,
      boss: false, miniBoss: false, minion: false,
      bossIndex: 0, worldIndex: 1, maxSpeed: 2, seekStrength: 0, trail: [], trailTimer: 0,
    });
    state.coins.push({ x: 80, y: 80, r: 10, pulse: 0 });
    state.coinFx.push({ x: 30, y: 30, r: 3, life: 1 });
    state.impactRings.push({ x: 30, y: 30, life: 1 });
    state.freezeLeft = 2;

    clearFinishedRunScene(state);

    expect(state.active).toBeNull();
    expect(state.placed).toHaveLength(0);
    expect(state.enemies).toHaveLength(0);
    expect(state.coins).toHaveLength(0);
    expect(state.coinFx).toHaveLength(0);
    expect(state.impactRings).toHaveLength(0);
    expect(state.freezeLeft).toBe(0);
    expect(state.liveCoverage).toBe(31);
    expect({ timeLeft: state.timeLeft, ballsUsed: state.ballsUsed, coverage: state.coverage })
      .toEqual({ timeLeft: 18, ballsUsed: 4, coverage: 31 });
  });
});
