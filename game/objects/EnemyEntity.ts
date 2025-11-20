import Phaser from 'phaser';
import { Enemy } from '../../types';
import { COLORS, TEXT_STYLES } from '../utils/theme';
import { UIHelper } from '../utils/UIHelper';

export class EnemyEntity extends Phaser.GameObjects.Container {
  private enemyData: Enemy;
  private hpBar: { container: Phaser.GameObjects.Container, update: (val: number) => void };
  private intentIcon: Phaser.GameObjects.Text;
  private intentValueText: Phaser.GameObjects.Text;
  private blockText: Phaser.GameObjects.Text;
  private sprite: Phaser.GameObjects.Text;
  private bgGlow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, enemy: Enemy) {
    super(scene, x, y);
    this.enemyData = enemy;
    
    this.setSize(200, 300);

    // 1. Floor Shadow/Glow
    this.bgGlow = scene.add.circle(0, 80, 70, 0x000000, 0.2);
    scene.tweens.add({
        targets: this.bgGlow,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.15,
        duration: 2000,
        yoyo: true,
        repeat: -1
    });
    this.add(this.bgGlow);

    // 2. Enemy Sprite (Emoji)
    this.sprite = scene.add.text(0, 0, enemy.emoji, { fontSize: '100px' }).setOrigin(0.5);
    this.add(this.sprite);

    // Idle Animation
    scene.tweens.add({
        targets: this.sprite,
        y: -10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // 3. HP Bar (Above head)
    this.hpBar = UIHelper.createProgressBar(scene, -60, -90, 120, 16, COLORS.danger, enemy.currentHp / enemy.maxHp);
    this.add(this.hpBar.container);

    // 4. Intent Indicator (Top Right)
    const intentBg = scene.add.circle(50, -60, 24, 0xffffff).setStrokeStyle(2, 0x000000);
    this.add(intentBg);
    
    this.intentIcon = scene.add.text(50, -60, '⚔️', { fontSize: '24px' }).setOrigin(0.5);
    this.add(this.intentIcon);

    this.intentValueText = scene.add.text(50, -60, '', { 
        fontFamily: 'Nunito', fontSize: '16px', fontStyle: '900', color: '#000000',
        stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5, 1.5); // Slightly above
    this.add(this.intentValueText);

    // 5. Block Indicator (Left)
    this.blockText = scene.add.text(-60, 0, '', { 
        fontFamily: 'Nunito', fontSize: '24px', fontStyle: '900', color: '#' + COLORS.block.toString(16),
        stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5);
    this.blockText.setVisible(false);
    this.add(this.blockText);

    // 6. Name
    const nameText = scene.add.text(0, 90, enemy.name, {
        ...TEXT_STYLES.heading,
        fontSize: '20px',
        color: COLORS.text.main
    }).setOrigin(0.5);
    this.add(nameText);

    scene.add.existing(this);
    this.updateData(enemy);
  }

  updateData(enemy: Enemy) {
      this.enemyData = enemy;
      this.hpBar.update(enemy.currentHp / enemy.maxHp);
      
      // Update Intent
      if (enemy.intent === 'ATTACK') {
          this.intentIcon.setText('⚔️');
          this.intentValueText.setText(enemy.intentValue.toString());
          this.intentValueText.setVisible(true);
      } else if (enemy.intent === 'BUFF') {
          this.intentIcon.setText('🛡️'); // Using Shield for Buff/Block intent visually
          this.intentValueText.setVisible(false);
      } else {
          this.intentIcon.setText('❓');
          this.intentValueText.setVisible(false);
      }

      // Update Block
      if (enemy.block > 0) {
          this.blockText.setText(`🛡️${enemy.block}`);
          this.blockText.setVisible(true);
      } else {
          this.blockText.setVisible(false);
      }
  }

  hitEffect(damage: number) {
      this.scene.tweens.add({
          targets: this.sprite,
          x: 10,
          duration: 50,
          yoyo: true,
          repeat: 3,
          onComplete: () => { this.sprite.x = 0; }
      });
      
      this.scene.tweens.add({
          targets: this.sprite,
          tint: 0xff0000,
          duration: 100,
          yoyo: true
      });
  }
}
