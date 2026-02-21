import Phaser from 'phaser';
import { UIManager } from '../../ui/UIManager';
import { GameData } from '../GameData';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // preload loading bar or splash screen assets if any
    }

    async create() {
        const text = this.add.text(10, 10, 'Initializing Systems...', { color: '#0f0' });

        // Check if player name exists
        const gameData = GameData.getInstance();

        if (!gameData.playerName) {
            text.setText('Awaiting Identification...');
            const name = await UIManager.getInstance().showNamePrompt();
            gameData.setPlayerName(name);
        }

        this.scene.start('MenuScene');
    }
}
