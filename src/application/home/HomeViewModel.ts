import { BALL_IDS, BALL_TYPES, type BallId } from '../../data/balls';
import { PACK_PRICE, formatCoinAmount, roundCoinAmount } from '../../data/economy';
import { MAX_LEVEL, encounterProfileForLevel, worldProfileForLevel } from '../../data/encounters';
import { levelConfig } from '../../data/levels';
import {
  LEVELS_PER_WORLD,
  WORLD_COUNT,
  WORLD_NAMES,
  WORLD_STAR_CAP,
  WORLD_UNLOCK_STARS,
  type LevelProgressRecord,
  isLevelUnlocked,
  isWorldUnlocked,
  starsInWorld,
  worldIndexForLevel,
  worldLevelRange,
} from '../../domains/campaign/WorldProgression';

export interface HomeViewModelInput {
  currentLevel: number;
  walletCoins: number;
  ownedBallCount: number;
  equippedBallId: BallId;
  resultOpen: boolean;
  resumeAvailable: boolean;
  starterPackOpened: boolean;
  highestCompletedLevel?: number;
  levelProgress?: readonly LevelProgressRecord[];
  grandfatheredWorldCount?: number;
}

export interface HomeLevelMapItem {
  level: number;
  stage: number;
  challenge: string;
  stars: number;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
  boss: boolean;
  miniBoss: boolean;
  rushEvent: boolean;
  attempts: number;
  bestTime: string;
  bestBalls: string;
  bestCoins: string;
}

export interface HomeWorldMapItem {
  index: number;
  number: number;
  name: string;
  bossName: string;
  unlocked: boolean;
  stars: number;
  starCap: number;
  unlockStars: number;
  starsNeeded: number;
  progressPercent: number;
  gateCopy: string;
  fill: string;
  edge: string;
  glow: string;
  levels: HomeLevelMapItem[];
}

export interface HomeViewModel {
  gold: string;
  currentLevel: number;
  ownedBallCount: number;
  ownedBallCopy: string;
  equippedBallId: BallId;
  equippedBallName: string;
  levelTitle: string;
  levelEvent: string;
  playLabel: string;
  worldLabel: string;
  worldProgress: string;
  journeyProgressPercent: number;
  nextMilestone: string;
  activeWorldIndex: number;
  worlds: HomeWorldMapItem[];
  packProgressPercent: number;
  canBuyPack: boolean;
  nearPack: boolean;
  packTitle: string;
  packCopy: string;
  packCta: string;
}

export function buildHomeViewModel(input: HomeViewModelInput): HomeViewModel {
  const config = levelConfig(input.currentLevel);
  const equipped = BALL_TYPES[input.equippedBallId] ?? BALL_TYPES.normal;
  const stage = ((input.currentLevel - 1) % 20) + 1;
  const canBuyPack = input.starterPackOpened && input.walletCoins >= PACK_PRICE;
  const packProgressPercent = Math.max(0, Math.min(100, (input.walletCoins / PACK_PRICE) * 100));
  const currentEncounter = encounterProfileForLevel(input.currentLevel);
  const levelProgress = input.levelProgress ?? [];
  const highestCompletedLevel = input.highestCompletedLevel ?? Math.max(0, input.currentLevel - 1);
  const grandfatheredWorldCount = input.grandfatheredWorldCount ?? 1;
  let nextMilestoneLevel = 0;
  let nextMilestoneProfile: ReturnType<typeof encounterProfileForLevel> = null;

  for (let level = input.currentLevel + 1; level <= MAX_LEVEL; level += 1) {
    const profile = encounterProfileForLevel(level);
    if (!profile) continue;
    nextMilestoneLevel = level;
    nextMilestoneProfile = profile;
    break;
  }

  const needed = Math.max(0, roundCoinAmount(PACK_PRICE - input.walletCoins));
  const worlds: HomeWorldMapItem[] = Array.from({ length: WORLD_COUNT }, (_, index) => {
    const range = worldLevelRange(index);
    const profile = worldProfileForLevel(range.start);
    const stars = starsInWorld(levelProgress, index);
    const unlocked = isWorldUnlocked(index, levelProgress, grandfatheredWorldCount);
    const nextWorldUnlocked = index === WORLD_COUNT - 1
      ? false
      : isWorldUnlocked(index + 1, levelProgress, grandfatheredWorldCount);
    const levels: HomeLevelMapItem[] = Array.from({ length: LEVELS_PER_WORLD }, (_, offset) => {
      const level = range.start + offset;
      const config = levelConfig(level);
      const record = levelProgress.find(item => item.level === level);
      const levelUnlocked = isLevelUnlocked(
        level,
        levelProgress,
        highestCompletedLevel,
        grandfatheredWorldCount,
      );
      return {
        level,
        stage: offset + 1,
        challenge: config.challenge,
        stars: record?.stars ?? 0,
        completed: (record?.stars ?? 0) > 0,
        unlocked: levelUnlocked,
        current: level === input.currentLevel,
        boss: config.boss,
        miniBoss: config.miniBoss,
        rushEvent: config.rushEvent,
        attempts: record?.attempts ?? 0,
        bestTime: record?.bestTimeLeft ? `${record.bestTimeLeft.toFixed(1)}s` : '—',
        bestBalls: record?.fewestBallsUsed ? String(record.fewestBallsUsed) : '—',
        bestCoins: record?.bestCoins ? formatCoinAmount(record.bestCoins) : '—',
      };
    });
    const starsNeeded = Math.max(0, WORLD_UNLOCK_STARS - stars);
    const gateCopy = !unlocked
      ? `LOCKED • EARN ${WORLD_UNLOCK_STARS} STARS IN WORLD ${index}`
      : index === WORLD_COUNT - 1
        ? 'FINAL WORLD • MASTER EVERY LEVEL'
        : nextWorldUnlocked
          ? `WORLD ${index + 2} UNLOCKED`
          : `${stars} / ${WORLD_STAR_CAP} STARS • ${starsNeeded} MORE TO UNLOCK WORLD ${index + 2}`;
    return {
      index,
      number: index + 1,
      name: WORLD_NAMES[index] ?? `World ${index + 1}`,
      bossName: profile.name,
      unlocked,
      stars,
      starCap: WORLD_STAR_CAP,
      unlockStars: WORLD_UNLOCK_STARS,
      starsNeeded,
      progressPercent: Math.max(0, Math.min(100, stars / WORLD_STAR_CAP * 100)),
      gateCopy,
      fill: profile.fill,
      edge: profile.edge,
      glow: profile.glow,
      levels,
    };
  });

  return {
    gold: formatCoinAmount(input.walletCoins),
    currentLevel: input.currentLevel,
    ownedBallCount: input.ownedBallCount,
    ownedBallCopy: `${input.ownedBallCount} of ${BALL_IDS.length} balls collected`,
    equippedBallId: input.equippedBallId,
    equippedBallName: equipped.name,
    levelTitle: `LEVEL ${input.currentLevel}`,
    levelEvent: `${config.challenge} • WORLD ${config.world + 1}`,
    playLabel: input.resultOpen
      ? `▶ VIEW LEVEL ${input.currentLevel} RESULT`
      : `${input.resumeAvailable ? '▶ RESUME' : '▶ PLAY'} LEVEL ${input.currentLevel}`,
    worldLabel: `WORLD ${config.world + 1}`,
    worldProgress: `${stage} / 20`,
    journeyProgressPercent: (stage / 20) * 100,
    nextMilestone: currentEncounter
      ? `CURRENT EVENT • ${currentEncounter.eyebrow} • ${currentEncounter.mechanic}`
      : nextMilestoneProfile
        ? `NEXT EVENT • LEVEL ${nextMilestoneLevel} ${nextMilestoneProfile.name.toUpperCase()}`
        : 'FINAL WORLD • THE LAST BOSS AWAITS',
    activeWorldIndex: worldIndexForLevel(input.currentLevel),
    worlds,
    packProgressPercent,
    canBuyPack,
    nearPack: !canBuyPack && input.walletCoins >= PACK_PRICE * 0.72,
    packTitle: canBuyPack ? 'YOUR NEXT PACK IS READY!' : `${formatCoinAmount(needed)} GOLD TO NEXT PACK`,
    packCopy: canBuyPack
      ? 'You have enough gold. Reveal a new ball now.'
      : 'Keep playing or visit the store to see every reward.',
    packCta: canBuyPack ? 'OPEN NOW' : 'VIEW STORE',
  };
}
