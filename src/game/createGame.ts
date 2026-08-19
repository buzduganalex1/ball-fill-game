import Phaser from 'phaser';
import { gameBridge } from './GameBridge';
import { BootScene } from './scenes/BootScene';
import { PlayScene } from './scenes/PlayScene';

let game: Phaser.Game | null = null;

export function createPhaserArena(parent: HTMLElement, width: number, height: number): Phaser.Game | null {
  if (!gameBridge.requested || game) return game;
  try {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      transparent: true,
      backgroundColor: '#e8eef3',
      antialias: true,
      render: {
        antialias: true,
        roundPixels: false,
        powerPreference: 'high-performance',
      },
      fps: {
        target: 60,
        limit: 60,
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      scene: [BootScene, PlayScene],
    });
    return game;
  } catch (error) {
    gameBridge.disableRenderer(error);
    return null;
  }
}
