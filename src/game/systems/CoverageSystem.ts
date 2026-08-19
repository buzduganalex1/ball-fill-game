import type { CircleBody } from './GrowthSystem';

export interface PerformanceInputs {
  coverage: number;
  targetCoverage: number;
  timeLeft: number;
  startTime: number;
  ballsLeft: number;
  startBalls: number;
}

export function measureCoverage(
  balls: readonly CircleBody[],
  width: number,
  height: number,
  samplesPerAxis = 110,
): number {
  let hit = 0;
  for (let gridY = 0; gridY < samplesPerAxis; gridY += 1) {
    const y = (gridY + 0.5) * height / samplesPerAxis;
    for (let gridX = 0; gridX < samplesPerAxis; gridX += 1) {
      const x = (gridX + 0.5) * width / samplesPerAxis;
      if (balls.some(ball => {
        const dx = x - ball.x;
        const dy = y - ball.y;
        return dx * dx + dy * dy <= ball.r * ball.r;
      })) hit += 1;
    }
  }
  return hit / (samplesPerAxis * samplesPerAxis) * 100;
}

export function performanceScore(inputs: PerformanceInputs): number {
  const coverageProgress = Math.min(1, inputs.coverage / inputs.targetCoverage);
  const timeRatio = Math.max(0, inputs.timeLeft / inputs.startTime);
  const ballRatio = Math.max(0, inputs.ballsLeft / inputs.startBalls);
  return coverageProgress * 0.58 + timeRatio * 0.18 + ballRatio * 0.24;
}

export function liveStarCount(inputs: PerformanceInputs): number {
  const score = performanceScore(inputs);
  if (score >= 0.82) return 3;
  if (score >= 0.58) return 2;
  if (score >= 0.34) return 1;
  return 0;
}
