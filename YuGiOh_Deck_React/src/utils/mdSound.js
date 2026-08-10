// Master Duel Synthetic Web-Audio Engine
class SoundEngine {
    constructor() {
        // ⚡ Server-Safe Check: Only access localStorage when running in the browser
        this.enabled = typeof window !== 'undefined' 
            ? localStorage.getItem('md_sfx_enabled') === 'true' 
            : false;
        this.ctx = null;
    }

    initContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    toggleSound() {
        if (typeof window === 'undefined') return false;
        
        this.enabled = !this.enabled;
        localStorage.setItem('md_sfx_enabled', this.enabled ? 'true' : 'false');
        if (this.enabled) this.playClick();
        return this.enabled;
    }

    // High-tech Master Duel Button Click Chime
    playClick() {
        if (!this.enabled || typeof window === 'undefined') return;
        this.initContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
            osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.08); // Sweep up

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            console.warn("Audio Context blocked or failed:", e);
        }
    }

    // Subtle Hover Tick
    playHover() {
        if (!this.enabled || typeof window === 'undefined') return;
        this.initContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch (e) {
            // Suppress audio warnings on fast hovers
        }
    }
}

export const mdSound = new SoundEngine();