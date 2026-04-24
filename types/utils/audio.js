class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.enabled = true;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log('AudioManager initialized successfully');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.initialized = false;
        }
    }

    async ensureRunning() {
        if (!this.initialized) {
            await this.init();
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed');
            } catch (e) {
                console.warn('Failed to resume AudioContext:', e);
            }
        }
    }

    async playCorrectSound() {
        if (!this.enabled) return;
        
        await this.ensureRunning();
        if (!this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.type = 'sine';
            const now = this.audioContext.currentTime;
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.linearRampToValueAtTime(1320, now + 0.05);
            
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {
            console.warn('Failed to play correct sound:', e);
        }
    }

    async playErrorSound() {
        if (!this.enabled) return;
        
        await this.ensureRunning();
        if (!this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            osc.type = 'sawtooth';
            const now = this.audioContext.currentTime;
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.15);
            
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {
            console.warn('Failed to play error sound:', e);
        }
    }

    async playCompleteSound() {
        if (!this.enabled) return;
        
        await this.ensureRunning();
        if (!this.audioContext) return;

        try {
            const frequencies = [523.25, 659.25, 783.99, 1046.50];
            const now = this.audioContext.currentTime;
            
            frequencies.forEach((freq, index) => {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                osc.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const startTime = now + index * 0.12;
                gainNode.gain.setValueAtTime(0.25, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                
                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        } catch (e) {
            console.warn('Failed to play complete sound:', e);
        }
    }

    toggle(enabled) {
        this.enabled = enabled;
    }
}

const audioManager = new AudioManager();

document.addEventListener('click', async () => {
    if (!audioManager.initialized) {
        await audioManager.init();
    } else if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        await audioManager.audioContext.resume();
    }
}, { once: false });

document.addEventListener('keydown', async (e) => {
    if (!audioManager.initialized) {
        await audioManager.init();
    } else if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        await audioManager.audioContext.resume();
    }
}, { once: false });
