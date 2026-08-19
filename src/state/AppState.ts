import type { BallId } from '../data/balls';
import type { BoosterId } from '../data/boosters';
import type { SaveData } from './SaveData';

export interface AppStateSnapshot {
  currentLevel: number;
  highestCompletedLevel: number;
  walletCoins: number;
  ownedBallIds: BallId[];
  equippedBallId: BallId;
  unlockedBoosterIds: BoosterId[];
  starterPackOpened: boolean;
  tutorialSeen: boolean;
  firstPackMilestoneSeen: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export function appStateFromSave(save: SaveData): AppStateSnapshot {
  return {
    currentLevel: save.currentLevel,
    highestCompletedLevel: save.highestCompletedLevel,
    walletCoins: save.walletCoins,
    ownedBallIds: [...save.ownedBallIds],
    equippedBallId: save.equippedBallId,
    unlockedBoosterIds: [...save.unlockedBoosterIds],
    starterPackOpened: save.starterPackOpened,
    tutorialSeen: save.tutorialSeen,
    firstPackMilestoneSeen: save.firstPackMilestoneSeen,
    soundEnabled: save.settings.soundEnabled,
    reducedMotion: save.settings.reducedMotion,
  };
}
