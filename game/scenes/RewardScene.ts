
import Phaser from 'phaser';

export class RewardScene extends Phaser.Scene {
  constructor() {
    super('RewardScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
    
    this.add.text(width/2, 200, '胜利!', {
        fontSize: '64px', fontFamily: 'Nunito', fontStyle: '900', color: '#fbbf24'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width/2, 400, 300, 80, 0x10b981).setInteractive({ useHandCursor: true });
    this.add.text(width/2, 400, '继续 (简单版)', { fontSize: '32px', fontFamily: 'Nunito' }).setOrigin(0.5);

    btn.on('pointerdown', () => {
        this.scene.start('BattleScene'); // Just restart for demo loop
    });
  }
}
