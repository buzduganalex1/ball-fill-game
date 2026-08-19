import { EARLY_LEVEL_CHALLENGES, MAX_LEVEL, isMiniBossLevel, isRushEventLevel } from './encounters';

export interface LevelConfig {
  level: number;
  world: number;
  stage: number;
  boss: boolean;
  miniBoss: boolean;
  rushEvent: boolean;
  count: number;
  minions: number;
  speedMult: number;
  seekStrength: number;
  challenge: string;
  rewardMult: number;
}

function softCap(value: number, knee: number, continuation: number, maximum: number): number {
  if (value <= knee) return value;
  return Math.min(maximum, knee + (value - knee) * continuation);
}

export function levelConfig(levelInput: number): LevelConfig {
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(levelInput)));
  const world = Math.floor((level - 1) / 20);
  const stage = ((level - 1) % 20) + 1;
  const boss = stage === 20;
  const miniBoss = isMiniBossLevel(level);
  const rushEvent = isRushEventLevel(level);

  const legacySpeedMultiplier = 1 + (level - 1) * 0.018;
  const earlySpeedBonus = level <= 10
    ? 0.08
    : (level < 20 ? 0.08 * ((20 - level) / 10) : 0);
  // The old hard 2.4 cap made Levels 79-200 share the same base speed.
  // A soft cap keeps progression perceptible without allowing runaway speed.
  const baseSpeedMultiplier = softCap(legacySpeedMultiplier + earlySpeedBonus, 2.32, 0.28, 3.05);
  const speedMult = baseSpeedMultiplier * (rushEvent ? 1.24 : (miniBoss ? 1.08 : 1));

  const legacySeekStrength = 0.14 + (level - 1) * 0.006;
  const earlySeekBonus = level <= 10
    ? 0.06
    : (level < 20 ? 0.06 * ((20 - level) / 10) : 0);
  const seekStrength = softCap(
    legacySeekStrength + earlySeekBonus + (rushEvent ? 0.08 : (miniBoss ? 0.05 : 0)),
    0.72,
    0.32,
    0.94,
  );

  const challenge = boss
    ? 'BOSS BATTLE'
    : (miniBoss
        ? 'MINI BOSS'
        : (rushEvent
            ? '⚡ ENEMY RUSH'
            : (EARLY_LEVEL_CHALLENGES[level - 1] || `WORLD ${world + 1} PUSH`)));

  if (boss) {
    const minions = Math.min(4, 2 + world);
    return {
      level, world, stage, boss: true, miniBoss: false, rushEvent: false,
      count: 1 + minions, minions, speedMult, seekStrength, challenge, rewardMult: 1,
    };
  }

  if (miniBoss) {
    const minions = Math.min(4, 3 + Math.floor(world / 5));
    return {
      level, world, stage, boss: false, miniBoss: true, rushEvent: false,
      count: 1 + minions, minions, speedMult, seekStrength, challenge, rewardMult: 1.35,
    };
  }

  const baseCount = world === 0
    ? Math.min(7, 3 + Math.floor((stage - 1) / 2))
    : Math.min(8, 3 + Math.floor((stage - 1) / 3) + Math.floor(world / 2));
  const count = Math.min(8, baseCount + (rushEvent ? 1 : 0));

  return {
    level, world, stage, boss: false, miniBoss: false, rushEvent,
    count, minions: 0, speedMult, seekStrength, challenge,
    rewardMult: rushEvent ? 1.15 : 1,
  };
}
