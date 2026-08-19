export const BOOSTER_IDS = [
  'moreBalls',
  'moreTime',
  'destroyBall',
  'freeze',
  'coinFrenzy',
  'slowEnemies',
  'coinBurst',
  'instantGrow',
  'panicClear',
] as const;

export type BoosterId = (typeof BOOSTER_IDS)[number];

export interface BoosterDefinition {
  icon: string;
  name: string;
  cooldown: number;
  unlockLevel: number;
  color: string;
}

export const BOOSTERS: Record<BoosterId, BoosterDefinition> = {
  moreBalls: { icon: '➕', name: '+3 Balls', cooldown: 10, unlockLevel: 20, color: '#62ddff' },
  moreTime: { icon: '⏱', name: '+10 Seconds', cooldown: 10, unlockLevel: 40, color: '#70f3d0' },
  destroyBall: { icon: '💥', name: 'Destroy Enemy', cooldown: 6, unlockLevel: 60, color: '#ff9b68' },
  freeze: { icon: '❄', name: 'Freeze Enemies', cooldown: 8, unlockLevel: 80, color: '#9fe8ff' },
  coinFrenzy: { icon: '🧲', name: 'Coin Frenzy', cooldown: 10, unlockLevel: 100, color: '#b49aff' },
  slowEnemies: { icon: '🐌', name: 'Slow Enemies', cooldown: 9, unlockLevel: 140, color: '#8ee9ed' },
  coinBurst: { icon: '🪙', name: 'Coin Burst', cooldown: 10, unlockLevel: 160, color: '#ffd85d' },
  instantGrow: { icon: '⚡', name: 'Growth Burst', cooldown: 8, unlockLevel: 180, color: '#fff08b' },
  panicClear: { icon: '🌟', name: 'Panic Clear', cooldown: 12, unlockLevel: 200, color: '#ffffff' },
};

export function isBoosterId(value: unknown): value is BoosterId {
  return typeof value === 'string' && (BOOSTER_IDS as readonly string[]).includes(value);
}
