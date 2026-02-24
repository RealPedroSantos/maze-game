import Phaser from 'phaser';
import { MazeGenerator, CellType } from '../../maze/MazeGenerator';
import { getDifficultyConfig } from '../../config/Difficulty';
import { GameData } from '../GameData';
import { Player } from '../entities/Player';
import { InputManager } from '../../input/InputManager';
import { UIManager } from '../../ui/UIManager';
import { SyncQueue } from '../../net/SyncQueue';
import { AudioManager } from '../../audio/AudioManager';

export default class PlayingScene extends Phaser.Scene {
    private player!: Player;
    private inputManager!: InputManager;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private coins!: Phaser.Physics.Arcade.StaticGroup;
    private traps!: Phaser.Physics.Arcade.StaticGroup;
    private exitRect!: Phaser.GameObjects.Rectangle;
    private cellSize = 32;

    constructor() {
        super('PlayingScene');
    }

    create() {
        AudioManager.getInstance().init();
        const gameData = GameData.getInstance();
        gameData.runStartTime = Date.now();
        gameData.resetLevelCoins();

        // Seed = hash(level) to ensure the maze is identical for everyone on the same level.
        const seed = `level-${gameData.currentLevel}`;

        const diff = getDifficultyConfig(gameData.currentLevel);
        const mazeGen = new MazeGenerator(diff.width, diff.height, seed);

        // Generate Maze Array
        mazeGen.generate();
        if (diff.dilationIterations > 0) {
            mazeGen.dilatePaths(diff.dilationIterations);
        }

        // Place coins and traps
        mazeGen.placeItems(diff.coinCount, diff.trapCount);

        this.drawMaze(mazeGen);

        // Create Player
        this.player = new Player(this, mazeGen.startPos.x * this.cellSize + this.cellSize / 2, mazeGen.startPos.y * this.cellSize + this.cellSize / 2);

        const mazePixelWidth = mazeGen.grid[0].length * this.cellSize;
        const mazePixelHeight = mazeGen.grid.length * this.cellSize;

        // Reserve top space for HUD and bottom space for Joystick
        const hudOffset = 110;
        const joystickOffset = 150;
        const availableHeight = this.scale.height - hudOffset - joystickOffset;

        // Calculate zoom to fit 90% of the available width/height
        const zoomX = (this.scale.width * 0.9) / mazePixelWidth;
        const zoomY = (availableHeight * 0.9) / mazePixelHeight;
        const fitZoom = Math.min(zoomX, zoomY);

        this.cameras.main.setZoom(fitZoom);
        this.cameras.main.removeBounds();

        // Center the camera vertically between the HUD and Joystick
        const safeCenterY = hudOffset + (availableHeight / 2);
        const screenMidY = this.scale.height / 2;
        const visualShift = screenMidY - safeCenterY;

        this.cameras.main.centerOn(mazePixelWidth / 2, (mazePixelHeight / 2) + (visualShift / fitZoom));

        // Sync physics world bounds to the actual maze dimensions
        this.physics.world.setBounds(0, 0, mazePixelWidth, mazePixelHeight);

        // Collisions
        this.physics.add.collider(this.player, this.walls, this.handleWallCollision, undefined, this);

        // Coin overlap
        this.physics.add.overlap(this.player, this.coins, this.handleCoinCollect, undefined, this);

        // Trap overlap
        this.physics.add.overlap(this.player, this.traps, this.handleTrapHit, undefined, this);

        // Exit overlap using Physics
        const exitZone = this.add.zone(mazeGen.exitPos.x * this.cellSize + this.cellSize / 2, mazeGen.exitPos.y * this.cellSize + this.cellSize / 2, this.cellSize, this.cellSize);
        this.physics.add.existing(exitZone, true);
        this.physics.add.overlap(this.player, exitZone, this.handleExitReached, undefined, this);

        // Setup Input
        this.inputManager = new InputManager(this);

        // Show HUD
        UIManager.getInstance().showHUD();
        UIManager.getInstance().updateHUD(gameData.currentLevel, gameData.bestLevel || '--');
        UIManager.getInstance().updateCoins(0);
        UIManager.getInstance().updateLives(gameData.lives);
    }

    private drawMaze(mazeGen: MazeGenerator) {
        this.walls = this.physics.add.staticGroup();
        this.coins = this.physics.add.staticGroup();
        this.traps = this.physics.add.staticGroup();
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a141e, 1); // path color
        graphics.fillRect(0, 0, mazeGen.grid[0].length * this.cellSize, mazeGen.grid.length * this.cellSize);

        for (let y = 0; y < mazeGen.grid.length; y++) {
            for (let x = 0; x < mazeGen.grid[y].length; x++) {
                const cellType = mazeGen.grid[y][x];
                const cx = x * this.cellSize + this.cellSize / 2;
                const cy = y * this.cellSize + this.cellSize / 2;

                if (cellType === CellType.WALL) {
                    const wall = this.add.rectangle(cx, cy, this.cellSize, this.cellSize, 0x223344);
                    this.walls.add(wall);
                } else if (cellType === CellType.EXIT) {
                    // Draw exit indicator
                    this.exitRect = this.add.rectangle(cx, cy, this.cellSize, this.cellSize, 0xffff00);
                    // Pulsing animation
                    this.tweens.add({
                        targets: this.exitRect,
                        alpha: 0.5,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });
                } else if (cellType === CellType.COIN) {
                    // Golden coin: small circle with pulsing glow
                    const coin = this.add.circle(cx, cy, 6, 0xffd700);
                    this.physics.add.existing(coin, true);
                    this.coins.add(coin);

                    // Pulsing glow animation
                    this.tweens.add({
                        targets: coin,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        alpha: 0.7,
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                } else if (cellType === CellType.TRAP) {
                    // Red trap: "X" shape with pulsing animation
                    const trapGfx = this.add.graphics();
                    trapGfx.lineStyle(2, 0xff2222, 0.9);
                    const half = this.cellSize * 0.3;
                    trapGfx.beginPath();
                    trapGfx.moveTo(cx - half, cy - half);
                    trapGfx.lineTo(cx + half, cy + half);
                    trapGfx.moveTo(cx + half, cy - half);
                    trapGfx.lineTo(cx - half, cy + half);
                    trapGfx.strokePath();

                    // Red danger zone beneath the X
                    const trapZone = this.add.circle(cx, cy, 8, 0xff2222, 0.15);
                    this.physics.add.existing(trapZone, true);
                    this.traps.add(trapZone);

                    // Pulsing animation on the danger zone
                    this.tweens.add({
                        targets: trapZone,
                        alpha: 0.4,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        }
    }

    update(_time: number, _delta: number) {
        if (this.inputManager) {
            this.inputManager.update();
        }

        if (!this.player.active) return;

        const vec = this.inputManager.getMovementVector();
        this.player.move(vec);
    }

    private handleWallCollision() {
        this.player.die();
        AudioManager.getInstance().playSound('hurt');

        this.cameras.main.shake(300, 0.02);
        this.cameras.main.flash(300, 255, 0, 0);

        const gameData = GameData.getInstance();
        const hasLivesLeft = gameData.loseLife();

        this.time.delayedCall(400, () => {
            if (hasLivesLeft) {
                // Still has lives: retry same level
                this.scene.restart();
            } else {
                // All 3 lives lost: reset to level 1
                gameData.resetRun();
                UIManager.getInstance().hideHUD();
                this.scene.start('GameOverScene');
            }
        });
    }

    private handleCoinCollect(_player: any, coin: any) {
        const coinObj = coin as Phaser.GameObjects.Arc;
        coinObj.destroy();

        AudioManager.getInstance().playSound('coin');

        const gameData = GameData.getInstance();
        gameData.addCoin();
        UIManager.getInstance().updateCoins(gameData.coins);

        // Golden flash effect on camera
        this.cameras.main.flash(150, 255, 215, 0);
    }

    private handleTrapHit(_player: any, trap: any) {
        const trapObj = trap as Phaser.GameObjects.Arc;
        trapObj.destroy();

        AudioManager.getInstance().playSound('trap');

        // Red flash
        this.cameras.main.flash(200, 255, 0, 0);

        // Apply slow
        this.player.applySlow(1500);
    }

    private handleExitReached() {
        this.player.die(); // Stop moving
        AudioManager.getInstance().playSound('victory');

        const gameData = GameData.getInstance();
        gameData.updateBestLevel(gameData.currentLevel);

        // Save to Sync Queue
        SyncQueue.getInstance().enqueueScore(gameData.playerName, gameData.currentLevel);

        this.time.delayedCall(1000, () => {
            if (gameData.currentLevel >= 50) {
                UIManager.getInstance().hideHUD();
                this.scene.start('RankingScene', { victory: true });
            } else {
                gameData.currentLevel++;
                gameData.resetLives(); // Fresh 3 lives for the next level
                this.scene.restart();
            }
        });
    }
}
