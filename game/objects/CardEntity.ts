
import Phaser from 'phaser';
import { Card, CardType, CardTheme } from '../../types';

export class CardEntity extends Phaser.GameObjects.Container {
  public id: string;
  public cost: number;
  public cardData: Card;
  
  private bg: Phaser.GameObjects.Rectangle;
  private glow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card) {
    super(scene, x, y);
    this.cardData = card;
    this.id = card.id;
    this.cost = card.cost;

    // Interactive area
    this.setSize(140, 200);

    // Glow (Hidden by default)
    this.glow = scene.add.rectangle(0, 0, 150, 210, 0xffd700).setAlpha(0);
    this.add(this.glow);

    // Card Background based on Theme
    let color = 0xf8fafc; // Slate-50
    let borderColor = 0x94a3b8;
    
    switch (card.theme) {
        case CardTheme.FIRE: color = 0xfff7ed; borderColor = 0xc2410c; break;
        case CardTheme.ICE: color = 0xecfeff; borderColor = 0x0e7490; break;
        case CardTheme.POISON: color = 0xfaf5ff; borderColor = 0x7e22ce; break;
        case CardTheme.DARK: color = 0xf3f4f6; borderColor = 0x374151; break;
        case CardTheme.HOLY: color = 0xfefce8; borderColor = 0xa16207; break;
    }

    this.bg = scene.add.rectangle(0, 0, 140, 200, color, 1)
      .setStrokeStyle(3, borderColor);
    this.add(this.bg);

    // Type Ribbon
    let typeColor = 0x64748b;
    if (card.type === CardType.ATTACK) typeColor = 0xf43f5e;
    else if (card.type === CardType.SKILL) typeColor = 0x0ea5e9;
    else if (card.type === CardType.POWER) typeColor = 0x10b981;

    const ribbon = scene.add.rectangle(0, -40, 130, 24, typeColor).setAlpha(0.9);
    this.add(ribbon);

    const typeText = scene.add.text(0, -40, this.getTypeLabel(card.type), {
        fontSize: '12px', fontFamily: 'Nunito', fontStyle: '900', color: '#ffffff'
    }).setOrigin(0.5);
    this.add(typeText);

    // Emoji Art
    const art = scene.add.text(0, -10, card.emoji || '🃏', {
        fontSize: '64px'
    }).setOrigin(0.5);
    this.add(art);

    // Name
    const nameText = scene.add.text(0, 35, card.name, {
        fontSize: '14px', fontFamily: 'Nunito', fontStyle: '900', color: '#1e293b',
        wordWrap: { width: 130, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.add(nameText);

    // Description
    const descText = scene.add.text(0, 65, card.description, {
        fontSize: '10px', fontFamily: 'Nunito', fontStyle: 'bold', color: '#475569', align: 'center',
        wordWrap: { width: 120 }
    }).setOrigin(0.5, 0);
    this.add(descText);

    // Cost Bubble
    const costCircle = scene.add.circle(-60, -90, 18, 0x2563eb).setStrokeStyle(2, 0xffffff);
    this.add(costCircle);
    const costText = scene.add.text(-60, -90, card.cost.toString(), {
        fontSize: '20px', fontFamily: 'Nunito', fontStyle: '900', color: '#ffffff'
    }).setOrigin(0.5);
    this.add(costText);

    // Enable input
    this.setInteractive({ draggable: true });
    scene.add.existing(this);
  }

  getTypeLabel(type: CardType) {
      switch(type) {
          case CardType.ATTACK: return 'ATTACK';
          case CardType.SKILL: return 'SKILL';
          case CardType.POWER: return 'POWER';
          default: return 'CARD';
      }
  }

  highlight(isHighlighted: boolean) {
    this.glow.setAlpha(isHighlighted ? 1 : 0);
    if (isHighlighted) {
        this.setScale(1.1);
        this.setDepth(100);
    } else {
        this.setScale(1.0);
        this.setDepth(1);
    }
  }
}
