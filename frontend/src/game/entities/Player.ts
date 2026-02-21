import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Arc {
    private speed = 100;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 8, 0, 360, false, 0x00ffcc, 1);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setCircle(4); // smaller circular collision to be forgiving
        body.setOffset(4, 4); // center the smaller hitbox within the 16x16 visual arc
    }

    public move(vector: Phaser.Math.Vector2) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(vector.x * this.speed, vector.y * this.speed);
    }

    public die() {
        // Quick flash or shake effect happens in PlayingScene
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        this.setActive(false).setVisible(false);
    }
}
