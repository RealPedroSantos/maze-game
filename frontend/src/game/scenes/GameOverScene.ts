import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
            fontSize: '48px', color: '#ff0000', fontFamily: 'Courier'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, 'Jogar novamente', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('PlayingScene'));

        this.add.text(width / 2, height / 2 + 100, 'Voltar ao Menu', {
            fontSize: '24px', color: '#aaaaaa', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
