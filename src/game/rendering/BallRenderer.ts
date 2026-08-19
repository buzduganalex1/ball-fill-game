import Phaser from 'phaser';
import { BALL_TYPES, type BallId } from '../../data/balls';
import type { LegacyBallState } from '../GameBridge';
import { colorNumber } from './colors';

export interface RenderBall {
  ball: LegacyBallState;
  active: boolean;
}

export class BallRenderer {
  private readonly images: Phaser.GameObjects.Image[] = [];
  private readonly underlay: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.underlay = scene.add.graphics().setDepth(4);
    this.overlay = scene.add.graphics().setDepth(12);
  }

  render(items: RenderBall[], now: number): void {
    this.underlay.clear();
    this.overlay.clear();

    items.forEach((item, index) => {
      const { ball, active } = item;
      const type = ball.type ?? 'normal';
      const image = this.imageAt(index, type);
      const pulse = 0.5 + 0.5 * Math.sin(now * 5 + index * 0.7);

      this.drawAura(ball, type, pulse, now, active);
      image
        .setVisible(true)
        .setPosition(ball.x, ball.y)
        .setDisplaySize(ball.r * 2, ball.r * 2)
        .setAlpha(type === 'ghost' && (ball.ghostLeft ?? 0) > 0 ? 0.62 : 1)
        .setDepth(active ? 10 : 6)
        .setRotation(0);
      this.drawOverlay(ball, type, pulse, active);
    });

    for (let index = items.length; index < this.images.length; index += 1) {
      this.images[index].setVisible(false);
    }
  }

  private imageAt(index: number, type: BallId): Phaser.GameObjects.Image {
    let image = this.images[index];
    const textureKey = `ball-${type}`;
    if (!image) {
      image = this.scene.add.image(0, 0, textureKey).setOrigin(0.5).setDepth(6);
      this.images.push(image);
    } else if (image.texture.key !== textureKey) {
      image.setTexture(textureKey);
    }
    return image;
  }

  private drawAura(ball: LegacyBallState, type: BallId, pulse: number, now: number, active: boolean): void {
    const style = BALL_TYPES[type];
    const auraColor = colorNumber(style.edge);
    let radius = ball.r + 10;
    let alpha = 0.12;
    let width = 5;

    if (type === 'legendary' || type === 'cataclysm' || type === 'gaia' || type === 'apex') {
      radius += 5 + pulse * 4;
      alpha = 0.28;
      width = 7;
    } else if (type === 'magnet' || type === 'ghost' || type === 'coin') {
      radius += 6 + pulse * 3;
      alpha = 0.2;
    }

    if (type !== 'normal' || active) {
      this.underlay.lineStyle(width, auraColor, alpha);
      this.underlay.strokeCircle(ball.x, ball.y, radius);
    }

    if (type === 'apex' || type === 'cataclysm' || type === 'gaia' || type === 'legendary') {
      const particleCount = type === 'gaia' ? 7 : 5;
      for (let index = 0; index < particleCount; index += 1) {
        const angle = now * (type === 'gaia' ? 0.75 : 1.35) + index * Math.PI * 2 / particleCount;
        const orbit = ball.r + 18 + 4 * Math.sin(now * 3 + index);
        this.underlay.fillStyle(colorNumber(index % 2 ? style.highlight : style.edge), 0.72);
        this.underlay.fillCircle(
          ball.x + Math.cos(angle) * orbit,
          ball.y + Math.sin(angle) * orbit,
          2.2 + pulse,
        );
      }
    }
  }

  private drawOverlay(ball: LegacyBallState, type: BallId, pulse: number, active: boolean): void {
    const style = BALL_TYPES[type];
    const shieldCount = active ? Math.max(0, Math.floor(ball.shieldHits ?? 0)) : 0;
    for (let layer = 0; layer < shieldCount; layer += 1) {
      const shieldColor = type === 'apex' && layer === 1 ? 0xff63dd : 0x75e7ff;
      this.overlay.lineStyle(4 - layer * 0.35, shieldColor, 0.75 + pulse * 0.2);
      this.overlay.strokeCircle(ball.x, ball.y, ball.r + 10 + layer * 8 + pulse * 2);
      this.overlay.fillStyle(shieldColor, 0.95);
      this.overlay.fillCircle(ball.x + (layer - (shieldCount - 1) / 2) * 14, ball.y - ball.r - 20, 4);
    }

    if (active) {
      this.overlay.lineStyle(3, 0xffffff, 0.82);
      this.overlay.strokeCircle(ball.x, ball.y, ball.r + 5 + pulse * 1.5);
      if ((ball.spawnPunch ?? 0) > 0) {
        this.overlay.lineStyle(4, colorNumber(style.highlight), Math.min(1, ball.spawnPunch ?? 0));
        this.overlay.strokeCircle(ball.x, ball.y, ball.r + 18 + (1 - (ball.spawnPunch ?? 0)) * 24);
      }
    }
  }
}
