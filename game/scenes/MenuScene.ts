
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Background pattern effect (dots)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xfffbeb, 1);
    graphics.fillRect(0, 0, width, height);
    
    graphics.fillStyle(0x000000, 0.05);
    for (let i = 0; i < width; i += 20) {
        for (let j = 0; j < height; j += 20) {
            graphics.fillCircle(i, j, 1);
        }
    }

    // Title
    this.add.text(width / 2, height * 0.3, '表情包大乱斗', {
      fontFamily: 'Nunito',
      fontSize: '84px',
      color: '#e11d48', // Rose-600
      fontStyle: '900'
    }).setOrigin(0.5).setStroke('#ffffff', 6).setShadow(2, 2, '#000000', 2, true, true);

    this.add.text(width / 2, height * 0.45, '🏰', {
      fontSize: '120px'
    }).setOrigin(0.5);

    // Start Button
    const btnBg = this.add.rectangle(width / 2, height * 0.7, 300, 80, 0xe11d48)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, 0xffffff);
    
    const btnText = this.add.text(width / 2, height * 0.7, '开始冒险', {
      fontFamily: 'Nunito',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: '900'
    }).setOrigin(0.5);

    // Hover effects
    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnText], scale: 1.1, duration: 100 });
    });
    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnText], scale: 1, duration: 100 });
    });
    btnBg.on('pointerdown', () => {
      this.scene.start('BattleScene');
    });
  }
}
