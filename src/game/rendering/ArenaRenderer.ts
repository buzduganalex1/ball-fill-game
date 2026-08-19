import Phaser from 'phaser';
import type { LegacyEnemyState, LegacyRenderFrame } from '../GameBridge';
import { BallRenderer } from './BallRenderer';
import { colorNumber, WORLD_COLORS } from './colors';

export class ArenaRenderer {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly trails: Phaser.GameObjects.Graphics;
  private readonly world: Phaser.GameObjects.Graphics;
  private readonly effects: Phaser.GameObjects.Graphics;
  private readonly balls: BallRenderer;
  private gridWidth = 0;
  private gridHeight = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.graphics().setDepth(0);
    this.trails = scene.add.graphics().setDepth(2);
    this.world = scene.add.graphics().setDepth(8);
    this.effects = scene.add.graphics().setDepth(14);
    this.balls = new BallRenderer(scene);
  }

  render(frame: LegacyRenderFrame): void {
    this.drawGrid(frame.width, frame.height);
    this.trails.clear();
    this.world.clear();
    this.effects.clear();

    for (const enemy of frame.state.enemies) this.drawTrail(enemy);
    for (const coin of frame.state.coins) this.drawCoin(coin.x, coin.y, coin.r, frame.now, coin.pulse ?? 0);
    for (const enemy of frame.state.enemies) this.drawEnemy(enemy);

    this.balls.render([
      ...frame.state.placed.map(ball => ({ ball, active: false })),
      ...(frame.state.active ? [{ ball: frame.state.active, active: true }] : []),
    ], frame.now);

    this.drawEffects(frame);
  }

  private drawGrid(width: number, height: number): void {
    if (this.gridWidth === width && this.gridHeight === height) return;
    this.gridWidth = width;
    this.gridHeight = height;
    this.background.clear();
    this.background.fillStyle(0xe8eef3, 1).fillRect(0, 0, width, height);
    this.background.lineStyle(1, 0xcfd8e2, 0.34);
    for (let x = 0; x <= width; x += 50) this.background.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 50) this.background.lineBetween(0, y, width, y);
  }

  private drawTrail(enemy: LegacyEnemyState): void {
    const trail = enemy.trail ?? [];
    if (trail.length < 2) return;
    const palette = WORLD_COLORS[Math.max(0, Math.min(9, (enemy.worldIndex ?? 1) - 1))];
    for (let index = 1; index < trail.length; index += 1) {
      const from = trail[index - 1];
      const to = trail[index];
      const progress = index / (trail.length - 1);
      const life = Math.min(from.life ?? 1, to.life ?? 1);
      const width = Math.max(2, enemy.r * (enemy.boss ? 0.72 : 0.4) * progress);
      this.trails.lineStyle(width, colorNumber(palette.trail), life * progress * (enemy.boss ? 0.48 : 0.28));
      this.trails.lineBetween(from.x, from.y, to.x, to.y);
    }
  }

  private drawEnemy(enemy: LegacyEnemyState): void {
    const palette = WORLD_COLORS[Math.max(0, Math.min(9, (enemy.worldIndex ?? 1) - 1))];
    const fill = enemy.boss || enemy.miniBoss ? palette.fill : enemy.minion ? palette.minion : '#d84b5c';
    const edge = enemy.boss || enemy.miniBoss ? palette.edge : '#a83246';
    this.world.fillStyle(colorNumber(fill), 1).fillCircle(enemy.x, enemy.y, enemy.r);
    this.world.lineStyle(enemy.boss ? 5 : 3, colorNumber(edge), 1).strokeCircle(enemy.x, enemy.y, enemy.r);

    const speed = Math.hypot(enemy.vx, enemy.vy) || 1;
    const lookX = enemy.vx / speed;
    const lookY = enemy.vy / speed;
    const eyeOffset = Math.max(4, enemy.r * 0.27);
    const eyeRadius = Math.max(2.4, enemy.r * 0.13);
    for (const side of [-1, 1]) {
      const sideX = -lookY * side * eyeOffset;
      const sideY = lookX * side * eyeOffset;
      const eyeX = enemy.x + lookX * eyeOffset * 0.45 + sideX;
      const eyeY = enemy.y + lookY * eyeOffset * 0.45 + sideY;
      this.world.fillStyle(0xffffff, 1).fillCircle(eyeX, eyeY, eyeRadius * 1.45);
      this.world.fillStyle(0x17374b, 1).fillCircle(eyeX + lookX * 1.5, eyeY + lookY * 1.5, eyeRadius * 0.72);
    }

    if (enemy.boss || enemy.miniBoss) {
      const crownY = enemy.y - enemy.r - 9;
      const crownWidth = enemy.r * 1.15;
      this.world.fillStyle(0xffca48, 1);
      this.world.fillTriangle(enemy.x - crownWidth / 2, crownY, enemy.x - crownWidth / 4, crownY - 14, enemy.x, crownY);
      this.world.fillTriangle(enemy.x, crownY, enemy.x + crownWidth / 4, crownY - 14, enemy.x + crownWidth / 2, crownY);
      this.world.fillRect(enemy.x - crownWidth / 2, crownY - 2, crownWidth, 7);
    }
  }

  private drawCoin(x: number, y: number, radius: number, now: number, phase: number): void {
    const bobY = y + Math.sin(now * 3 + phase) * 2.5;
    const r = radius * (1 + 0.06 * Math.sin(now * 5 + phase));
    this.world.fillStyle(0xffcf39, 0.22).fillCircle(x, bobY, r * 1.45);
    this.world.fillStyle(0xffc42c, 1).fillCircle(x, bobY, r);
    this.world.lineStyle(Math.max(2.5, r * 0.14), 0xd78c08, 1).strokeCircle(x, bobY, r);
    this.world.lineStyle(Math.max(1.5, r * 0.08), 0xfff49a, 0.95).strokeCircle(x, bobY, r * 0.72);
    const points: Phaser.Math.Vector2[] = [];
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const pointRadius = index % 2 === 0 ? r * 0.42 : r * 0.2;
      points.push(new Phaser.Math.Vector2(x + Math.cos(angle) * pointRadius, bobY + Math.sin(angle) * pointRadius));
    }
    this.world.fillStyle(0xfff383, 1).fillPoints(points, true);
  }

  private drawEffects(frame: LegacyRenderFrame): void {
    const state = frame.state;
    for (const effect of state.coinFx) {
      if (effect.type === 'coin') continue;
      const alpha = Math.max(0, effect.life / (effect.maxLife || 0.45));
      const color = colorNumber(effect.color, 0xffffff);
      if (effect.type === 'shieldShard') {
        this.effects.fillStyle(color, alpha).fillTriangle(
          effect.x + effect.r * 1.8, effect.y,
          effect.x - effect.r * 0.75, effect.y + effect.r * 0.7,
          effect.x - effect.r * 0.35, effect.y - effect.r * 0.8,
        );
      } else {
        this.effects.fillStyle(color, alpha).fillCircle(effect.x, effect.y, Math.max(1, effect.r));
      }
    }

    for (const ring of state.impactRings) {
      const progress = 1 - Math.max(0, ring.life);
      this.effects.lineStyle(4, colorNumber(ring.color), Math.max(0, ring.life));
      this.effects.strokeCircle(ring.x, ring.y, Math.max(6, (ring.maxR ?? 80) * progress));
    }

    if (state.freezeLeft > 0 || state.frostDebuffLeft > 0) {
      this.effects.lineStyle(8, 0x87dfff, 0.72).strokeRect(5, 5, frame.width - 10, frame.height - 10);
    }
    if (state.toxicLeft > 0) {
      this.effects.lineStyle(7, 0xb8eb45, 0.55).strokeRect(9, 9, frame.width - 18, frame.height - 18);
    }
    if (state.screenFlashT > 0 || state.bossFlashT > 0) {
      const flashColor = state.screenFlashT > 0 ? state.screenFlashColor : '#ffffff';
      this.effects.fillStyle(colorNumber(flashColor), Math.min(0.25, Math.max(state.screenFlashT, state.bossFlashT) * 0.45));
      this.effects.fillRect(0, 0, frame.width, frame.height);
    }
  }
}
