export interface EnemyTrailPoint {
  x: number;
  y: number;
  life?: number;
}

export interface EnemyTrailVertex {
  x: number;
  y: number;
}

/**
 * Builds a curved triangular wedge: a zero-width tail tip that widens toward
 * the enemy. Both renderers consume this geometry so Phaser and the canvas
 * fallback keep the same silhouette.
 */
export function buildEnemyTrailWedge(
  trail: readonly EnemyTrailPoint[],
  headHalfWidth: number,
): EnemyTrailVertex[] {
  const points = trail.filter(point => (point.life ?? 1) > 0);
  if (points.length < 2 || headHalfWidth <= 0) return [];

  const left: EnemyTrailVertex[] = [];
  const right: EnemyTrailVertex[] = [];
  let lastNormalX = 0;
  let lastNormalY = 1;

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy);

    if (length > 0.001) {
      lastNormalX = -dy / length;
      lastNormalY = dx / length;
    }

    const progress = index / (points.length - 1);
    const life = Math.max(0, Math.min(1, points[index].life ?? 1));
    const halfWidth = headHalfWidth * Math.pow(progress, 0.78) * Math.min(1, 0.32 + life * 0.86);
    left.push({
      x: points[index].x + lastNormalX * halfWidth,
      y: points[index].y + lastNormalY * halfWidth,
    });
    right.push({
      x: points[index].x - lastNormalX * halfWidth,
      y: points[index].y - lastNormalY * halfWidth,
    });
  }

  return [...left, ...right.reverse()];
}
