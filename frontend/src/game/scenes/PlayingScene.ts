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
    private exitRect!: Phaser.GameObjects.Rectangle;
    private cellSize = 32;

    constructor() {
        super('PlayingScene');
    }

    create() {
        AudioManager.getInstance().init();
        const gameData = GameData.getInstance();
        gameData.runStartTime = Date.now();

        // Seed = hash(level) to ensure the maze is identical for everyone on the same level.
        const seed = `level-${gameData.currentLevel}`;

        const diff = getDifficultyConfig(gameData.currentLevel);
        const mazeGen = new MazeGenerator(diff.width, diff.height, seed);

        // Generate Maze Array
        mazeGen.generate();
        if (diff.dilationIterations > 0) {
            mazeGen.dilatePaths(diff.dilationIterations);
        }

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
        // The midpoint of the safe area is: hudOffset + (availableHeight / 2)
        // We shift the camera center to align the maze center with this visual midpoint
        const safeCenterY = hudOffset + (availableHeight / 2);
        const screenMidY = this.scale.height / 2;
        const visualShift = screenMidY - safeCenterY;

        this.cameras.main.centerOn(mazePixelWidth / 2, (mazePixelHeight / 2) + (visualShift / fitZoom));

        // Sync physics world bounds to the actual maze dimensions to prevent the player from getting stuck on mobile's smaller default screen size bounds
        this.physics.world.setBounds(0, 0, mazePixelWidth, mazePixelHeight);

        // Collisions
        this.physics.add.collider(this.player, this.walls, this.handleWallCollision, undefined, this);

        // Exit overlap using Physics
        const exitZone = this.add.zone(mazeGen.exitPos.x * this.cellSize + this.cellSize / 2, mazeGen.exitPos.y * this.cellSize + this.cellSize / 2, this.cellSize, this.cellSize);
        this.physics.add.existing(exitZone, true);
        this.physics.add.overlap(this.player, exitZone, this.handleExitReached, undefined, this);

        // Setup Input
        this.inputManager = new InputManager(this);

        // Show HUD
        UIManager.getInstance().showHUD();
        UIManager.getInstance().updateHUD(gameData.currentLevel, gameData.bestLevel || '--');
    }

    private drawMaze(mazeGen: MazeGenerator) {
        this.walls = this.physics.add.staticGroup();
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a141e, 1); // path color
        graphics.fillRect(0, 0, mazeGen.grid[0].length * this.cellSize, mazeGen.grid.length * this.cellSize);

        for (let y = 0; y < mazeGen.grid.length; y++) {
            for (let x = 0; x < mazeGen.grid[y].length; x++) {
                if (mazeGen.grid[y][x] === CellType.WALL) {
                    const wall = this.add.rectangle(
                        x * this.cellSize + this.cellSize / 2,
                        y * this.cellSize + this.cellSize / 2,
                        this.cellSize,
                        this.cellSize,
                        0x223344 // wall color
                    );
                    this.walls.add(wall);
                } else if (mazeGen.grid[y][x] === CellType.EXIT) {
                    // Draw exit indicator
                    this.exitRect = this.add.rectangle(
                        x * this.cellSize + this.cellSize / 2,
                        y * this.cellSize + this.cellSize / 2,
                        this.cellSize,
                        this.cellSize,
                        0xffff00
                    );
                    // Pulsing animation
                    this.tweens.add({
                        targets: this.exitRect,
                        alpha: 0.5,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
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

        // After shake, game over
        this.time.delayedCall(400, () => {
            UIManager.getInstance().hideHUD();
            this.scene.start('GameOverScene');
        });
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
                this.scene.start('RankingScene', { victory: true }); // Zered the game
            } else {
                gameData.currentLevel++;
                this.scene.restart();
            }
        });
    }
}
