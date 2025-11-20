
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
    
    this.add.text(width/2, 200, '💀 你挂了', {
        fontSize: '64px', fontFamily: 'Nunito', fontStyle: '900', color: '#ef4444'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width/2, 400, 300, 80, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(width/2, 400, '返回主菜单', { fontSize: '32px', fontFamily: 'Nunito', color: '#000' }).setOrigin(0.5);

    btn.on('pointerdown', () => {
        this.scene.start('MenuScene');
    });
  }
}
