import { describe, expect, it } from 'vitest';
import { buildStoreViewModel } from '../../src/application/store/StoreViewModel';

describe('store view model', () => {
  it('reserves purchase emphasis for affordable, unowned products', () => {
    const model = buildStoreViewModel({
      walletCoins: 5000,
      starterPackOpened: true,
      ownedBallIds: new Set(['normal', 'cataclysm']),
      currentScreen: 'home',
    });
    expect(model.canBuyPack).toBe(true);
    expect(model.quickStoreReady).toBe(true);
    expect(model.apexReady).toBe(true);
    expect(model.cataclysmReady).toBe(false);
  });
});
