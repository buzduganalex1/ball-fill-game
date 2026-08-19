export const MAX_LEVEL = 200;
export const BOSS_LEVELS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200] as const;

export const MINI_BOSS_NAMES = [
  'Crimson Fang', 'Frost Sentinel', 'Clockwork Brute', 'Storm Herald', 'Void Stalker',
  'Thorn Behemoth', 'Solar Ravager', 'Toxic Marauder', 'Nebula Phantom', 'Prismatic Knight',
] as const;

export interface BossProfile {
  name: string;
  fill: string;
  edge: string;
  glow: string;
  trail: string;
  minionFill: string;
  minionEdge: string;
  mechanic: string;
  description: string;
  interval: number;
}

export const BOSS_PROFILES: Record<number, BossProfile> = {
  1: {
    name: 'Crimson Hunter', fill: '#9f263d', edge: '#ff6c78', glow: '#ff4d62', trail: '#ff536c',
    minionFill: '#d64c57', minionEdge: '#9f263d', mechanic: 'PREDATOR LOCK',
    description: 'Charges the ball whenever you begin growing it.', interval: 8,
  },
  2: {
    name: 'Frost Warden', fill: '#227ca0', edge: '#8ceaff', glow: '#54d7ff', trail: '#65dcff',
    minionFill: '#5ca9c8', minionEdge: '#28718d', mechanic: 'FROST CURSE',
    description: 'Slows growth dramatically for a short time.', interval: 9,
  },
  3: {
    name: 'Chrono Tyrant', fill: '#8d6a1d', edge: '#ffd262', glow: '#ffc246', trail: '#ffcf5d',
    minionFill: '#c79b3d', minionEdge: '#87661f', mechanic: 'TIME RIP',
    description: 'Steals seconds from the timer.', interval: 9,
  },
  4: {
    name: 'Storm Sovereign', fill: '#394f9f', edge: '#ffe55c', glow: '#ffe45e', trail: '#82a6ff',
    minionFill: '#6078c9', minionEdge: '#354985', mechanic: 'MINION SURGE',
    description: 'Enrages minions with a temporary speed burst.', interval: 8,
  },
  5: {
    name: 'Void Emperor', fill: '#26133f', edge: '#dc72ff', glow: '#a85bff', trail: '#bd6cff',
    minionFill: '#5d3477', minionEdge: '#321943', mechanic: 'VOID SILENCE',
    description: 'Temporarily locks all boosters.', interval: 9,
  },
  6: {
    name: 'Verdant Devourer', fill: '#23663d', edge: '#70f09e', glow: '#48dc7e', trail: '#65e896',
    minionFill: '#4e9b68', minionEdge: '#225b37', mechanic: 'OVERGROWTH',
    description: 'Briefly makes enemies larger and harder to dodge.', interval: 9,
  },
  7: {
    name: 'Solar Colossus', fill: '#a34b19', edge: '#ffb64f', glow: '#ff892e', trail: '#ff9a3d',
    minionFill: '#d17635', minionEdge: '#8e431d', mechanic: 'SOLAR FLARE',
    description: 'Flashes the arena and accelerates the boss.', interval: 8,
  },
  8: {
    name: 'Toxic Oracle', fill: '#53731b', edge: '#c9ff54', glow: '#a7e836', trail: '#b4f24a',
    minionFill: '#7f9f39', minionEdge: '#4b661b', mechanic: 'TOXIC DRAIN',
    description: 'Temporarily reduces coin value and growth speed.', interval: 9,
  },
  9: {
    name: 'Nebula Reaper', fill: '#214f72', edge: '#71dfff', glow: '#5cbcff', trail: '#69d2ff',
    minionFill: '#477c9c', minionEdge: '#214d6c', mechanic: 'GRAVITY WELL',
    description: 'Pulls the active ball toward the boss.', interval: 8,
  },
  10: {
    name: 'Prismatic Overlord', fill: '#5b2d72', edge: '#ff8be8', glow: '#ff6fcd', trail: '#8fe8ff',
    minionFill: '#805397', minionEdge: '#4f2865', mechanic: 'CHAOS PULSE',
    description: 'Combines multiple weaker debuffs in quick succession.', interval: 7,
  },
};

export interface EncounterProfile extends Partial<BossProfile> {
  type: 'boss' | 'miniBoss' | 'rush';
  name: string;
  fill: string;
  edge: string;
  glow: string;
  mechanic: string;
  description: string;
  eyebrow: string;
  icon: string;
  tip: string;
  button: string;
}

export function worldProfileForLevel(level: number): BossProfile {
  const worldIndex = Math.max(1, Math.min(10, Math.floor((Math.max(1, level) - 1) / 20) + 1));
  return BOSS_PROFILES[worldIndex] ?? BOSS_PROFILES[1];
}

export function bossProfileForLevel(level: number): BossProfile | null {
  return (BOSS_LEVELS as readonly number[]).includes(level) ? worldProfileForLevel(level) : null;
}

export function isMiniBossLevel(level: number): boolean {
  return level % 10 === 0 && !(BOSS_LEVELS as readonly number[]).includes(level);
}

export function isRushEventLevel(level: number): boolean {
  return level % 5 === 0 && level % 10 !== 0;
}

export function encounterProfileForLevel(level: number): EncounterProfile | null {
  const worldProfile = worldProfileForLevel(level);
  if ((BOSS_LEVELS as readonly number[]).includes(level)) {
    return {
      ...worldProfile, type: 'boss', eyebrow: 'BOSS INCOMING', icon: '⚠',
      tip: 'A major boss guards the end of this world. Prepare.', button: "I'M READY • FIGHT!",
    };
  }
  if (isMiniBossLevel(level)) {
    const worldIndex = Math.max(0, Math.min(MINI_BOSS_NAMES.length - 1, Math.floor((level - 1) / 20)));
    return {
      ...worldProfile, type: 'miniBoss', name: MINI_BOSS_NAMES[worldIndex],
      mechanic: 'RELENTLESS HUNTER',
      description: 'A crowned elite hunts every growing ball while its guards close in.',
      eyebrow: 'MINI BOSS INCOMING', icon: '♛', tip: 'Defeat it for a 35% gold bonus.',
      button: 'FACE THE MINI BOSS!',
    };
  }
  if (isRushEventLevel(level)) {
    return {
      type: 'rush', name: 'ENEMY RUSH', fill: '#a94d12', edge: '#ffd15a', glow: '#ff9e38',
      mechanic: 'ENEMY OVERDRIVE',
      description: 'Enemies move 24% faster and one extra hunter joins the arena.',
      eyebrow: '5-LEVEL EVENT', icon: '⚡', tip: 'Survive the rush for a 15% gold bonus.',
      button: "LET'S GO • START!",
    };
  }
  return null;
}

export const EARLY_LEVEL_CHALLENGES = [
  'FIRST FILL', 'KEEP MOVING', 'FOUR CORNERS', 'TIGHT SPACES', 'SWARM ARRIVES',
  'FIND THE GAP', 'CROWD CONTROL', 'HUNTER PRESSURE', 'SURVIVE SEVEN', 'FIRST TRIAL',
] as const;
