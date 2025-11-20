
import Phaser from 'phaser';
import { Player, Enemy, Card, CardType, IntentType, StatusType, EffectType, TargetType, CardId } from '../../types';
import { CardEntity } from '../objects/CardEntity';
import { EnemyEntity } from '../objects/EnemyEntity';
import { CARD_DATABASE } from '../../data/cards';
import { WARRIOR_DATA } from '../../data/warrior'; // Default char for now
import { generateEnemyProfile } from '../../services/geminiService';
import { generateId } from '../../constants';

export class BattleScene extends Phaser.Scene {
  private player: Player;
  private enemies: Enemy[] = [];
  private deck: Card[] = [];
  private hand: Card[] = [];
  private discardPile: Card[] = [];
  private drawPile: Card[] = [];
  
  private enemyContainer: Phaser.GameObjects.Container;
  private handContainer: Phaser.GameObjects.Container;
  private uiContainer: Phaser.GameObjects.Container;

  private enemyEntities: Map<string, EnemyEntity> = new Map();
  private cardEntities: Map<string, CardEntity> = new Map();
  
  private level: number = 1;
  private turnCount: number = 0;
  private isPlayerTurn: boolean = true;
  
  private dragArrow: Phaser.GameObjects.Graphics;
  private energyText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private blockText: Phaser.GameObjects.Text;

  constructor() {
    super('BattleScene');
  }

  create() {
    this.level = 1;
    
    // Setup Player Data (Simplification: Use Warrior default)
    const starter = WARRIOR_DATA.startingDeck.map(id => ({ 
        ...CARD_DATABASE[id], 
        id: generateId(),
        templateId: id 
    }));

    this.deck = starter;
    this.drawPile = [...this.deck];
    this.discardPile = [];
    this.hand = [];

    this.player = {
        maxHp: WARRIOR_DATA.maxHp,
        currentHp: WARRIOR_DATA.maxHp,
        maxEnergy: WARRIOR_DATA.maxEnergy,
        currentEnergy: WARRIOR_DATA.maxEnergy,
        block: 0,
        statuses: [],
        skills: [WARRIOR_DATA.initialSkill],
        baseDrawCount: WARRIOR_DATA.baseDrawCount,
        fixedStartingHand: [],
        emoji: WARRIOR_DATA.emoji
    };

    // Containers
    this.enemyContainer = this.add.container(0, 0);
    this.handContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    
    // Background
    this.add.rectangle(640, 360, 1280, 720, 0xfffbeb).setDepth(-10);

    // UI Elements
    this.createUI();

    // Drag Arrow
    this.dragArrow = this.add.graphics().setDepth(100);

    // Start Level
    this.startLevel(1);

    // Input Events
    this.input.on('dragstart', (pointer, gameObject: CardEntity) => {
        if (!this.isPlayerTurn) return;
        this.children.bringToTop(gameObject);
        gameObject.highlight(true);
    });

    this.input.on('drag', (pointer, gameObject: CardEntity, dragX, dragY) => {
        if (!this.isPlayerTurn) return;
        
        gameObject.x = dragX;
        gameObject.y = dragY;

        // Draw arrow if target needed
        if (gameObject.cardData.effects.some(e => e.target === TargetType.SINGLE_ENEMY)) {
            this.drawArrow(gameObject.x, gameObject.y, pointer.x, pointer.y);
        }
    });

    this.input.on('dragend', (pointer, gameObject: CardEntity) => {
        if (!this.isPlayerTurn) return;
        
        this.dragArrow.clear();
        gameObject.highlight(false);

        const droppedOnEnemy = this.getEnemyAtPosition(pointer.x, pointer.y);
        const needsTarget = gameObject.cardData.effects.some(e => e.target === TargetType.SINGLE_ENEMY);
        
        // Play Card Logic
        if (pointer.y < 500) { // Dragged up
            if (needsTarget && droppedOnEnemy) {
                this.playCard(gameObject, droppedOnEnemy.id);
            } else if (!needsTarget) {
                this.playCard(gameObject);
            } else {
                // Return to hand
                this.arrangeHand();
            }
        } else {
            this.arrangeHand();
        }
    });
  }

  createUI() {
      // Player Avatar Area
      this.add.text(100, 500, this.player.emoji, { fontSize: '100px' }).setOrigin(0.5);
      
      // HP
      this.hpText = this.add.text(100, 580, `HP: ${this.player.currentHp}/${this.player.maxHp}`, { 
          fontFamily: 'Nunito', fontSize: '24px', color: '#e11d48', fontStyle: '900' 
      }).setOrigin(0.5);

      // Block
      this.blockText = this.add.text(100, 440, '', { 
        fontFamily: 'Nunito', fontSize: '24px', color: '#3b82f6', fontStyle: '900', stroke: '#fff', strokeThickness: 4 
      }).setOrigin(0.5);

      // Energy
      this.energyText = this.add.text(100, 620, `⚡ ${this.player.currentEnergy}/${this.player.maxEnergy}`, {
          fontFamily: 'Nunito', fontSize: '32px', color: '#d97706', fontStyle: '900'
      }).setOrigin(0.5);

      // End Turn Button
      const btn = this.add.rectangle(1150, 600, 180, 60, 0xf59e0b)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(3, 0xffffff);
      
      const btnText = this.add.text(1150, 600, '结束回合', {
          fontFamily: 'Nunito', fontSize: '24px', fontStyle: '900'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
          if (this.isPlayerTurn) this.endTurn();
      });
  }

  async startLevel(level: number) {
      // Clear old enemies
      this.enemyEntities.forEach(e => e.destroy());
      this.enemyEntities.clear();
      this.enemies = [];

      // Generate Enemy (Mock for Phaser)
      const profile = await generateEnemyProfile(level);
      const enemyId = generateId();
      const bossHp = Math.floor(80 * Math.pow(1.1, level - 1));

      const newEnemy: Enemy = {
          id: enemyId,
          name: profile.name,
          description: profile.description,
          maxHp: bossHp,
          currentHp: bossHp,
          block: 0,
          intent: IntentType.ATTACK,
          intentValue: 6 + level,
          emoji: profile.emoji,
          statuses: [],
          isBoss: true
      };

      this.enemies.push(newEnemy);
      
      const entity = new EnemyEntity(this, 900, 400, newEnemy);
      this.enemyContainer.add(entity);
      this.enemyEntities.set(enemyId, entity);

      this.drawPile = [...this.deck].sort(() => Math.random() - 0.5);
      this.discardPile = [];
      this.startPlayerTurn();
  }

  startPlayerTurn() {
      this.isPlayerTurn = true;
      this.turnCount++;
      this.player.currentEnergy = this.player.maxEnergy;
      this.player.block = 0;
      this.updatePlayerUI();

      this.drawCards(this.player.baseDrawCount);
  }

  drawCards(count: number) {
      for(let i=0; i<count; i++) {
          if(this.drawPile.length === 0) {
              if (this.discardPile.length === 0) break;
              this.drawPile = this.discardPile.sort(() => Math.random() - 0.5);
              this.discardPile = [];
          }
          const card = this.drawPile.pop();
          if(card) this.hand.push(card);
      }
      this.renderHand();
  }

  renderHand() {
      // Clear existing card objects (pooling would be better but keeping it simple)
      this.cardEntities.forEach(c => c.destroy());
      this.cardEntities.clear();

      const startX = 350;
      const spacing = 120;
      
      this.hand.forEach((card, index) => {
          const entity = new CardEntity(this, 640, 900, card); // Start offscreen
          this.handContainer.add(entity);
          this.cardEntities.set(card.id, entity);

          // Tween to position
          this.tweens.add({
              targets: entity,
              x: startX + (index * spacing),
              y: 600,
              angle: (index - (this.hand.length-1)/2) * 5,
              duration: 300,
              delay: index * 50
          });
      });
  }

  arrangeHand() {
      const startX = 350;
      const spacing = 120;
      let index = 0;
      this.cardEntities.forEach(entity => {
          this.tweens.add({
              targets: entity,
              x: startX + (index * spacing),
              y: 600,
              angle: (index - (this.cardEntities.size-1)/2) * 5,
              scale: 1,
              duration: 200
          });
          index++;
      });
  }

  playCard(cardEntity: CardEntity, targetId?: string) {
      if (this.player.currentEnergy < cardEntity.cost) {
          this.showFloatingText(cardEntity.x, cardEntity.y - 100, "能量不足!", '#ff0000');
          this.arrangeHand();
          return;
      }

      // Cost
      this.player.currentEnergy -= cardEntity.cost;
      
      // Effects
      cardEntity.cardData.effects.forEach(effect => {
          this.resolveEffect(effect, targetId);
      });

      // Remove from hand
      this.hand = this.hand.filter(c => c.id !== cardEntity.id);
      this.discardPile.push(cardEntity.cardData);
      
      // Animate discard
      this.tweens.add({
          targets: cardEntity,
          x: 1200,
          y: 700,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => {
              cardEntity.destroy();
              this.cardEntities.delete(cardEntity.id);
              this.arrangeHand();
          }
      });

      this.updatePlayerUI();
  }

  resolveEffect(effect: any, targetId?: string) {
      // Simplified logic for Phaser demo
      if (effect.type === EffectType.DAMAGE) {
          const target = this.enemies.find(e => e.id === targetId);
          if (target) {
              target.currentHp = Math.max(0, target.currentHp - effect.value);
              const entity = this.enemyEntities.get(target.id);
              entity?.updateData(target);
              entity?.hitEffect(effect.value);
          }
      } else if (effect.type === EffectType.BLOCK) {
          this.player.block += effect.value;
          this.showFloatingText(200, 400, `+${effect.value} 🛡️`, '#3b82f6');
      } else if (effect.type === EffectType.HEAL) {
          this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + effect.value);
          this.showFloatingText(200, 400, `+${effect.value} ❤️`, '#10b981');
      } else if (effect.type === EffectType.DRAW) {
          this.drawCards(effect.value);
      } else if (effect.type === EffectType.ADD_ENERGY) {
          this.player.currentEnergy += effect.value;
      }

      // Check win
      if (this.enemies.every(e => e.currentHp <= 0)) {
          setTimeout(() => {
             this.scene.start('RewardScene');
          }, 1000);
      }
  }

  endTurn() {
      this.isPlayerTurn = false;
      
      // Discard Hand
      this.hand.forEach(c => this.discardPile.push(c));
      this.hand = [];
      this.renderHand();

      // Enemy Turn
      this.time.delayedCall(500, () => this.processEnemyTurn());
  }

  processEnemyTurn() {
      this.enemies.forEach(enemy => {
          if (enemy.currentHp <= 0) return;

          if (enemy.intent === IntentType.ATTACK) {
              let damage = enemy.intentValue;
              if (this.player.block >= damage) {
                  this.player.block -= damage;
                  damage = 0;
              } else {
                  damage -= this.player.block;
                  this.player.block = 0;
              }
              this.player.currentHp -= damage;
              
              // Camera shake
              if (damage > 0) {
                  this.cameras.main.shake(200, 0.01);
                  this.showFloatingText(200, 500, `-${damage}`, '#e11d48');
              }
          } else if (enemy.intent === IntentType.BUFF) {
              enemy.block += 5;
              const ent = this.enemyEntities.get(enemy.id);
              ent?.updateData(enemy);
          }

          // Update Intent for next turn (Random)
          enemy.intent = Math.random() > 0.3 ? IntentType.ATTACK : IntentType.BUFF;
          enemy.intentValue = Math.floor(Math.random() * 5) + 5;
          const ent = this.enemyEntities.get(enemy.id);
          ent?.updateData(enemy);
      });

      this.updatePlayerUI();
      
      if (this.player.currentHp <= 0) {
          this.scene.start('GameOverScene');
      } else {
          this.time.delayedCall(1000, () => this.startPlayerTurn());
      }
  }

  getEnemyAtPosition(x: number, y: number): Enemy | undefined {
      for (const [id, entity] of this.enemyEntities) {
          const bounds = entity.getBounds();
          if (bounds.contains(x, y)) {
              return this.enemies.find(e => e.id === id);
          }
      }
      return undefined;
  }

  drawArrow(startX: number, startY: number, endX: number, endY: number) {
      this.dragArrow.clear();
      this.dragArrow.lineStyle(4, 0xff0000);
      this.dragArrow.beginPath();
      this.dragArrow.moveTo(startX, startY);
      this.dragArrow.lineTo(endX, endY);
      this.dragArrow.strokePath();
      this.dragArrow.fillCircle(endX, endY, 10);
  }

  showFloatingText(x: number, y: number, text: string, color: string) {
      const t = this.add.text(x, y, text, { 
          fontFamily: 'Nunito', fontSize: '40px', fontStyle: '900', color: color, stroke: '#fff', strokeThickness: 4 
      }).setOrigin(0.5);
      this.tweens.add({
          targets: t, y: y - 100, alpha: 0, duration: 1000, onComplete: () => t.destroy()
      });
  }

  updatePlayerUI() {
      this.hpText.setText(`HP: ${this.player.currentHp}/${this.player.maxHp}`);
      this.energyText.setText(`⚡ ${this.player.currentEnergy}/${this.player.maxEnergy}`);
      
      if (this.player.block > 0) {
          this.blockText.setText(`🛡️${this.player.block}`);
          this.blockText.setVisible(true);
      } else {
          this.blockText.setVisible(false);
      }
  }
}
