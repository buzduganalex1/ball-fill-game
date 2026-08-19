import { describe, expect, it } from 'vitest';
import { buildHomeViewModel } from '../../src/application/home/HomeViewModel';

describe('home view model', () => {
  it('surfaces a ready pack and the current encounter', () => {
    const model = buildHomeViewModel({
      currentLevel: 10,
      walletCoins: 25,
      ownedBallCount: 3,
      equippedBallId: 'swift',
      resultOpen: false,
      resumeAvailable: false,
      starterPackOpened: true,
    });

    expect(model.canBuyPack).toBe(true);
    expect(model.packTitle).toBe('YOUR NEXT PACK IS READY!');
    expect(model.nextMilestone).toContain('CURRENT EVENT');
    expect(model.equippedBallName).toBe('Swift Ball');
  });

  it('prioritizes an open result in the primary action label', () => {
    const model = buildHomeViewModel({
      currentLevel: 3,
      walletCoins: 4,
      ownedBallCount: 1,
      equippedBallId: 'normal',
      resultOpen: true,
      resumeAvailable: true,
      starterPackOpened: true,
    });

    expect(model.playLabel).toBe('▶ VIEW LEVEL 3 RESULT');
    expect(model.packTitle).toBe('21 GOLD TO NEXT PACK');
  });

  it('builds twenty-level worlds with saved stars and performance stats', () => {
    const model = buildHomeViewModel({
      currentLevel: 3,
      highestCompletedLevel: 2,
      levelProgress: [
        { level: 1, stars: 3, bestTimeLeft: 22.4, fewestBallsUsed: 3, bestCoins: 12, attempts: 2 },
        { level: 2, stars: 2, bestTimeLeft: 18, fewestBallsUsed: 4, bestCoins: 8, attempts: 1 },
      ],
      walletCoins: 20,
      ownedBallCount: 1,
      equippedBallId: 'normal',
      resultOpen: false,
      resumeAvailable: false,
      starterPackOpened: true,
    });

    expect(model.worlds).toHaveLength(10);
    expect(model.worlds[0].levels).toHaveLength(20);
    expect(model.worlds[0].stars).toBe(5);
    expect(model.worlds[0].levels[0]).toMatchObject({
      completed: true,
      stars: 3,
      attempts: 2,
      bestTime: '22.4s',
      bestBalls: '3',
      bestCoins: '12',
    });
    expect(model.worlds[0].levels[2].unlocked).toBe(true);
    expect(model.worlds[1].unlocked).toBe(false);
  });

  it('unlocks the next world at fifty stars', () => {
    const levelProgress = Array.from({ length: 17 }, (_, index) => ({
      level: index + 1,
      stars: index === 16 ? 2 : 3,
      bestTimeLeft: 20,
      fewestBallsUsed: 3,
      bestCoins: 5,
      attempts: 1,
    }));
    const model = buildHomeViewModel({
      currentLevel: 21,
      highestCompletedLevel: 20,
      levelProgress,
      walletCoins: 0,
      ownedBallCount: 1,
      equippedBallId: 'normal',
      resultOpen: false,
      resumeAvailable: false,
      starterPackOpened: true,
    });

    expect(model.worlds[0].stars).toBe(50);
    expect(model.worlds[1].unlocked).toBe(true);
    expect(model.worlds[1].levels[0].unlocked).toBe(true);
  });
});
