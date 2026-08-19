import type { BallId } from '../data/balls';
import type {
  ActiveRunState,
  BallState,
  CoinState,
  EnemyState,
  ImpactRingState,
  RunFxState,
} from '../domains/gameplay/RunState';

export type LegacyBallState = BallState;
export type LegacyEnemyState = EnemyState;
export type LegacyCoinState = CoinState;
export type LegacyFxState = RunFxState;
export type LegacyImpactRing = ImpactRingState;

export type LegacyRunState = ActiveRunState;

export interface LegacyRenderFrame {
  sequence: number;
  width: number;
  height: number;
  now: number;
  currentLevel: number;
  selectedBallType: BallId;
  state: LegacyRunState;
}

type ActiveListener = (active: boolean) => void;

class GameBridge {
  readonly requested = new URLSearchParams(window.location.search).get('renderer') !== 'legacy';
  private frame: LegacyRenderFrame | null = null;
  private active = false;
  private ready = false;
  private activeListeners = new Set<ActiveListener>();

  constructor() {
    document.body.dataset.gameActive = 'false';
    if (!this.requested) document.body.dataset.gameRenderer = 'legacy';
  }

  publish(frame: Omit<LegacyRenderFrame, 'sequence'>): void {
    this.frame = { ...frame, sequence: (this.frame?.sequence ?? 0) + 1 };
  }

  latest(): LegacyRenderFrame | null {
    return this.frame;
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    document.body.dataset.gameActive = String(active);
    for (const listener of this.activeListeners) listener(active);
  }

  isActive(): boolean {
    return this.active;
  }

  onActive(listener: ActiveListener): () => void {
    this.activeListeners.add(listener);
    return () => this.activeListeners.delete(listener);
  }

  setRendererReady(renderer: string): void {
    if (!this.requested) return;
    this.ready = true;
    document.body.classList.add('phaserRenderer');
    document.body.dataset.gameRenderer = renderer;
  }

  disableRenderer(reason: unknown): void {
    this.ready = false;
    document.body.classList.remove('phaserRenderer');
    document.body.dataset.gameRenderer = 'legacy';
    console.warn('Phaser renderer disabled; using the legacy canvas.', reason);
  }

  shouldRenderWithPhaser(): boolean {
    return this.requested && this.ready;
  }
}

export const gameBridge = new GameBridge();
