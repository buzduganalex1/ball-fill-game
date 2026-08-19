import type { BallId } from '../../data/balls';

export interface BallState {
  x: number;
  y: number;
  r: number;
  type?: BallId;
  startR?: number;
  alive?: boolean;
  pointerTargetX?: number;
  pointerTargetY?: number;
  pointerStartX?: number;
  pointerStartY?: number;
  pointerMoveThreshold?: number;
  pointerFollowActive?: boolean;
  followRate?: number;
  shieldHits?: number;
  maxShieldHits?: number;
  shieldCooldown?: number;
  shieldFlash?: number;
  enemyGraceLeft?: number;
  ghostLeft?: number;
  growthAge?: number;
  growthDisplayPoints?: number;
  spawnPunch?: number;
  hapticTravel?: number;
  hapticGrowthStepR?: number;
}

export interface EnemyTrailPoint {
  x: number;
  y: number;
  life?: number;
}

export interface EnemyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  boss: boolean;
  miniBoss: boolean;
  minion: boolean;
  bossIndex: number;
  worldIndex: number;
  maxSpeed: number;
  seekStrength: number;
  trail: EnemyTrailPoint[];
  trailTimer: number;
}

export interface CoinState {
  x: number;
  y: number;
  r: number;
  pulse: number;
  frenzy?: boolean;
}

export interface RunFxState {
  type?: string;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife?: number;
  rotation?: number;
  color?: string;
  vx?: number;
  vy?: number;
}

export interface ImpactRingState {
  x: number;
  y: number;
  color?: string;
  life: number;
  maxR?: number;
}

export interface DefeatSequenceState {
  elapsed: number;
  duration: number;
}

export interface VictorySequenceState {
  elapsed: number;
  duration: number;
}

export interface ActiveRunState {
  running: boolean;
  timeLeft: number;
  ballsLeft: number;
  ballsUsed: number;
  scoreCoins: number;
  placed: BallState[];
  active: BallState | null;
  coins: CoinState[];
  coinFx: RunFxState[];
  enemies: EnemyState[];
  coverage: number;
  liveCoverage: number;
  liveCoverageTimer: number;
  bankedProgressPct: number;
  pendingProgressBanks: number;
  progressStarLevel: number;
  uiSyncTimer: number;
  last: number;
  freezeLeft: number;
  destroyMode: boolean;
  frenzyLeft: number;
  frenzySpawnTimer: number;
  bossAbilityTimer: number;
  bossEffectT: number;
  bossEffectText: string;
  frostDebuffLeft: number;
  minionSurgeLeft: number;
  boosterLockLeft: number;
  predatorBurstLeft: number;
  bossFlashT: number;
  enemyGrowLeft: number;
  solarRushLeft: number;
  toxicLeft: number;
  gravityLeft: number;
  chaosLeft: number;
  slowEnemiesLeft: number;
  instantGrowReady: boolean;
  shakeT: number;
  shakePower: number;
  screenFlashT: number;
  screenFlashColor: string;
  impactRings: ImpactRingState[];
  message: string;
  messageT: number;
  boosterFeedbackT: number;
  boosterFeedbackText: string;
  boosterFeedbackColor: string;
  onboardingLevel: number;
  tutorialActive: boolean;
  defeatSequence: DefeatSequenceState | null;
  victorySequence: VictorySequenceState | null;
  lastWin: boolean;
  settled: boolean;
}

export interface CreateRunInput {
  running: boolean;
  startTime: number;
  startBalls: number;
  bossEncounter: boolean;
  onboardingLevel: number;
  now?: number;
}

/**
 * Removes everything that belongs to the rendered arena while preserving the
 * completed run metrics used by the result screen and campaign progression.
 */
export function clearFinishedRunScene(state: ActiveRunState): void {
  state.active = null;
  state.placed.length = 0;
  state.enemies.length = 0;
  state.coins.length = 0;
  state.coinFx.length = 0;
  state.impactRings.length = 0;
  state.liveCoverage = state.coverage;
  state.liveCoverageTimer = 0;

  state.freezeLeft = 0;
  state.frenzyLeft = 0;
  state.frenzySpawnTimer = 0;
  state.bossEffectT = 0;
  state.bossEffectText = '';
  state.frostDebuffLeft = 0;
  state.minionSurgeLeft = 0;
  state.boosterLockLeft = 0;
  state.predatorBurstLeft = 0;
  state.bossFlashT = 0;
  state.enemyGrowLeft = 0;
  state.solarRushLeft = 0;
  state.toxicLeft = 0;
  state.gravityLeft = 0;
  state.chaosLeft = 0;
  state.slowEnemiesLeft = 0;
  state.instantGrowReady = false;
  state.shakeT = 0;
  state.shakePower = 0;
  state.message = '';
  state.messageT = 0;
  state.boosterFeedbackT = 0;
  state.boosterFeedbackText = '';
  state.defeatSequence = null;
  state.victorySequence = null;
}

export function createActiveRun(input: CreateRunInput): ActiveRunState {
  return {
    running: input.running,
    timeLeft: input.startTime,
    ballsLeft: input.startBalls,
    ballsUsed: 0,
    scoreCoins: 0,
    placed: [],
    active: null,
    coins: [],
    coinFx: [],
    enemies: [],
    coverage: 0,
    liveCoverage: 0,
    liveCoverageTimer: 0,
    bankedProgressPct: 0,
    pendingProgressBanks: 0,
    progressStarLevel: 0,
    uiSyncTimer: 0,
    last: input.now ?? performance.now(),
    freezeLeft: 0,
    destroyMode: false,
    frenzyLeft: 0,
    frenzySpawnTimer: 0,
    bossAbilityTimer: input.bossEncounter ? 4 : 999,
    bossEffectT: 0,
    bossEffectText: '',
    frostDebuffLeft: 0,
    minionSurgeLeft: 0,
    boosterLockLeft: 0,
    predatorBurstLeft: 0,
    bossFlashT: 0,
    enemyGrowLeft: 0,
    solarRushLeft: 0,
    toxicLeft: 0,
    gravityLeft: 0,
    chaosLeft: 0,
    slowEnemiesLeft: 0,
    instantGrowReady: false,
    shakeT: 0,
    shakePower: 0,
    screenFlashT: 0,
    screenFlashColor: '#ffffff',
    impactRings: [],
    message: '',
    messageT: 0,
    boosterFeedbackT: 0,
    boosterFeedbackText: '',
    boosterFeedbackColor: '#63d8ff',
    onboardingLevel: input.onboardingLevel,
    tutorialActive: false,
    defeatSequence: null,
    victorySequence: null,
    lastWin: false,
    settled: false,
  };
}
