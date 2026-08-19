import type { BallId } from '../../data/balls';
import type { BoosterId } from '../../data/boosters';
import { roundCoinAmount } from '../../data/economy';
import type { LevelProgressRecord } from '../campaign/WorldProgression';
import { SAVE_VERSION, type SaveData } from '../../state/SaveData';

export interface PlayerProfileState {
  currentLevel: number;
  highestCompletedLevel: number;
  levelProgress?: Iterable<LevelProgressRecord>;
  grandfatheredWorldCount?: number;
  walletCoins: number;
  ownedBallIds: Iterable<BallId>;
  equippedBallId: BallId;
  unlockedBoosterIds: Iterable<BoosterId>;
  starterPackOpened: boolean;
  tutorialSeen: boolean;
  firstPackMilestoneSeen: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export function playerProfileToSaveData(profile: PlayerProfileState): SaveData {
  return {
    version: SAVE_VERSION,
    currentLevel: profile.currentLevel,
    highestCompletedLevel: profile.highestCompletedLevel,
    levelProgress: [...(profile.levelProgress ?? [])],
    grandfatheredWorldCount: profile.grandfatheredWorldCount ?? 1,
    walletCoins: roundCoinAmount(profile.walletCoins),
    ownedBallIds: [...profile.ownedBallIds],
    equippedBallId: profile.equippedBallId,
    unlockedBoosterIds: [...profile.unlockedBoosterIds],
    starterPackOpened: profile.starterPackOpened,
    tutorialSeen: profile.tutorialSeen,
    firstPackMilestoneSeen: profile.firstPackMilestoneSeen,
    settings: {
      soundEnabled: profile.soundEnabled,
      reducedMotion: profile.reducedMotion,
    },
  };
}
