import { BALL_ASSET_PATHS, type BallId } from '../../data/balls';

export function setBallAssetBackground(element: HTMLElement | null | undefined, type: BallId): void {
  if (!element) return;
  const path = BALL_ASSET_PATHS[type] ?? BALL_ASSET_PATHS.normal;
  if (element.dataset.ballAsset === path) return;
  element.style.backgroundImage = `url("${path}")`;
  element.style.backgroundPosition = 'center';
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundSize = 'contain';
  element.dataset.ballAsset = path;
}
