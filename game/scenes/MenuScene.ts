import Phaser from 'phaser';
import { UIHelper } from '../utils/UIHelper';
import { COLORS } from '../utils/theme';

export class MenuScene extends Phaser.Scene {
  private titleGroup: Phaser.GameObjects.Container;

  constructor() {
    super('MenuScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dynamic Background
    this.createBackground(width, height);

    // Title Group (For bounce)
    this.titleGroup = this.add.container(width / 2, height * 0.3);
    
    // Big Castle Icon (Behind text)
    const icon = this.add.text(0, 0, '🏰', {
      fontSize: '180px'
    }).setOrigin(0.5).setAlpha(0.2);
    
    this.tweens.add({
        targets: icon,
        angle: 10,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    this.titleGroup.add(icon);

    // Title Text with pop
    const title = this.add.text(0, 0, '表情包大乱斗', {
      fontFamily: 'Nunito',
      fontSize: '100px',
      color: '#ffffff', 
      fontStyle: '900',
      stroke: '#e60012',
      strokeThickness: 20,
      shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 0, fill: true, stroke: true }
    }).setOrigin(0.5);
    
    this.titleGroup.add(title);

    // Bouncy Title Animation
    this.tweens.add({
        targets: this.titleGroup,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    
    // Buttons
    // Start
    const startBtn = UIHelper.createButton(this, width / 2, height * 0.6, '开始冒险', () => {
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                 this.scene.start('BattleScene');
            }
        });
    }, { color: COLORS.primary, width: 300, height: 80, colorDark: COLORS.primaryDark });

    // Settings (Disabled visual style)
    const settingsBtn = UIHelper.createButton(this, width / 2, height * 0.75, '设置', () => {
        // TODO
    }, { color: COLORS.secondary, width: 300, height: 80, colorDark: COLORS.secondaryDark });

    // Entrance Animation
    this.titleGroup.setY(-200);
    this.tweens.add({
        targets: this.titleGroup,
        y: height * 0.3,
        duration: 1000,
        ease: 'Bounce.easeOut'
    });

    startBtn.setAlpha(0);
    startBtn.y += 50;
    this.tweens.add({
        targets: startBtn,
        alpha: 1,
        y: height * 0.6,
        duration: 500,
        delay: 500,
        ease: 'Back.easeOut'
    });

    settingsBtn.setAlpha(0);
    settingsBtn.y += 50;
    this.tweens.add({
        targets: settingsBtn,
        alpha: 1,
        y: height * 0.75,
        duration: 500,
        delay: 700,
        ease: 'Back.easeOut'
    });

    // Version
    this.add.text(width - 20, height - 20, 'v0.2.0 (Nintendo Style)', {
        fontFamily: 'Nunito',
        fontSize: '16px',
        color: COLORS.text.muted,
        fontStyle: 'bold'
    }).setOrigin(1, 1);
  }

  createBackground(width: number, height: number) {
      const graphics = this.add.graphics();
      
      // Striped Background
      graphics.fillStyle(COLORS.light, 1);
      graphics.fillRect(0, 0, width, height);
      
      graphics.fillStyle(0xe5e7eb, 0.5);
      const stripeWidth = 100;
      for (let i = -height; i < width; i += stripeWidth * 2) {
          graphics.beginPath();
          graphics.moveTo(i, 0);
          graphics.lineTo(i + stripeWidth, 0);
          graphics.lineTo(i + stripeWidth - height, height);
          graphics.lineTo(i - height, height);
          graphics.closePath();
          graphics.fillPath();
      }
  }
}
