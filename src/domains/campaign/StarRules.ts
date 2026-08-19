export const STAR_TIME_LEFT_REQUIRED = 15;
export const STAR_MAX_BALLS_USED = 5;

export type StarCount = 0 | 1 | 2 | 3;
export type StarRequirementKey = 'complete' | 'time' | 'balls';

export interface StarRunInput {
  win: boolean;
  timeLeft: number;
  ballsUsed: number;
  progressPoints: number;
}

export interface StarRequirementResult {
  key: StarRequirementKey;
  passed: boolean;
  actual: string;
}

export interface StarPerformanceReport {
  win: boolean;
  stars: StarCount;
  ballsUsed: number;
  timeLeft: number;
  requirements: StarRequirementResult[];
}

function asNonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function evaluateStarPerformance(input: StarRunInput): StarPerformanceReport {
  const win = Boolean(input.win);
  const ballsUsed = Math.floor(asNonNegative(input.ballsUsed));
  const timeLeft = asNonNegative(input.timeLeft);
  const progressPoints = Math.round(Math.min(100, asNonNegative(input.progressPoints)));
  const requirements: StarRequirementResult[] = [
    {
      key: 'complete',
      passed: win,
      actual: win ? 'Progress goal reached' : `${progressPoints} / 100 progress`,
    },
    {
      key: 'time',
      passed: win && timeLeft >= STAR_TIME_LEFT_REQUIRED,
      actual: `${timeLeft.toFixed(1)}s left • need ${STAR_TIME_LEFT_REQUIRED}s`,
    },
    {
      key: 'balls',
      passed: win && ballsUsed <= STAR_MAX_BALLS_USED,
      actual: `${ballsUsed} ${ballsUsed === 1 ? 'ball' : 'balls'} used • limit ${STAR_MAX_BALLS_USED}`,
    },
  ];

  const earned = win ? requirements.filter(({ passed }) => passed).length : 0;

  return {
    win,
    stars: earned as StarCount,
    ballsUsed,
    timeLeft,
    requirements,
  };
}
