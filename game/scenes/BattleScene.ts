import Phaser from 'phaser';
import { Player, Enemy, Card, CardType, IntentType, StatusType, EffectType, TargetType, CardId } from '../../types';
import { CardEntity } from '../objects/CardEntity';
import { EnemyEntity } from '../objects/EnemyEntity';
import { CARD_DATABASE } from '../../data/cards';
import { WARRIOR_DATA } from '../../data/warrior'; 
import { generateEnemyProfile } from '../../services/geminiService';
import { generateId } from '../../constants';
import { UIHelper } from '../utils/UIHelper';
import { COLORS, TEXT_STYLES } from '../utils/theme';

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
  private fxContainer: Phaser.GameObjects.Container;

  private enemyEntities: Map<string, EnemyEntity> = new Map();
  private cardEntities: Map<string, CardEntity> = new Map();
  
  private level: number = 1;
  private turnCount: number = 0;
  private isPlayerTurn: boolean = true;
  
  private dragArrow: Phaser.GameObjects.Graphics;
  
  // UI Components
  private energyText: Phaser.GameObjects.Text;
  private hpBar: { container: Phaser.GameObjects.Container, update: (val: number) => void };
  private hpTextLabel: Phaser.GameObjects.Text;
  private blockText: Phaser.GameObjects.Text;
  private pileText: Phaser.GameObjects.Text;
  private turnBanner: Phaser.GameObjects.Container;

  constructor() {
    super('BattleScene');
  }

  create() {
    this.cameras.main.fadeIn(500, 255, 255, 255);
    this.level = 1;
    
    // Setup Player Data
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

    // Layers
    this.createBackground();
    this.enemyContainer = this.add.container(0, 0);
    this.handContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.fxContainer = this.add.container(0, 0);

    this.enemyContainer.setDepth(10);
    this.uiContainer.setDepth(20);
    this.handContainer.setDepth(30);
    this.fxContainer.setDepth(40);

    this.createUI();
    this.dragArrow = this.add.graphics().setDepth(1000);

    // Start Level
    this.startLevel(1);

    // Input Events
    this.input.on('dragstart', (pointer, gameObject: CardEntity) => {
        if (!this.isPlayerTurn) return;
        this.children.bringToTop(this.handContainer);
        this.handContainer.bringToTop(gameObject);
        gameObject.highlight(true);
    });

    this.input.on('drag', (pointer, gameObject: CardEntity, dragX, dragY) => {
        if (!this.isPlayerTurn) return;
        
        gameObject.x = dragX;
        gameObject.y = dragY;

        // Draw arrow
        if (gameObject.cardData.effects.some(e => e.target === TargetType.SINGLE_ENEMY)) {
            const startX = this.handContainer.x + gameObject.x;
            const startY = this.handContainer.y + gameObject.y;
            this.drawArrow(startX, startY, pointer.x, pointer.y);
        }
    });

    this.input.on('dragend', (pointer, gameObject: CardEntity) => {
        if (!this.isPlayerTurn) return;
        
        this.dragArrow.clear();
        gameObject.highlight(false);

        const droppedOnEnemy = this.getEnemyAtPosition(pointer.x, pointer.y);
        const needsTarget = gameObject.cardData.effects.some(e => e.target === TargetType.SINGLE_ENEMY);
        
        if (pointer.y < 600) { 
            if (needsTarget && droppedOnEnemy) {
                this.playCard(gameObject, droppedOnEnemy.id);
            } else if (!needsTarget) {
                this.playCard(gameObject);
            } else {
                this.arrangeHand();
            }
        } else {
            this.arrangeHand();
        }
    });
  }

  createBackground() {
      const width = this.scale.width;
      const height = this.scale.height;

      // "Nintendo" Style Simple Background
      // Polka dot pattern
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.light, 1);
      bg.fillRect(0, 0, width, height);

      bg.fillStyle(0x000000, 0.03);
      for (let x = 0; x < width; x += 40) {
          for (let y = 0; y < height; y += 40) {
             if ((x/40) % 2 === (y/40) % 2) {
                 bg.fillCircle(x, y, 4);
             }
          }
      }

      // Floating decorative shapes
      for(let i=0; i<5; i++) {
          const shape = this.add.circle(
              Math.random() * width, 
              Math.random() * height, 
              Math.random() * 50 + 20, 
              Math.random() > 0.5 ? COLORS.primary : COLORS.secondary, 
              0.1
          );
          this.tweens.add({
              targets: shape,
              y: shape.y + (Math.random() * 100 - 50),
              duration: 5000 + Math.random() * 5000,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
          });
      }
  }

  createUI() {
      const width = this.scale.width;
      const height = this.scale.height;

      // --- Bottom Panel (Hand Area) ---
      // Using a curved "tray" at the bottom
      const bottomPanel = this.add.graphics();
      bottomPanel.fillStyle(0xffffff, 0.95);
      bottomPanel.fillRoundedRect(100, height - 220, width - 200, 250, 40);
      // Add a shadow
      bottomPanel.lineStyle(8, 0xe5e7eb, 0.5);
      bottomPanel.strokeRoundedRect(100, height - 220, width - 200, 250, 40);
      this.uiContainer.add(bottomPanel);
      
      // --- Player Info (Left Side Pill) ---
      const playerPill = UIHelper.createPanel(this, 120, height - 100, 220, 120, COLORS.white);
      this.uiContainer.add(playerPill);

      const playerAvatar = this.add.text(70, height - 100, this.player.emoji, { fontSize: '80px' }).setOrigin(0.5);
      this.uiContainer.add(playerAvatar);
      // Bounce Avatar
      this.tweens.add({ targets: playerAvatar, scale: 1.05, duration: 500, yoyo: true, repeat: -1 });

      // HP Bar
      this.hpBar = UIHelper.createProgressBar(this, 160, height - 110, 140, 20, COLORS.danger, 1);
      this.uiContainer.add(this.hpBar.container);
      
      this.hpTextLabel = this.add.text(230, height - 110, '', { ...TEXT_STYLES.body, fontSize: '14px', color: '#fff' }).setOrigin(0.5);
      this.uiContainer.add(this.hpTextLabel);

      // Block Icon
      this.blockText = this.add.text(70, height - 150, '', { 
          fontFamily: 'Nunito', fontSize: '32px', fontStyle: '900', color: '#48cae4', stroke: '#fff', strokeThickness: 4 
      }).setOrigin(0.5).setVisible(false);
      this.uiContainer.add(this.blockText);

      // Energy Orb (Floating)
      const energyBg = this.add.circle(140, height - 60, 30, COLORS.energy);
      this.uiContainer.add(energyBg);
      
      this.energyText = this.add.text(140, height - 60, '3', { 
          fontFamily: 'Nunito', fontSize: '32px', fontStyle: '900', color: '#ffffff' 
      }).setOrigin(0.5);
      this.uiContainer.add(this.energyText);

      // Deck/Discard Info (Small Pills)
      this.pileText = this.add.text(width - 60, height - 50, 'Deck: 0\nDisc: 0', {
          fontFamily: 'Nunito', fontSize: '14px', color: COLORS.text.muted, align: 'right'
      }).setOrigin(1, 1);
      this.uiContainer.add(this.pileText);

      // End Turn Button (Chunky 3D)
      const endTurnBtn = UIHelper.createButton(this, width - 120, height - 150, '结束回合', () => {
          if (this.isPlayerTurn) this.endTurn();
      }, { color: COLORS.warning, width: 160, height: 60 });
      this.uiContainer.add(endTurnBtn);

      // Turn Banner (Hidden initially)
      this.turnBanner = this.add.container(width/2, height/2 - 100).setAlpha(0).setDepth(1000);
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0x000000, 0.7);
      bannerBg.fillRoundedRect(-300, -50, 600, 100, 50);
      const bannerText = this.add.text(0, 0, '', { 
          fontFamily: 'Nunito', fontSize: '48px', fontStyle: '900', color: '#ffffff' 
      }).setOrigin(0.5);
      this.turnBanner.add([bannerBg, bannerText]);
      this.turnBanner.setData('text', bannerText);

      this.updatePlayerUI();
  }

  showTurnBanner(text: string, color: number) {
      const bannerText = this.turnBanner.getData('text') as Phaser.GameObjects.Text;
      bannerText.setText(text);
      bannerText.setColor('#ffffff'); // Always white text
      
      // Background color change could be implemented if bg was accessible, keeping it simple black/dark for contrast
      
      this.turnBanner.setVisible(true);
      this.turnBanner.setY(this.scale.height/2 - 100);
      this.turnBanner.setScale(0.5);
      
      this.tweens.add({
          targets: this.turnBanner,
          alpha: 1,
          scale: 1.2,
          duration: 400,
          ease: 'Back.easeOut',
          onComplete: () => {
              this.time.delayedCall(800, () => {
                  this.tweens.add({
                      targets: this.turnBanner,
                      alpha: 0,
                      scale: 1.5,
                      duration: 300,
                      onComplete: () => this.turnBanner.setVisible(false)
                  });
              });
          }
      });
  }

  async startLevel(level: number) {
      // Clear old enemies
      this.enemyEntities.forEach(e => e.destroy());
      this.enemyEntities.clear();
      this.enemies = [];

      // Generate Enemy
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
      
      // Position enemy visually centered
      const entity = new EnemyEntity(this, this.scale.width/2, 300, newEnemy);
      this.enemyContainer.add(entity);
      this.enemyEntities.set(enemyId, entity);

      // Enter Animation for Enemy
      entity.setScale(0);
      this.tweens.add({
          targets: entity,
          scale: 1,
          duration: 600,
          ease: 'Bounce.easeOut'
      });

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
      
      this.showTurnBanner('你的回合', COLORS.primary);

      this.time.delayedCall(1000, () => {
        this.drawCards(this.player.baseDrawCount);
      });
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
      this.updatePlayerUI();
  }

  renderHand() {
      this.cardEntities.forEach(c => c.destroy());
      this.cardEntities.clear();

      const cardWidth = 160; // Approximate from CardEntity
      const totalWidth = Math.min(this.scale.width - 200, this.hand.length * (cardWidth - 60)); // Overlap
      const startX = (this.scale.width / 2) - (totalWidth / 2); 
      const spacing = this.hand.length > 1 ? totalWidth / (this.hand.length - 1) : 0;
      
      this.hand.forEach((card, index) => {
          const entity = new CardEntity(this, this.scale.width/2, 1000, card); 
          this.handContainer.add(entity);
          this.cardEntities.set(card.id, entity);

          const targetX = this.hand.length === 1 ? this.scale.width/2 : startX + (index * spacing);
          const targetAngle = (index - (this.hand.length-1)/2) * 5; // Fan out more

          this.tweens.add({
              targets: entity,
              x: targetX,
              y: this.scale.height - 180, // Adjusted: Moved up to be visible
              angle: targetAngle,
              duration: 400,
              delay: index * 50,
              ease: 'Back.easeOut'
          });
      });
  }

  arrangeHand() {
      const cardWidth = 160; 
      const totalWidth = Math.min(this.scale.width - 200, this.hand.length * (cardWidth - 60));
      const startX = (this.scale.width / 2) - (totalWidth / 2);
      const spacing = this.hand.length > 1 ? totalWidth / (this.hand.length - 1) : 0;

      let index = 0;
      this.cardEntities.forEach(entity => {
          const targetX = this.hand.length === 1 ? this.scale.width/2 : startX + (index * spacing);
          const targetAngle = (index - (this.cardEntities.size-1)/2) * 5;

          this.tweens.add({
              targets: entity,
              x: targetX,
              y: this.scale.height - 180,
              angle: targetAngle,
              scale: 1,
              duration: 200,
              ease: 'Power2'
          });
          index++;
      });
  }

  playCard(cardEntity: CardEntity, targetId?: string) {
      if (this.player.currentEnergy < cardEntity.cost) {
          this.showFloatingText(cardEntity.x, cardEntity.y - 100, "能量不足!", COLORS.danger);
          this.arrangeHand();
          return;
      }

      this.player.currentEnergy -= cardEntity.cost;
      
      cardEntity.cardData.effects.forEach(effect => {
          this.resolveEffect(effect, targetId);
      });

      this.hand = this.hand.filter(c => c.id !== cardEntity.id);
      this.discardPile.push(cardEntity.cardData);
      
      // Swoosh animation
      this.tweens.add({
          targets: cardEntity,
          x: this.scale.width + 200,
          y: -200,
          angle: 360,
          scale: 0.5,
          duration: 500,
          ease: 'Cubic.easeIn',
          onComplete: () => {
              cardEntity.destroy();
              this.cardEntities.delete(cardEntity.id);
              this.arrangeHand();
          }
      });

      this.updatePlayerUI();
  }

  resolveEffect(effect: any, targetId?: string) {
      if (effect.type === EffectType.DAMAGE) {
          const target = this.enemies.find(e => e.id === targetId);
          if (target) {
              target.currentHp = Math.max(0, target.currentHp - effect.value);
              const entity = this.enemyEntities.get(target.id);
              entity?.updateData(target);
              entity?.hitEffect(effect.value);
              this.showFloatingText(entity!.x, entity!.y - 150, `-${effect.value}`, COLORS.danger, true);
          }
      } else if (effect.type === EffectType.BLOCK) {
          this.player.block += effect.value;
          this.showFloatingText(200, 400, `+${effect.value} 🛡️`, COLORS.block);
      } else if (effect.type === EffectType.HEAL) {
          this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + effect.value);
          this.showFloatingText(200, 400, `+${effect.value} ❤️`, COLORS.success);
      } else if (effect.type === EffectType.DRAW) {
          this.drawCards(effect.value);
      } else if (effect.type === EffectType.ADD_ENERGY) {
          this.player.currentEnergy += effect.value;
      }

      if (this.enemies.every(e => e.currentHp <= 0)) {
          this.time.delayedCall(1000, () => {
             this.scene.start('RewardScene');
          });
      }
  }

  endTurn() {
      this.isPlayerTurn = false;
      
      this.hand.forEach(c => this.discardPile.push(c));
      this.hand = [];
      this.renderHand();

      this.showTurnBanner('敌人回合', COLORS.danger);
      this.time.delayedCall(1500, () => this.processEnemyTurn());
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
              
              if (damage > 0) {
                  this.cameras.main.shake(200, 0.01);
                  this.showFloatingText(200, 500, `-${damage}`, COLORS.danger, true);
              }
          } else if (enemy.intent === IntentType.BUFF) {
              enemy.block += 5;
              const ent = this.enemyEntities.get(enemy.id);
              ent?.updateData(enemy);
              this.showFloatingText(ent!.x, ent!.y - 100, 'Buff!', COLORS.secondary);
          }

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
      let closest: Enemy | undefined;
      let minDist = 200; 

      this.enemyEntities.forEach((entity, id) => {
          const dist = Phaser.Math.Distance.Between(x, y, entity.x, entity.y);
          if (dist < minDist) {
              minDist = dist;
              closest = this.enemies.find(e => e.id === id);
          }
      });
      return closest;
  }

  drawArrow(startX: number, startY: number, endX: number, endY: number) {
      this.dragArrow.clear();
      this.dragArrow.lineStyle(8, COLORS.primary);
      
      const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(startX, startY),
          new Phaser.Math.Vector2((startX + endX)/2, startY - 150),
          new Phaser.Math.Vector2(endX, endY)
      );
      curve.draw(this.dragArrow);
      
      this.dragArrow.fillStyle(COLORS.primary, 1);
      this.dragArrow.fillCircle(endX, endY, 15);
  }

  showFloatingText(x: number, y: number, text: string, color: number | string, isDamage: boolean = false) {
      const colorStr = typeof color === 'number' ? '#' + color.toString(16) : color;
      const t = this.add.text(x, y, text, { 
          fontFamily: 'Nunito', fontSize: isDamage ? '64px' : '48px', fontStyle: '900', color: colorStr as string, 
          stroke: '#fff', strokeThickness: isDamage ? 8 : 6
      }).setOrigin(0.5).setDepth(200);
      
      // Juice: Scale up then fall down
      t.setScale(0);
      this.tweens.add({
          targets: t,
          scale: 1,
          y: y - 50,
          duration: 300,
          ease: 'Back.easeOut',
          onComplete: () => {
              this.tweens.add({
                  targets: t,
                  y: y + 50,
                  alpha: 0,
                  duration: 600,
                  delay: 200,
                  ease: 'Quad.easeIn',
                  onComplete: () => t.destroy()
              });
          }
      });
  }

  updatePlayerUI() {
      this.hpBar.update(this.player.currentHp / this.player.maxHp);
      this.hpTextLabel.setText(`${this.player.currentHp}/${this.player.maxHp}`);
      this.energyText.setText(`${this.player.currentEnergy}`);
      this.pileText.setText(`Deck: ${this.drawPile.length}\nDisc: ${this.discardPile.length}`);

      if (this.player.block > 0) {
          this.blockText.setText(`🛡️${this.player.block}`);
          this.blockText.setVisible(true);
      } else {
          this.blockText.setVisible(false);
      }
  }
}
