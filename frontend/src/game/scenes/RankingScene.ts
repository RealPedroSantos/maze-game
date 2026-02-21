import Phaser from 'phaser';
import { ApiClient } from '../../net/ApiClient';

export default class RankingScene extends Phaser.Scene {
    constructor() {
        super('RankingScene');
    }

    async create(data: { victory?: boolean }) {
        const { width, height } = this.scale;

        this.add.text(width / 2, 50, data.victory ? 'YOU COMPLETED THE MAZE!' : 'GLOBAL RANKING', {
            fontSize: '32px', color: '#ffff00', fontFamily: 'Courier'
        }).setOrigin(0.5);

        this.add.text(width / 2, 80, 'Loading...', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5).setName('loading');

        const leaderboard = await ApiClient.fetchLeaderboard(10);

        const loadingText = this.children.getByName('loading') as Phaser.GameObjects.Text;
        if (loadingText) loadingText.destroy();

        let startY = 150;
        leaderboard.forEach((entry, index) => {
            const isCrowned = entry.crowned ? '👑' : '';
            const text = `${index + 1}. ${entry.name.substring(0, 10).padEnd(10, ' ')} - Lvl ${entry.best_level} ${isCrowned} `;
            this.add.text(width / 2, startY, text, {
                fontSize: '20px', color: '#ffffff', fontFamily: 'Courier'
            }).setOrigin(0.5);
            startY += 30;
        });

        if (leaderboard.length === 0) {
            this.add.text(width / 2, startY, 'No records found or Offline.', {
                fontSize: '20px', color: '#8892b0', fontFamily: 'Courier'
            }).setOrigin(0.5);
        }

        this.add.text(width / 2, height - 50, '[ BACK TO MENU ]', {
            fontSize: '24px', color: '#aaffaa', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
