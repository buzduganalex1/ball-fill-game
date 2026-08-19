import { describe, expect, it } from 'vitest';
import { buildEnemyTrailWedge } from '../../src/game/rendering/EnemyTrailGeometry';

describe('enemy trail geometry', () => {
  it('builds a long triangular wedge that widens toward the enemy', () => {
    const trail = Array.from({ length: 8 }, (_, index) => ({
      x: index * 12,
      y: 40,
      life: 1,
    }));
    const wedge = buildEnemyTrailWedge(trail, 18);

    expect(wedge).toHaveLength(trail.length * 2);
    const tipWidth = Math.hypot(
      wedge[0].x - wedge[wedge.length - 1].x,
      wedge[0].y - wedge[wedge.length - 1].y,
    );
    const baseWidth = Math.hypot(
      wedge[trail.length - 1].x - wedge[trail.length].x,
      wedge[trail.length - 1].y - wedge[trail.length].y,
    );
    expect(tipWidth).toBeCloseTo(0, 5);
    expect(baseWidth).toBeCloseTo(36, 1);
    expect(trail.at(-1)!.x - trail[0].x).toBeGreaterThan(baseWidth * 2);
  });

  it('returns no polygon until a visible trail has at least two points', () => {
    expect(buildEnemyTrailWedge([{ x: 0, y: 0, life: 1 }], 12)).toEqual([]);
    expect(buildEnemyTrailWedge([
      { x: 0, y: 0, life: 0 },
      { x: 10, y: 0, life: 0 },
    ], 12)).toEqual([]);
  });
});
