import { describe, expect, it } from 'vitest';
import { levelConfig } from '../../src/data/levels';
import { WORLD_COLORS } from '../../src/game/rendering/colors';

describe('level progression', () => {
  it('preserves the tuned first-ten enemy rhythm', () => {
    expect(Array.from({ length: 9 }, (_, index) => levelConfig(index + 1).count))
      .toEqual([3, 3, 4, 4, 6, 5, 6, 6, 7]);
    expect(levelConfig(10)).toMatchObject({ miniBoss: true, count: 4 });
  });

  it('increases normal-world pressure into late levels', () => {
    expect(levelConfig(21).count).toBe(3);
    expect(levelConfig(41).count).toBe(4);
    expect(levelConfig(61).count).toBe(4);
    expect(levelConfig(81).count).toBe(5);
    expect(levelConfig(89)).toMatchObject({ world: 4, stage: 9, count: 7 });
  });

  it('continues speed and tracking progression after the old hard caps', () => {
    expect(levelConfig(89).speedMult).toBeGreaterThan(levelConfig(79).speedMult);
    expect(levelConfig(160).speedMult).toBeGreaterThan(levelConfig(89).speedMult);
    expect(levelConfig(200).seekStrength).toBeGreaterThan(levelConfig(120).seekStrength);
  });

  it('keeps rush, mini-boss, and world-boss identities', () => {
    expect(levelConfig(85)).toMatchObject({ rushEvent: true, rewardMult: 1.15 });
    expect(levelConfig(90)).toMatchObject({ miniBoss: true, rewardMult: 1.35, count: 4 });
    expect(levelConfig(110)).toMatchObject({ miniBoss: true, count: 5 });
    expect(levelConfig(100)).toMatchObject({ boss: true, count: 5 });
  });

  it('maps Level 89 enemies to the fifth world palette', () => {
    const config = levelConfig(89);
    expect(WORLD_COLORS[config.world]).toMatchObject({
      fill: '#26133f',
      edge: '#dc72ff',
      minion: '#5d3477',
    });
  });
});
