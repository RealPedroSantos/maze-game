import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 50, 'MAZE GAME', {
            fontSize: '48px', color: '#ffffff', fontFamily: 'Courier'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, '[ PLAY ]', {
            fontSize: '32px', color: '#00ff00', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('PlayingScene'));

        this.add.text(width / 2, height / 2 + 100, '[ RANKING ]', {
            fontSize: '24px', color: '#ffff00', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('RankingScene'));
    }
}
