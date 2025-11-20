import Phaser from 'phaser';
import { Card, CardType, CardTheme } from '../../types';
import { COLORS, TEXT_STYLES } from '../utils/theme';

export class CardEntity extends Phaser.GameObjects.Container {
  public id: string;
  public cost: number;
  public cardData: Card;
  
  private bg: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private artContainer: Phaser.GameObjects.Container;

  // Dimensions
  private static WIDTH = 150;
  private static HEIGHT = 220;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card) {
    super(scene, x, y);
    this.cardData = card;
    this.id = card.id;
    this.cost = card.cost;

    this.setSize(CardEntity.WIDTH, CardEntity.HEIGHT);

    // 1. Glow/Shadow
    this.glow = scene.add.graphics();
    this.glow.fillStyle(COLORS.warning, 0.6);
    this.glow.fillRoundedRect(-CardEntity.WIDTH/2 - 8, -CardEntity.HEIGHT/2 - 8, CardEntity.WIDTH + 16, CardEntity.HEIGHT + 16, 20);
    this.glow.setAlpha(0);
    this.add(this.glow);

    // 2. Card Base (White with Border)
    this.bg = scene.add.graphics();
    this.drawCardBase(card.theme);
    this.add(this.bg);

    // 3. Art Area (Top Half)
    this.artContainer = scene.add.container(0, -50);
    
    // Art Background Circle/Blob
    const artBg = scene.add.circle(0, 0, 45, 0xffffff, 0.8);
    this.artContainer.add(artBg);
    
    // Emoji with little bounce
    const art = scene.add.text(0, 0, card.emoji || '🃏', { fontSize: '72px' }).setOrigin(0.5);
    this.artContainer.add(art);
    
    // Continuous idle float for art
    scene.tweens.add({
        targets: art,
        y: -5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    
    this.add(this.artContainer);

    // 4. Title Banner
    const titleY = 10;
    const titleBg = scene.add.graphics();
    titleBg.fillStyle(0xffffff, 0.9);
    titleBg.fillRoundedRect(-CardEntity.WIDTH/2 + 10, titleY - 15, CardEntity.WIDTH - 20, 30, 8);
    this.add(titleBg);

    const nameText = scene.add.text(0, titleY, card.name, {
        ...TEXT_STYLES.cardName,
        fontSize: '16px',
    }).setOrigin(0.5);
    this.add(nameText);

    // 5. Description Area
    const descY = 55;
    const descText = scene.add.text(0, descY, card.description, {
        ...TEXT_STYLES.cardDesc,
        fontSize: '13px',
        color: COLORS.text.main,
        align: 'center',
        wordWrap: { width: CardEntity.WIDTH - 30 }
    }).setOrigin(0.5, 0);
    this.add(descText);

    // 6. Cost Badge (Top Left, hanging off)
    const costGroup = scene.add.container(-CardEntity.WIDTH/2 + 10, -CardEntity.HEIGHT/2 + 10);
    
    const costBg = scene.add.circle(0, 0, 20, COLORS.energy);
    const costStroke = scene.add.graphics();
    costStroke.lineStyle(3, 0xffffff);
    costStroke.strokeCircle(0, 0, 20);
    
    const costText = scene.add.text(0, 0, card.cost.toString(), {
        fontFamily: 'Nunito', fontSize: '24px', fontStyle: '900', color: '#ffffff'
    }).setOrigin(0.5);
    
    costGroup.add([costBg, costStroke, costText]);
    this.add(costGroup);

    // 7. Type Icon/Tag (Bottom Center)
    this.drawTypeTag(card.type);

    // Input
    this.setInteractive({ draggable: true });
    scene.add.existing(this);
  }

  private drawCardBase(theme?: CardTheme) {
    let mainColor = COLORS.light;
    let accentColor = COLORS.card.border;

    switch (theme) {
        case CardTheme.FIRE: mainColor = 0xfffaeb; accentColor = COLORS.danger; break;
        case CardTheme.ICE: mainColor = 0xf0f9ff; accentColor = COLORS.secondary; break;
        case CardTheme.POISON: mainColor = 0xfaf5ff; accentColor = 0x9333ea; break;
        case CardTheme.DARK: mainColor = 0xf8fafc; accentColor = COLORS.dark; break;
        case CardTheme.HOLY: mainColor = 0xfffbeb; accentColor = COLORS.warning; break;
    }

    this.bg.clear();
    
    // Shadow layer (Baked in card)
    this.bg.fillStyle(0x000000, 0.1);
    this.bg.fillRoundedRect(-CardEntity.WIDTH/2 + 4, -CardEntity.HEIGHT/2 + 4, CardEntity.WIDTH, CardEntity.HEIGHT, 16);

    // Main Body
    this.bg.fillStyle(mainColor, 1);
    this.bg.fillRoundedRect(-CardEntity.WIDTH/2, -CardEntity.HEIGHT/2, CardEntity.WIDTH, CardEntity.HEIGHT, 16);
    
    // Thick Border
    this.bg.lineStyle(4, accentColor, 1);
    this.bg.strokeRoundedRect(-CardEntity.WIDTH/2, -CardEntity.HEIGHT/2, CardEntity.WIDTH, CardEntity.HEIGHT, 16);
    
    // Header Background color splash
    this.bg.fillStyle(accentColor, 0.1);
    this.bg.fillRoundedRect(-CardEntity.WIDTH/2, -CardEntity.HEIGHT/2, CardEntity.WIDTH, 90, { tl: 12, tr: 12, bl: 40, br: 40 }); // Curve bottom
  }

  private drawTypeTag(type: CardType) {
      let color = COLORS.text.muted;
      let text = 'CARD';
      let icon = '⚪';
      
      switch(type) {
          case CardType.ATTACK: color = COLORS.danger; text = 'ATTACK'; icon='⚔️'; break;
          case CardType.SKILL: color = COLORS.secondary; text = 'SKILL'; icon='✨'; break;
          case CardType.POWER: color = COLORS.success; text = 'POWER'; icon='⚡'; break;
      }

      const y = CardEntity.HEIGHT/2 - 15;
      
      // Small pill tag
      const tag = this.scene.add.graphics();
      tag.fillStyle(typeof color === 'string' ? parseInt(color.replace('#', '0x')) : color, 1);
      tag.fillRoundedRect(-50, y - 10, 100, 20, 10);
      this.add(tag);

      const label = this.scene.add.text(0, y, `${icon} ${text}`, {
          fontFamily: 'Nunito', fontSize: '10px', fontStyle: '900', color: '#ffffff'
      }).setOrigin(0.5);
      this.add(label);
  }

  highlight(isHighlighted: boolean) {
    this.scene.tweens.add({
        targets: this.glow,
        alpha: isHighlighted ? 1 : 0,
        duration: 200,
        ease: 'Quad.easeOut'
    });
    
    this.scene.tweens.add({
        targets: this,
        scale: isHighlighted ? 1.15 : 1.0,
        y: isHighlighted ? this.y - 20 : this.y, // Rise up
        duration: 200,
        ease: 'Back.easeOut'
    });

    if (isHighlighted) {
        this.setDepth(100);
    } else {
        this.setDepth(1);
    }
  }
}
