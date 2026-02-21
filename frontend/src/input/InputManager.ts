import Phaser from 'phaser';

export class InputManager {
    private scene: Phaser.Scene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: any;

    // Virtual Joystick properties
    private _joystickBase!: Phaser.GameObjects.Arc;
    private joystickThumb!: Phaser.GameObjects.Arc;
    private joystickActive: boolean = false;
    private joystickCenter = { x: 0, y: 0 };
    private joystickVector = new Phaser.Math.Vector2(0, 0);

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Keyboard
        if (this.scene.input.keyboard) {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
        } else {
            // Fallback if keyboard somewhat unavailable
            this.cursors = {} as any;
            this.wasd = {};
        }

        // Virtual Joystick Setup
        this.setupVirtualJoystick();
    }

    private setupVirtualJoystick() {
        this.joystickCenter = { x: 0, y: 0 }; // Updated dynamically in update()

        this._joystickBase = this.scene.add.arc(0, 0, 60, 0, 360, false, 0x8892b0, 0.3)
            .setDepth(100);

        this.joystickThumb = this.scene.add.arc(0, 0, 30, 0, 360, false, 0x00ffcc, 0.6)
            .setDepth(101)
            .setInteractive();

        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointermove', this.handlePointerMove, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);
        this.scene.input.on('pointerupoutside', this.handlePointerUp, this);
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        const cam = this.scene.cameras.main;
        const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.joystickCenter.x, this.joystickCenter.y);
        const touchRadius = 100 / cam.zoom;
        if (dist < touchRadius) {
            this.joystickActive = true;
            this.updateJoystickVector(pointer);
        }
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (this.joystickActive) {
            this.updateJoystickVector(pointer);
        }
    }

    private handlePointerUp() {
        this.joystickActive = false;
        this.joystickThumb.setPosition(this.joystickCenter.x, this.joystickCenter.y);
        this.joystickVector.reset();
    }

    private updateJoystickVector(pointer: Phaser.Input.Pointer) {
        const cam = this.scene.cameras.main;
        const maxRadius = 60 / cam.zoom;
        const angle = Phaser.Math.Angle.Between(this.joystickCenter.x, this.joystickCenter.y, pointer.worldX, pointer.worldY);
        const dist = Phaser.Math.Distance.Between(this.joystickCenter.x, this.joystickCenter.y, pointer.worldX, pointer.worldY);

        const r = Math.min(dist, maxRadius);
        this.joystickThumb.x = this.joystickCenter.x + Math.cos(angle) * r;
        this.joystickThumb.y = this.joystickCenter.y + Math.sin(angle) * r;

        // Normalize -1 to 1 based on unscaled maxRadius
        this.joystickVector.set(Math.cos(angle) * (r / maxRadius), Math.sin(angle) * (r / maxRadius));
    }

    public update() {
        const cam = this.scene.cameras.main;
        if (!cam) return;

        const padding = 100 / cam.zoom;
        const targetX = cam.midPoint.x;
        const targetY = cam.midPoint.y + (cam.height / 2 / cam.zoom) - padding;

        this.joystickCenter = { x: targetX, y: targetY };
        this._joystickBase.setPosition(targetX, targetY);
        this._joystickBase.setScale(1 / cam.zoom);

        if (!this.joystickActive) {
            this.joystickThumb.setPosition(targetX, targetY);
        }
        this.joystickThumb.setScale(1 / cam.zoom);
    }

    public getJoystickBase(): Phaser.GameObjects.Arc {
        return this._joystickBase;
    }

    public getMovementVector(): Phaser.Math.Vector2 {
        const vec = new Phaser.Math.Vector2(0, 0);

        // Keyboard precedence
        if (this.cursors.left?.isDown || this.wasd.A?.isDown) vec.x = -1;
        else if (this.cursors.right?.isDown || this.wasd.D?.isDown) vec.x = 1;

        if (this.cursors.up?.isDown || this.wasd.W?.isDown) vec.y = -1;
        else if (this.cursors.down?.isDown || this.wasd.S?.isDown) vec.y = 1;

        if (vec.lengthSq() > 0) {
            return vec.normalize();
        }

        // Gamepad
        if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
            const pad = this.scene.input.gamepad.pad1;
            if (pad.axes.length) {
                const xAxis = pad.axes[0].getValue();
                const yAxis = pad.axes[1].getValue();
                // Deadzone check
                if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
                    vec.set(xAxis, yAxis);
                    // clamp max magnitude
                    if (vec.lengthSq() > 1) vec.normalize();
                    return vec;
                }
            }
        }

        // Joystick fallback
        if (this.joystickActive) {
            return this.joystickVector.clone();
        }

        return vec;
    }
}
