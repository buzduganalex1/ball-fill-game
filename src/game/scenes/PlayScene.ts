import Phaser from 'phaser';
import { gameBridge } from '../GameBridge';
import { ArenaRenderer } from '../rendering/ArenaRenderer';

export class PlayScene extends Phaser.Scene {
  private rendererView!: ArenaRenderer;
  private lastSequence = -1;
  private unsubscribeActive: (() => void) | null = null;

  constructor() {
    super('Play');
  }

  create(): void {
    this.rendererView = new ArenaRenderer(this);
    const rendererName = this.game.renderer.type === Phaser.WEBGL ? 'phaser-webgl' : 'phaser-canvas';
    gameBridge.setRendererReady(rendererName);
    this.unsubscribeActive = gameBridge.onActive(active => {
      if (active) this.scene.wake();
      else this.scene.sleep();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeActive?.());
    if (!gameBridge.isActive()) this.scene.sleep();
  }

  update(): void {
    const frame = gameBridge.latest();
    if (!frame || frame.sequence === this.lastSequence) return;
    this.lastSequence = frame.sequence;

    if (this.scale.width !== frame.width || this.scale.height !== frame.height) {
      this.scale.resize(frame.width, frame.height);
      this.cameras.main.setSize(frame.width, frame.height);
    }

    if (frame.state.shakeT > 0 && frame.state.shakePower > 0) {
      const strength = frame.state.shakePower * Math.min(1, frame.state.shakeT / 0.22);
      this.cameras.main.setScroll((Math.random() * 2 - 1) * strength, (Math.random() * 2 - 1) * strength);
    } else {
      this.cameras.main.setScroll(0, 0);
    }
    this.rendererView.render(frame);
  }
}
