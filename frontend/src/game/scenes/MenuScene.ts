import Phaser from 'phaser';
import { GameData } from '../GameData';
import { UIManager } from '../../ui/UIManager';

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

        const gameData = GameData.getInstance();
        const playerLabel = this.add.text(width / 2, height / 2 + 160, `Jogador: ${gameData.playerName} (Mudar)`, {
            fontSize: '16px', color: '#8892b0', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', async () => {
                const newName = await UIManager.getInstance().showNamePrompt();
                if (newName && newName.trim() !== '') {
                    gameData.setPlayerName(newName);
                    playerLabel.setText(`Jogador: ${gameData.playerName} (Mudar)`);
                }
            });
    }
}
