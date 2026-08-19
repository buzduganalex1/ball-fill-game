import { describe, expect, it } from 'vitest';
import { normalizeSaveData } from '../../src/state/migrations';

describe('save migrations', () => {
  it('creates safe defaults from missing data', () => {
    expect(normalizeSaveData(undefined)).toMatchObject({
      version: 2,
      currentLevel: 1,
      highestCompletedLevel: 0,
      levelProgress: [],
      grandfatheredWorldCount: 1,
      walletCoins: 0,
      ownedBallIds: [],
      equippedBallId: 'normal',
      starterPackOpened: false,
    });
  });

  it('sanitizes corrupted values and preserves valid progression', () => {
    expect(normalizeSaveData({
      currentLevel: 999,
      highestCompletedLevel: -4,
      walletCoins: '42.257',
      starterPackOpened: true,
      ownedBallIds: ['swift', 'swift', 'not-a-ball'],
      equippedBallId: 'swift',
      unlockedBoosterIds: ['freeze', 'fake-booster'],
      settings: { soundEnabled: false, reducedMotion: true },
    })).toMatchObject({
      currentLevel: 200,
      highestCompletedLevel: 0,
      walletCoins: 42,
      ownedBallIds: ['normal', 'swift'],
      equippedBallId: 'swift',
      unlockedBoosterIds: ['freeze'],
      starterPackOpened: true,
      settings: { soundEnabled: false, reducedMotion: true },
    });
  });

  it('imports the legacy tutorial flag', () => {
    expect(normalizeSaveData({}, true).tutorialSeen).toBe(true);
  });

  it('preserves access and creates conservative stars for an existing save', () => {
    const save = normalizeSaveData({
      version: 1,
      currentLevel: 33,
      highestCompletedLevel: 32,
      starterPackOpened: true,
      ownedBallIds: ['normal'],
    });

    expect(save.grandfatheredWorldCount).toBe(2);
    expect(save.levelProgress).toHaveLength(32);
    expect(save.levelProgress[0]).toMatchObject({ level: 1, stars: 1 });
    expect(save.levelProgress[31]).toMatchObject({ level: 32, stars: 1 });
  });
});
