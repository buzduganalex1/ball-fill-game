import Phaser from 'phaser';
import { BALL_ASSET_PATHS, BALL_IDS } from '../../data/balls';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const id of BALL_IDS) this.load.image(`ball-${id}`, BALL_ASSET_PATHS[id]);
  }

  create(): void {
    this.scene.start('Play');
  }
}
