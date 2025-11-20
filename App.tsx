
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { BattleScene } from './game/scenes/BattleScene';
import { MenuScene } from './game/scenes/MenuScene';
import { RewardScene } from './game/scenes/RewardScene';
import { GameOverScene } from './game/scenes/GameOverScene';

export const App = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, // Will use WebGL if available
      width: 1280,
      height: 720,
      parent: 'game-container',
      backgroundColor: '#FFFBEB', // Amber-50
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

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div id="game-container" className="w-full h-full flex items-center justify-center" />
  );
};
