export class AudioManager {
    private static instance: AudioManager;
    private ctx: AudioContext | null = null;
    private isInitialized = false;

    private constructor() { }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public init() {
        if (this.isInitialized) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    // Pure mathematical beep synthesis using oscillator for that retro feel without loading .wav files
    public playSound(type: 'coin' | 'hurt' | 'victory') {
        if (!this.ctx) return;

        // Resume context if suspended (browser auto-play policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'coin': // High pitched short blip (like getting a point / eating a dot)
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'hurt': // Low pitched decreasing buzz (hitting a wall)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'victory': // Upward arpeggio (beating a level)
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
                osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
                osc.frequency.setValueAtTime(880, now + 0.3); // A5

                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.setValueAtTime(0.1, now + 0.3);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.6);

                osc.start(now);
                osc.stop(now + 0.6);
                break;
        }
    }
}
