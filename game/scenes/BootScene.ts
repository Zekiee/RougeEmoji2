import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // We are using Emojis and Google Fonts (loaded in HTML), 
    // so we just need a small delay or check to ensure fonts are ready.
    // In a real asset pipeline, we'd load images/spritesheets here.
    
    // Create a dummy text to force font loading
    this.add.text(0, 0, 'Loading...', { fontFamily: 'Nunito', fontStyle: '900' }).setAlpha(0);
  }

  create() {
    this.scene.start('MenuScene');
  }
}