import { BALL_TYPES, type BallId } from '../../data/balls';
import { encounterProfileForLevel, worldProfileForLevel } from '../../data/encounters';
import { levelConfig } from '../../data/levels';
import { progressPointsFromCoverage, progressSegments, progressStarCount } from '../../domains/gameplay/ProgressRules';

export interface GameplayHudInput {
  currentLevel: number;
  onboardingLevel: number;
  enemyCount: number;
  timeLeft: number;
  ballsLeft: number;
  equippedBallId: BallId;
  displayedCoverage: number;
  previousProgressStars: number;
  boosterFeedbackTime: number;
  boosterFeedbackText: string;
  boosterFeedbackColor: string;
  frenzyTime: number;
}

export interface GameplayHudViewModel {
  levelChallenge: string;
  difficulty: string;
  difficultyColor: string;
  rushEvent: boolean;
  miniBoss: boolean;
  enemyCount: number;
  time: string;
  ballsLeft: number;
  ballLabel: string;
  ballTitle: string;
  displayedCoverage: string;
  progressPoints: number;
  segments: [number, number, number];
  progressStars: 0 | 1 | 2 | 3;
  boosterText: string;
  boosterColor: string;
  boosterMode: 'active' | 'countdown' | 'idle';
}

export function buildGameplayHudViewModel(input: GameplayHudInput): GameplayHudViewModel {
  const config = levelConfig(input.currentLevel);
  const world = worldProfileForLevel(input.currentLevel);
  const guidedLevel = input.onboardingLevel;
  const equipped = BALL_TYPES[input.equippedBallId] ?? BALL_TYPES.normal;
  const progressPoints = progressPointsFromCoverage(input.displayedCoverage);
  const encounter = encounterProfileForLevel(input.currentLevel);
  const difficulty = guidedLevel === 1
    ? 'Safe practice • No enemies'
    : guidedLevel === 2
      ? '1 slow enemy • Learn to protect your ball'
      : config.boss
        ? `${world.name} • ${config.minions} minions • Speed ×${config.speedMult.toFixed(2)}`
        : config.miniBoss
          ? `${encounter?.name ?? 'Mini Boss'} • ${config.minions} guards • Gold ×${config.rewardMult.toFixed(2)}`
          : config.rushEvent
            ? `Enemy Rush • ${config.count} enemies • Speed ×${config.speedMult.toFixed(2)} • Gold ×${config.rewardMult.toFixed(2)}`
            : `World ${config.world + 1} • ${config.count} enemies • Speed ×${config.speedMult.toFixed(2)} • Reaction ${config.seekStrength.toFixed(2)}`;
  const boosterMode = input.boosterFeedbackTime > 0
    ? 'active'
    : input.frenzyTime > 0
      ? 'countdown'
      : 'idle';

  return {
    levelChallenge: guidedLevel === 1
      ? 'LEVEL 1 • LEARN TO FILL'
      : guidedLevel === 2
        ? 'LEVEL 2 • PROTECT YOUR BALL'
        : `LEVEL ${input.currentLevel} • ${config.challenge}`,
    difficulty,
    difficultyColor: world.fill,
    rushEvent: !guidedLevel && config.rushEvent,
    miniBoss: !guidedLevel && config.miniBoss,
    enemyCount: input.enemyCount,
    time: guidedLevel === 1 ? '—' : input.timeLeft.toFixed(1),
    ballsLeft: input.ballsLeft,
    ballLabel: `Open collection. ${equipped.name} equipped. ${input.ballsLeft} balls left.`,
    ballTitle: `${equipped.name} equipped • Open collection`,
    displayedCoverage: input.displayedCoverage.toFixed(1),
    progressPoints,
    segments: progressSegments(progressPoints),
    progressStars: progressStarCount(progressPoints, input.previousProgressStars),
    boosterText: boosterMode === 'active'
      ? input.boosterFeedbackText
      : boosterMode === 'countdown'
        ? `🧲 ${input.frenzyTime.toFixed(1)}s`
        : '',
    boosterColor: input.boosterFeedbackColor,
    boosterMode,
  };
}
