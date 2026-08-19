import { type BallId } from '../data/balls';
import { type BoosterId } from '../data/boosters';

export const SAVE_KEY = 'ballFillSave';
export const SAVE_VERSION = 1 as const;

export interface SaveDataV1 {
  version: typeof SAVE_VERSION;
  currentLevel: number;
  highestCompletedLevel: number;
  walletCoins: number;
  ownedBallIds: BallId[];
  equippedBallId: BallId;
  unlockedBoosterIds: BoosterId[];
  starterPackOpened: boolean;
  tutorialSeen: boolean;
  firstPackMilestoneSeen: boolean;
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
  };
}

export const DEFAULT_SAVE_DATA: SaveDataV1 = {
  version: SAVE_VERSION,
  currentLevel: 1,
  highestCompletedLevel: 0,
  walletCoins: 0,
  ownedBallIds: [],
  equippedBallId: 'normal',
  unlockedBoosterIds: [],
  starterPackOpened: false,
  tutorialSeen: false,
  firstPackMilestoneSeen: false,
  settings: {
    soundEnabled: true,
    reducedMotion: false,
  },
};
