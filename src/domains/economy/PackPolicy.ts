import { PACK_POOL, PACK_PRICE, roundCoinAmount } from '../../data/economy';
import type { BallId } from '../../data/balls';

export interface PurchaseDecision {
  allowed: boolean;
  price: number;
  balanceBefore: number;
  balanceAfter: number;
  missingCoins: number;
}

export function evaluatePurchase(balance: number, price = PACK_PRICE): PurchaseDecision {
  const balanceBefore = Math.max(0, roundCoinAmount(balance));
  const normalizedPrice = Math.max(0, roundCoinAmount(price));
  const allowed = balanceBefore >= normalizedPrice;
  return {
    allowed,
    price: normalizedPrice,
    balanceBefore,
    balanceAfter: allowed ? roundCoinAmount(balanceBefore - normalizedPrice) : balanceBefore,
    missingCoins: allowed ? 0 : roundCoinAmount(normalizedPrice - balanceBefore),
  };
}

export function rollPackBall(random: () => number = Math.random): BallId {
  const totalWeight = PACK_POOL.reduce((total, entry) => total + entry.weight, 0);
  let roll = Math.max(0, Math.min(0.999999999, random())) * totalWeight;
  for (const entry of PACK_POOL) {
    roll -= entry.weight;
    if (roll <= 0) return entry.type;
  }
  return 'normal';
}
