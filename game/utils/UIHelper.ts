import Phaser from 'phaser';
import { COLORS, TEXT_STYLES } from './theme';

export class UIHelper {
  
  /**
   * Creates a "Nintendo-style" chunky 3D button.
   */
  static createButton(scene: Phaser.Scene, x: number, y: number, text: string, callback: () => void, options: { color?: number, colorDark?: number, width?: number, height?: number, icon?: string } = {}) {
    const width = options.width || 200;
    const height = options.height || 60;
    const color = options.color || COLORS.primary;
    // Default dark shade is just a bit darker if not provided, or hardcoded approx
    const colorDark = options.colorDark || (color === COLORS.primary ? COLORS.primaryDark : 0x000000);
    
    const container = scene.add.container(x, y);

    // 1. The "Shadow" / Bottom 3D part
    const shadowOffset = 6;
    const btnShadow = scene.add.graphics();
    btnShadow.fillStyle(colorDark, 1);
    btnShadow.fillRoundedRect(-width/2, -height/2 + shadowOffset, width, height, 16);
    
    // 2. The Top Face
    const btnFace = scene.add.graphics();
    btnFace.fillStyle(color, 1);
    btnFace.fillRoundedRect(-width/2, -height/2, width, height, 16);

    // 3. Hit Area
    const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    // 4. Text/Icon
    const label = scene.add.text(0, -2, text, TEXT_STYLES.buttonText)
        .setOrigin(0.5);

    container.add([btnShadow, btnFace, label, hitArea]);

    // --- Animations ---
    
    // Hover: Slight bounce up
    hitArea.on('pointerover', () => {
        scene.tweens.add({
            targets: [btnFace, label],
            y: -2,
            duration: 100,
            ease: 'Sine.easeOut'
        });
    });

    // Out: Reset
    hitArea.on('pointerout', () => {
        scene.tweens.add({
            targets: [btnFace, label],
            y: 0,
            duration: 100,
            ease: 'Sine.easeOut'
        });
    });

    // Down: Press effect (move face down to meet shadow)
    hitArea.on('pointerdown', () => {
        scene.tweens.add({
            targets: [btnFace, label],
            y: shadowOffset - 2, // Move down almost to the bottom
            duration: 50,
            ease: 'Power1'
        });
    });

    // Up: Release and trigger callback
    hitArea.on('pointerup', () => {
        scene.tweens.add({
            targets: [btnFace, label],
            y: 0, // Bounce back
            duration: 100,
            ease: 'Bounce.easeOut',
            onComplete: callback
        });
    });

    return container;
  }

  static createProgressBar(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number, initialValue: number = 1) {
    const container = scene.add.container(x, y);
    
    const bg = scene.add.graphics();
    bg.fillStyle(0xe5e7eb, 1);
    bg.fillRoundedRect(0, 0, width, height, height/2);
    
    const bar = scene.add.graphics();
    
    const update = (percentage: number) => {
      bar.clear();
      if (percentage > 0) {
        bar.fillStyle(color, 1);
        const w = Math.max(height, width * percentage); // Keep at least circle size
        bar.fillRoundedRect(0, 0, w, height, height/2);
        // Shine effect
        bar.fillStyle(0xffffff, 0.2);
        bar.fillRoundedRect(0, 0, w, height/2, { tl: height/2, tr: height/2, bl: 0, br: 0 });
      }
    };

    update(initialValue);
    
    container.add([bg, bar]);
    
    return { container, update };
  }

  static createPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number = COLORS.ui.panelBg) {
      const container = scene.add.container(x, y);
      
      // Soft drop shadow
      const shadow = scene.add.graphics();
      shadow.fillStyle(COLORS.ui.shadow, 0.1);
      shadow.fillRoundedRect(-width/2 + 8, -height/2 + 8, width, height, 24);
      
      // Main Panel
      const bg = scene.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 24);
      // Slight white border highlight
      bg.lineStyle(4, 0xffffff, 1);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 24);

      container.add([shadow, bg]);
      return container;
  }

  static createIconPill(scene: Phaser.Scene, x: number, y: number, icon: string, text: string, color: number) {
      const container = scene.add.container(x, y);
      
      const bg = scene.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-20, -20, 100, 40, 20); // Pill shape

      const iconText = scene.add.text(-10, 0, icon, { fontSize: '20px' }).setOrigin(0.5);
      const valueText = scene.add.text(20, 0, text, { 
          fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900', color: '#ffffff' 
      }).setOrigin(0.5);

      container.add([bg, iconText, valueText]);
      return container;
  }
}
