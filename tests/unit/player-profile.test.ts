import { describe, expect, it, vi } from 'vitest';
import { createSaveCoordinator } from '../../src/application/profile/SaveCoordinator';
import { playerProfileToSaveData } from '../../src/domains/profile/PlayerProfile';

describe('player profile persistence', () => {
  it('creates the versioned save snapshot at the domain boundary', () => {
    const save = playerProfileToSaveData({
      currentLevel: 7,
      highestCompletedLevel: 6,
      walletCoins: 12.345,
      ownedBallIds: new Set(['normal', 'swift']),
      equippedBallId: 'swift',
      unlockedBoosterIds: new Set(['moreBalls']),
      starterPackOpened: true,
      tutorialSeen: true,
      firstPackMilestoneSeen: false,
      soundEnabled: false,
      reducedMotion: true,
    });

    expect(save.walletCoins).toBe(12);
    expect(save.ownedBallIds).toEqual(['normal', 'swift']);
    expect(save.settings).toEqual({ soundEnabled: false, reducedMotion: true });
  });

  it('coalesces several queued writes into one microtask', async () => {
    const save = playerProfileToSaveData({
      currentLevel: 1,
      highestCompletedLevel: 0,
      walletCoins: 0,
      ownedBallIds: [],
      equippedBallId: 'normal',
      unlockedBoosterIds: [],
      starterPackOpened: false,
      tutorialSeen: false,
      firstPackMilestoneSeen: false,
      soundEnabled: true,
      reducedMotion: false,
    });
    const writer = vi.fn(async () => undefined);
    const coordinator = createSaveCoordinator(() => save, writer);
    coordinator.queue();
    coordinator.queue();
    coordinator.queue();
    await Promise.resolve();
    await Promise.resolve();
    expect(writer).toHaveBeenCalledTimes(1);
  });
});
