export const PACK_PRICE = 25;
export const APEX_BALL_PRICE = 5_000;
export const IMPOSSIBLE_BALL_PRICE = 2_500;

export const STAR_MULTIPLIERS: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 1.5,
  3: 2,
};

export const PACK_POOL = [
  { type: 'normal', weight: 34 },
  { type: 'swift', weight: 18 },
  { type: 'shield', weight: 14 },
  { type: 'coin', weight: 14 },
  { type: 'magnet', weight: 7 },
  { type: 'giant', weight: 5 },
  { type: 'ghost', weight: 4 },
  { type: 'legendary', weight: 4 },
] as const;

export function roundCoinAmount(value: unknown): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatCoinAmount(value: unknown): string {
  const rounded = roundCoinAmount(value);
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
