import Phaser from 'phaser';
import { ApiClient } from '../../net/ApiClient';

export default class RankingScene extends Phaser.Scene {
    private isActive = false;

    constructor() {
        super('RankingScene');
    }

    create(data: { victory?: boolean }) {
        this.isActive = true;
        const { width, height } = this.scale;

        this.add.text(width / 2, 50, data.victory ? 'VOCÊ COMPLETOU O LABIRINTO!' : 'RANKING GLOBAL', {
            fontSize: '32px', color: '#ffff00', fontFamily: 'Courier'
        }).setOrigin(0.5);

        const loadingText = this.add.text(width / 2, 80, 'Carregando...', {
            fontSize: '18px', color: '#aaaaaa'
        }).setOrigin(0.5);

        // Back button (always visible)
        this.add.text(width / 2, height - 50, '[ VOLTAR AO MENU ]', {
            fontSize: '24px', color: '#aaffaa', fontFamily: 'Courier'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.isActive = false;
                this.scene.start('MenuScene');
            });

        // Load leaderboard asynchronously with safety check
        this.loadLeaderboard(loadingText, width);
    }

    private async loadLeaderboard(loadingText: Phaser.GameObjects.Text, width: number) {
        try {
            const leaderboard = await ApiClient.fetchLeaderboard(10);

            // Guard: scene may have been left while fetching
            if (!this.isActive || !this.scene.isActive('RankingScene')) return;

            if (loadingText && loadingText.active) {
                loadingText.destroy();
            }

            let startY = 130;

            if (leaderboard.length === 0) {
                this.add.text(width / 2, startY, 'Nenhum recorde encontrado.', {
                    fontSize: '20px', color: '#8892b0', fontFamily: 'Courier'
                }).setOrigin(0.5);
                return;
            }

            // Header row
            this.add.text(width / 2, startY - 30, '#   NOME          NÍVEL', {
                fontSize: '16px', color: '#8892b0', fontFamily: 'Courier'
            }).setOrigin(0.5);

            leaderboard.forEach((entry, index) => {
                if (!this.isActive) return;

                const rank = `${index + 1}.`.padEnd(4, ' ');
                const name = entry.name.substring(0, 12).padEnd(12, ' ');
                const crown = entry.crowned ? ' 👑' : '';
                const text = `${rank}${name} Lvl ${entry.best_level}${crown}`;

                const color = index === 0 ? '#ffd700' : index <= 2 ? '#00ffcc' : '#ffffff';

                this.add.text(width / 2, startY, text, {
                    fontSize: '20px', color, fontFamily: 'Courier'
                }).setOrigin(0.5);

                startY += 32;
            });
        } catch (error) {
            console.error('Failed to load leaderboard:', error);

            if (!this.isActive || !this.scene.isActive('RankingScene')) return;

            if (loadingText && loadingText.active) {
                loadingText.setText('Erro ao carregar ranking.');
                loadingText.setColor('#ff4444');
            }
        }
    }

    shutdown() {
        this.isActive = false;
    }
}
