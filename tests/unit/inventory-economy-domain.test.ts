import { describe, expect, it } from 'vitest';
import { evaluatePurchase, rollPackBall } from '../../src/domains/economy/PackPolicy';
import { resolveEquippedBall } from '../../src/domains/inventory/InventoryRules';
import { formatCoinAmount, roundCoinAmount } from '../../src/data/economy';

describe('inventory and pack rules', () => {
  it('falls back to the first owned ball when the equipped ball is unavailable', () => {
    expect(resolveEquippedBall(new Set(['swift', 'coin']), 'apex')).toBe('swift');
  });

  it('returns a complete purchase decision without mutating a wallet', () => {
    expect(evaluatePurchase(20, 25)).toEqual({
      allowed: false,
      price: 25,
      balanceBefore: 20,
      balanceAfter: 20,
      missingCoins: 5,
    });
    expect(evaluatePurchase(30, 25).balanceAfter).toBe(5);
  });

  it('uses the configured pack weights at both ends of the random range', () => {
    expect(rollPackBall(() => 0)).toBe('normal');
    expect(rollPackBall(() => 0.999999)).toBe('legendary');
  });

  it('keeps every wallet and reward amount on whole coins', () => {
    expect(roundCoinAmount(12.49)).toBe(12);
    expect(roundCoinAmount(12.5)).toBe(13);
    expect(formatCoinAmount(326.97)).toBe('327');
  });
});
