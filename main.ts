import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { BattleScene } from './game/scenes/BattleScene';
import { MenuScene } from './game/scenes/MenuScene';
import { RewardScene } from './game/scenes/RewardScene';
import { GameOverScene } from './game/scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#FFFBEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [BootScene, MenuScene, BattleScene, RewardScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  dom: {
    createContainer: true
  }
};

new Phaser.Game(config);

