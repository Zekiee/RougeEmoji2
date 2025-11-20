import Phaser from 'phaser';
import { Enemy, IntentType, StatusType } from '../../types';

export class EnemyEntity extends Phaser.GameObjects.Container {
  public id: string;
  public enemyData: Enemy;
  
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private intentIcon: Phaser.GameObjects.Text;
  private intentValueText: Phaser.GameObjects.Text;
  private intentContainer: Phaser.GameObjects.Container;
  private blockText: Phaser.GameObjects.Text;
  private avatar: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, enemy: Enemy) {
    super(scene, x, y);
    this.id = enemy.id;
    this.enemyData = enemy;

    this.setSize(120, 150);

    // Avatar
    this.avatar = scene.add.text(0, 0, enemy.emoji, { fontSize: enemy.isBoss ? '120px' : '80px' }).setOrigin(0.5);
    
    // Shadow
    const shadow = scene.add.ellipse(0, 50, 80, 20, 0x000000, 0.2);
    this.add(shadow);
    this.add(this.avatar);

    // Intent Bubble
    this.intentContainer = scene.add.container(0, -80);
    const bubble = scene.add.rectangle(0, 0, 60, 30, 0xffffff).setStrokeStyle(2, 0xe2e8f0);
    this.intentIcon = scene.add.text(-15, 0, '', { fontSize: '18px' }).setOrigin(0.5);
    this.intentValueText = scene.add.text(10, 0, '', { fontSize: '18px', fontFamily: 'Nunito', fontStyle: '900', color: '#000' }).setOrigin(0.5);
    
    this.intentContainer.add([bubble, this.intentIcon, this.intentValueText]);
    this.add(this.intentContainer);

    // HP Bar
    this.hpBarBg = scene.add.rectangle(0, 70, 100, 12, 0xe2e8f0).setStrokeStyle(1, 0x94a3b8);
    this.hpBar = scene.add.rectangle(-50, 70, 100, 12, 0xf43f5e).setOrigin(0, 0.5); // Red
    this.hpText = scene.add.text(0, 70, '', { fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold' }).setOrigin(0.5);
    
    this.add([this.hpBarBg, this.hpBar, this.hpText]);

    // Block
    this.blockText = scene.add.text(40, -40, '', { fontSize: '14px', color: '#3b82f6', fontStyle: '900', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5);
    this.add(this.blockText);

    // Floating animation
    scene.tweens.add({
        targets: this.avatar,
        y: '-=10',
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    this.updateVisuals();
    scene.add.existing(this);
    
    // Set interactive for targeting
    this.setInteractive(new Phaser.Geom.Rectangle(-60, -75, 120, 150), Phaser.Geom.Rectangle.Contains);
  }

  updateVisuals() {
      const hpPercent = Math.max(0, this.enemyData.currentHp / this.enemyData.maxHp);
      this.hpBar.width = 100 * hpPercent;
      this.hpText.setText(`${this.enemyData.currentHp}/${this.enemyData.maxHp}`);

      if (this.enemyData.block > 0) {
          this.blockText.setText(`🛡️${this.enemyData.block}`);
          this.blockText.setVisible(true);
      } else {
          this.blockText.setVisible(false);
      }

      // Intent
      let icon = '';
      let color = '#000';
      switch(this.enemyData.intent) {
          case IntentType.ATTACK: icon = '⚔️'; color = '#e11d48'; break;
          case IntentType.DEFEND: icon = '🛡️'; color = '#0284c7'; break;
          case IntentType.BUFF: icon = '💪'; color = '#059669'; break;
          case IntentType.SUMMON: icon = '📣'; color = '#7c3aed'; break;
          case IntentType.SPECIAL: icon = '⚠️'; color = '#d97706'; break;
      }
      this.intentIcon.setText(icon);
      this.intentValueText.setText(this.enemyData.intentValue > 0 ? this.enemyData.intentValue.toString() : '');
      this.intentValueText.setColor(color);
  }

  updateData(newData: Enemy) {
      this.enemyData = newData;
      this.updateVisuals();
  }

  hitEffect(value: number) {
      // Shake
      this.scene.tweens.add({
          targets: this,
          x: '+=5',
          duration: 50,
          yoyo: true,
          repeat: 3
      });

      // Popup text
      const popup = this.scene.add.text(this.x, this.y - 50, `-${value}`, {
          fontSize: '32px',
          color: '#ef4444',
          fontStyle: '900',
          stroke: '#fff',
          strokeThickness: 4
      }).setOrigin(0.5);

      this.scene.tweens.add({
          targets: popup,
          y: '-=50',
          alpha: 0,
          duration: 1000,
          onComplete: () => popup.destroy()
      });
  }
}