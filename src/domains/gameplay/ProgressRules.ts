export const TARGET_COVERAGE = 30;
export const PROGRESS_CHECKPOINTS = [33.333, 66.666, 99.95] as const;

export function progressPointsFromCoverage(coverage: number): number {
  const normalized = Number.isFinite(coverage) ? coverage : 0;
  return Math.max(0, Math.min(100, (normalized / TARGET_COVERAGE) * 100));
}

export function progressSegments(progressPoints: number): [number, number, number] {
  const progress = Math.max(0, Math.min(100, progressPoints));
  return [
    Math.max(0, Math.min(100, (progress / 33.333) * 100)),
    Math.max(0, Math.min(100, ((progress - 33.333) / 33.333) * 100)),
    Math.max(0, Math.min(100, ((progress - 66.666) / 33.334) * 100)),
  ];
}

export function progressStarCount(progressPoints: number, previousStars = 0): 0 | 1 | 2 | 3 {
  const progress = Math.max(0, Math.min(100, progressPoints));
  const previous = Math.max(0, Math.min(3, Math.floor(previousStars))) as 0 | 1 | 2 | 3;
  const raw: 0 | 1 | 2 | 3 = progress >= PROGRESS_CHECKPOINTS[2]
    ? 3
    : progress >= PROGRESS_CHECKPOINTS[1]
      ? 2
      : progress >= PROGRESS_CHECKPOINTS[0]
        ? 1
        : 0;
  const previousThreshold = previous === 0 ? 0 : PROGRESS_CHECKPOINTS[previous - 1];
  return raw < previous && progress >= previousThreshold - 1.25 ? previous : raw;
}
