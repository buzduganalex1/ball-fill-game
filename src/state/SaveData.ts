import { type BallId } from '../data/balls';
import { type BoosterId } from '../data/boosters';
import type { LevelProgressRecord } from '../domains/campaign/WorldProgression';

export const SAVE_KEY = 'ballFillSave';
export const SAVE_VERSION = 2 as const;

export interface SaveData {
  version: typeof SAVE_VERSION;
  currentLevel: number;
  highestCompletedLevel: number;
  levelProgress: LevelProgressRecord[];
  grandfatheredWorldCount: number;
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

export const DEFAULT_SAVE_DATA: SaveData = {
  version: SAVE_VERSION,
  currentLevel: 1,
  highestCompletedLevel: 0,
  levelProgress: [],
  grandfatheredWorldCount: 1,
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
