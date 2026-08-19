import { BALL_IDS, type BallId } from '../../data/balls';

export function resolveEquippedBall(ownedBallIds: ReadonlySet<BallId>, requested: BallId): BallId {
  if (ownedBallIds.has(requested)) return requested;
  return BALL_IDS.find((type) => ownedBallIds.has(type)) ?? 'normal';
}

export function canEquipBall(ownedBallIds: ReadonlySet<BallId>, type: BallId): boolean {
  return ownedBallIds.has(type);
}
