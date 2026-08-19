import { STAR_MULTIPLIERS, roundCoinAmount } from '../../data/economy';
import type { StarCount } from '../campaign/StarRules';

export interface RunRewardInput {
  win: boolean;
  runCoins: number;
  stars: StarCount;
  encounterMultiplier: number;
}

export interface RunRewardSummary {
  baseCoins: number;
  multiplier: number;
  payout: number;
}

export function calculateRunReward(input: RunRewardInput): RunRewardSummary {
  const baseCoins = Math.max(0, roundCoinAmount(input.runCoins));
  if (!input.win) {
    return { baseCoins, multiplier: 1, payout: 0 };
  }

  if (input.stars < 1) {
    throw new Error('A completed run must earn at least one star.');
  }

  const stars = input.stars as 1 | 2 | 3;
  const encounterMultiplier = Math.max(0, Number(input.encounterMultiplier) || 0);
  const multiplier = STAR_MULTIPLIERS[stars] * encounterMultiplier;

  return {
    baseCoins,
    multiplier,
    payout: roundCoinAmount(baseCoins * multiplier),
  };
}
