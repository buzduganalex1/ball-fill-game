export interface CircleBody {
  x: number;
  y: number;
  r: number;
}

export interface PointerFollowingBall extends CircleBody {
  pointerFollowActive?: boolean;
  pointerTargetX: number;
  pointerTargetY: number;
  followRate?: number;
}

export interface GrowthFit {
  x: number;
  y: number;
  shift: number;
}

export interface GrowthResult {
  grew: boolean;
  shifted: boolean;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function followPointerTarget(
  ball: PointerFollowingBall,
  deltaSeconds: number,
  width: number,
  height: number,
  placed: readonly CircleBody[],
): void {
  if (!ball.pointerFollowActive) return;

  const targetX = Math.max(ball.r, Math.min(width - ball.r, ball.pointerTargetX));
  const targetY = Math.max(ball.r, Math.min(height - ball.r, ball.pointerTargetY));
  const follow = 1 - Math.exp(-(ball.followRate || 20) * deltaSeconds);
  const nextX = ball.x + (targetX - ball.x) * follow;
  const nextY = ball.y + (targetY - ball.y) * follow;
  const blocked = placed.some(
    candidate => distance(nextX, nextY, candidate.x, candidate.y) < ball.r + candidate.r + 2,
  );

  if (!blocked) {
    ball.x = nextX;
    ball.y = nextY;
  }
}

export function maxGrowthRadius(
  ball: CircleBody,
  placed: readonly CircleBody[],
  width: number,
  height: number,
  minimumRadius: number,
): number {
  let maximum = Math.min(ball.x, width - ball.x, ball.y, height - ball.y);
  for (const candidate of placed) {
    maximum = Math.min(
      maximum,
      distance(ball.x, ball.y, candidate.x, candidate.y) - candidate.r - 2,
    );
  }
  return Math.max(minimumRadius, maximum);
}

export function ballFitsAt(
  x: number,
  y: number,
  radius: number,
  placed: readonly CircleBody[],
  width: number,
  height: number,
  tolerance = 0.15,
): boolean {
  if (
    x < radius - tolerance || x > width - radius + tolerance ||
    y < radius - tolerance || y > height - radius + tolerance
  ) return false;

  return !placed.some(
    candidate => distance(x, y, candidate.x, candidate.y) < radius + candidate.r + 2 - tolerance,
  );
}

export function findNearbyGrowthFit(
  ball: CircleBody,
  targetRadius: number,
  maxShift: number,
  placed: readonly CircleBody[],
  width: number,
  height: number,
): GrowthFit | null {
  if (targetRadius <= 0 || targetRadius > Math.min(width, height) / 2) return null;

  const clampX = (x: number) => Math.max(targetRadius, Math.min(width - targetRadius, x));
  const clampY = (y: number) => Math.max(targetRadius, Math.min(height - targetRadius, y));
  let x = clampX(ball.x);
  let y = clampY(ball.y);

  for (let pass = 0; pass < 12; pass += 1) {
    let adjusted = false;
    const wallX = clampX(x);
    const wallY = clampY(y);
    if (Math.abs(wallX - x) > 0.01 || Math.abs(wallY - y) > 0.01) adjusted = true;
    x = wallX;
    y = wallY;

    for (const candidate of placed) {
      let dx = x - candidate.x;
      let dy = y - candidate.y;
      let currentDistance = Math.hypot(dx, dy);
      const required = targetRadius + candidate.r + 2;
      if (currentDistance >= required - 0.05) continue;

      if (currentDistance < 0.001) {
        dx = width / 2 - candidate.x;
        dy = height / 2 - candidate.y;
        currentDistance = Math.hypot(dx, dy);
        if (currentDistance < 0.001) {
          dx = 1;
          dy = 0;
          currentDistance = 1;
        }
      }

      const push = required - currentDistance + 0.08;
      x += dx / currentDistance * push;
      y += dy / currentDistance * push;
      adjusted = true;
    }

    x = clampX(x);
    y = clampY(y);
    if (ballFitsAt(x, y, targetRadius, placed, width, height)) {
      const shift = Math.hypot(x - ball.x, y - ball.y);
      if (shift <= maxShift + 0.5) return { x, y, shift };
    }
    if (!adjusted) break;
  }

  const inwardAngle = Math.atan2(height / 2 - ball.y, width / 2 - ball.x);
  for (let radius = 2; radius <= maxShift; radius += 2) {
    for (let step = 0; step < 24; step += 1) {
      const offsetStep = step === 0 ? 0 : Math.ceil(step / 2) * (step % 2 ? 1 : -1);
      const angle = inwardAngle + offsetStep * (Math.PI * 2 / 24);
      const candidateX = clampX(ball.x + Math.cos(angle) * radius);
      const candidateY = clampY(ball.y + Math.sin(angle) * radius);
      const shift = Math.hypot(candidateX - ball.x, candidateY - ball.y);
      if (
        shift <= maxShift + 0.5 &&
        ballFitsAt(candidateX, candidateY, targetRadius, placed, width, height)
      ) return { x: candidateX, y: candidateY, shift };
    }
  }

  return null;
}

export function growBallIntoAvailableSpace(
  ball: CircleBody,
  desiredRadius: number,
  placed: readonly CircleBody[],
  width: number,
  height: number,
  shiftLimit?: number,
): GrowthResult {
  const startRadius = ball.r;
  if (desiredRadius <= startRadius + 0.001) return { grew: false, shifted: false };

  const requestedShift = shiftLimit ?? Math.min(48, Math.max(14, 10 + (desiredRadius - startRadius) * 6));
  let bestRadius = startRadius;
  let bestFit: GrowthFit | null = null;
  const fullFit = findNearbyGrowthFit(ball, desiredRadius, requestedShift, placed, width, height);

  if (fullFit) {
    bestRadius = desiredRadius;
    bestFit = fullFit;
  } else {
    let low = startRadius;
    let high = desiredRadius;
    for (let pass = 0; pass < 6; pass += 1) {
      const candidateRadius = (low + high) / 2;
      const candidateFit = findNearbyGrowthFit(
        ball,
        candidateRadius,
        requestedShift,
        placed,
        width,
        height,
      );
      if (candidateFit) {
        low = candidateRadius;
        bestRadius = candidateRadius;
        bestFit = candidateFit;
      } else {
        high = candidateRadius;
      }
    }
  }

  if (!bestFit || bestRadius <= startRadius + 0.01) return { grew: false, shifted: false };
  const shifted = bestFit.shift > 0.08;
  ball.x = bestFit.x;
  ball.y = bestFit.y;
  ball.r = bestRadius;
  return { grew: true, shifted };
}
