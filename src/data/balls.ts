export const BALL_IDS = [
  'normal',
  'swift',
  'shield',
  'magnet',
  'coin',
  'giant',
  'ghost',
  'legendary',
  'apex',
  'cataclysm',
  'gaia',
] as const;

export type BallId = (typeof BALL_IDS)[number];
export type BallRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Impossible';

export interface BallDefinition {
  name: string;
  short: string;
  rarity: BallRarity;
  growthMult: number;
  fill: string;
  edge: string;
  highlight: string;
  desc: string;
  shieldHits?: number;
  coinMult?: number;
  startSizeMult?: number;
  ghostTime?: number;
  magnetRange?: number;
}

export const BALL_TYPES: Record<BallId, BallDefinition> = {
  normal: {
    name: 'Normal Ball', short: 'Normal', rarity: 'Common', growthMult: 1,
    fill: '#67afd0', edge: '#3990ba', highlight: '#a8def1',
    desc: 'Reliable standard ball.',
  },
  swift: {
    name: 'Swift Ball', short: 'Swift', rarity: 'Rare', growthMult: 1.06,
    fill: '#67c7a2', edge: '#2b9972', highlight: '#b8f0d8',
    desc: 'Grows 6% faster.',
  },
  shield: {
    name: 'Shield Ball', short: 'Shield', rarity: 'Rare', growthMult: 0.98,
    shieldHits: 1, fill: '#8a91df', edge: '#5963bb', highlight: '#c9cdf8',
    desc: 'Survives one enemy hit.',
  },
  magnet: {
    name: 'Magnet Ball', short: 'Magnet', rarity: 'Epic', growthMult: 1.02,
    fill: '#be78d8', edge: '#8641a2', highlight: '#ecc5f7',
    desc: 'Pulls nearby coins toward it.',
  },
  coin: {
    name: 'Coin Ball', short: 'Coin', rarity: 'Rare', growthMult: 1,
    fill: '#f1c84d', edge: '#b58e16', highlight: '#fff0a8', coinMult: 1.25,
    desc: 'Coins collected are worth 25% more.',
  },
  giant: {
    name: 'Giant Ball', short: 'Giant', rarity: 'Epic', growthMult: 0.94,
    startSizeMult: 1.25, fill: '#d8845c', edge: '#9e5334', highlight: '#f2b59b',
    desc: 'Starts 25% larger but grows slightly slower.',
  },
  ghost: {
    name: 'Ghost Ball', short: 'Ghost', rarity: 'Epic', growthMult: 1,
    ghostTime: 1.2, fill: '#9ccfe2', edge: '#5797ae', highlight: '#d9f2fb',
    desc: 'Enemies pass through it for 1.2 seconds after spawning.',
  },
  legendary: {
    name: 'Legendary Ball', short: 'Legendary', rarity: 'Legendary', growthMult: 1.1,
    fill: '#f39a2f', edge: '#bd5b0c', highlight: '#ffd77a',
    desc: 'Grows 10% faster with a rare aura.',
  },
  apex: {
    name: 'Apex Ball', short: 'Apex', rarity: 'Mythic', growthMult: 1.35,
    startSizeMult: 1.35, fill: '#0d101b', edge: '#ff4fd8', highlight: '#9fd8ff',
    coinMult: 2, shieldHits: 2, magnetRange: 230, ghostTime: 2.5,
    desc: 'Mythic store exclusive: huge start, giant magnet, double coin value, ghost phase and two-hit shield.',
  },
  cataclysm: {
    name: 'Cataclysm Ball', short: 'Cataclysm', rarity: 'Impossible', growthMult: 1.24,
    startSizeMult: 1.18, fill: '#b61920', edge: '#ff4b36', highlight: '#ffd36a',
    coinMult: 1.25, shieldHits: 1, ghostTime: 0.75,
    desc: 'Impossible store exclusive: fire core, electric shell and icy energy. Fast growth with one shield hit and a brief ghost phase.',
  },
  gaia: {
    name: 'Gaia Ball', short: 'Gaia', rarity: 'Impossible', growthMult: 1.2,
    startSizeMult: 1.25, fill: '#267a3c', edge: '#5fdc72', highlight: '#c7f59a',
    coinMult: 1.4, shieldHits: 1, magnetRange: 185,
    desc: 'Impossible store exclusive: living nature energy. Starts huge, pulls coins, boosts coin value and carries one protective shell.',
  },
};

export const BALL_BENEFITS: Record<BallId, string> = {
  normal: 'BALANCED GROWTH',
  swift: '+6% GROWTH SPEED',
  shield: 'BLOCKS 1 ENEMY HIT',
  magnet: 'PULLS NEARBY COINS',
  coin: '+25% COIN VALUE',
  giant: '+25% START SIZE',
  ghost: '1.2s GHOST PHASE',
  legendary: '+10% GROWTH SPEED',
  apex: '2× COINS • 2 SHIELDS',
  cataclysm: '+24% GROWTH • 1 SHIELD',
  gaia: '+40% COINS • MAGNET',
};

export const BALL_ASSET_PATHS: Record<BallId, string> = Object.freeze(
  Object.fromEntries(BALL_IDS.map(id => [id, `assets/balls/${id}.png`])) as Record<BallId, string>,
);

export function isBallId(value: unknown): value is BallId {
  return typeof value === 'string' && (BALL_IDS as readonly string[]).includes(value);
}
