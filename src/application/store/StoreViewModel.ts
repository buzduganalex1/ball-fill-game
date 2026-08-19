import type { BallId } from '../../data/balls';
import { IMPOSSIBLE_BALL_PRICE, PACK_PRICE, formatCoinAmount } from '../../data/economy';

export interface StoreViewModelInput {
  walletCoins: number;
  starterPackOpened: boolean;
  ownedBallIds: ReadonlySet<BallId>;
  currentScreen: string;
}

export interface StoreViewModel {
  wallet: string;
  packPrice: number;
  impossiblePrice: number;
  packEnabled: boolean;
  canBuyPack: boolean;
  quickStoreReady: boolean;
  apexOwned: boolean;
  cataclysmOwned: boolean;
  gaiaOwned: boolean;
  apexReady: boolean;
  cataclysmReady: boolean;
  gaiaReady: boolean;
}

export function buildStoreViewModel(input: StoreViewModelInput): StoreViewModel {
  const canBuyPack = input.starterPackOpened && input.walletCoins >= PACK_PRICE;
  const apexOwned = input.ownedBallIds.has('apex');
  const cataclysmOwned = input.ownedBallIds.has('cataclysm');
  const gaiaOwned = input.ownedBallIds.has('gaia');
  return {
    wallet: formatCoinAmount(input.walletCoins),
    packPrice: PACK_PRICE,
    impossiblePrice: IMPOSSIBLE_BALL_PRICE,
    packEnabled: input.starterPackOpened,
    canBuyPack,
    quickStoreReady: canBuyPack && input.currentScreen !== 'store',
    apexOwned,
    cataclysmOwned,
    gaiaOwned,
    apexReady: !apexOwned && input.walletCoins >= 5000,
    cataclysmReady: !cataclysmOwned && input.walletCoins >= IMPOSSIBLE_BALL_PRICE,
    gaiaReady: !gaiaOwned && input.walletCoins >= IMPOSSIBLE_BALL_PRICE,
  };
}
