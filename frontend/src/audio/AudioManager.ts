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

            case 'victory': // SF2 Style Jingle "TARÃRÃRÃ... tarã"
                osc.type = 'square';

                // Triumphant C Major Arpeggio: G4, C5, E5, G5 ... E5, G5
                const notes = [
                    { f: 392.00, t: 0.00, dur: 0.10 }, // G4
                    { f: 523.25, t: 0.10, dur: 0.10 }, // C5
                    { f: 659.25, t: 0.20, dur: 0.10 }, // E5
                    { f: 783.99, t: 0.30, dur: 0.40 }, // G5 (Hold)

                    { f: 659.25, t: 0.85, dur: 0.15 }, // E5 (ta)
                    { f: 783.99, t: 1.00, dur: 0.40 }  // G5 (rã)
                ];

                gainNode.gain.setValueAtTime(0, now);

                notes.forEach(note => {
                    osc.frequency.setValueAtTime(note.f, now + note.t);
                    gainNode.gain.setValueAtTime(0.15, now + note.t);
                    gainNode.gain.setValueAtTime(0.15, now + note.t + note.dur - 0.02);
                    gainNode.gain.linearRampToValueAtTime(0, now + note.t + note.dur);
                });

                // Add a second detuned sawtooth oscillator for that thick CPS-1 Arcade sound
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sawtooth';
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                gain2.gain.setValueAtTime(0, now);

                notes.forEach(note => {
                    osc2.frequency.setValueAtTime(note.f * 1.01, now + note.t); // slightly detuned 
                    gain2.gain.setValueAtTime(0.1, now + note.t);
                    gain2.gain.setValueAtTime(0.1, now + note.t + note.dur - 0.02);
                    gain2.gain.linearRampToValueAtTime(0, now + note.t + note.dur);
                });

                osc.start(now);
                osc.stop(now + 1.5);
                osc2.start(now);
                osc2.stop(now + 1.5);
                break;
        }
    }
}
