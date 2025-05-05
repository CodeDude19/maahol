import { Sound } from "@/data/sounds";

/**
 * AudioTrack manages a single sound with crossfading capability
 */
export class AudioTrack {
  // Audio elements for crossfading
  private primaryAudio: HTMLAudioElement;
  private secondaryAudio: HTMLAudioElement;
  
  // Track state
  private sound: Sound;
  private _volume: number = 1;
  private _masterVolume: number = 1;
  private _isPlaying: boolean = false;
  private activeAudio: 'primary' | 'secondary' = 'primary';
  private crossfading: boolean = false;
  
  constructor(sound: Sound, initialVolume: number = 1) {
    this.sound = sound;
    this._volume = initialVolume;
    
    // Create audio elements
    this.primaryAudio = new Audio(sound.audioSrc);
    this.secondaryAudio = new Audio(sound.audioSrc);
    
    // Configure audio elements
    this.primaryAudio.loop = false;
    this.secondaryAudio.loop = false;
    
    // Set initial volumes
    this.updateVolumes();
    
    // Setup crossfading
    this.setupCrossfading();
  }
  
  /**
   * Set up event listeners for crossfading between audio elements
   */
  private setupCrossfading(): void {
    // Handle primary audio nearing end
    this.primaryAudio.addEventListener('timeupdate', () => {
      if (this.activeAudio !== 'primary' || this.crossfading || !this._isPlaying) return;
      
      const timeLeft = this.primaryAudio.duration - this.primaryAudio.currentTime;
      if (timeLeft > 0 && timeLeft <= 2) {
        this.startCrossfade();
      }
    });
    
    // Handle secondary audio nearing end
    this.secondaryAudio.addEventListener('timeupdate', () => {
      if (this.activeAudio !== 'secondary' || this.crossfading || !this._isPlaying) return;
      
      const timeLeft = this.secondaryAudio.duration - this.secondaryAudio.currentTime;
      if (timeLeft > 0 && timeLeft <= 2) {
        this.startCrossfade();
      }
    });
  }
  
  /**
   * Start crossfading between active and inactive audio elements
   */
  private startCrossfade(): void {
    if (this.crossfading || !this._isPlaying) return;
    
    this.crossfading = true;
    
    const currentAudio = this.activeAudio === 'primary' ? this.primaryAudio : this.secondaryAudio;
    const nextAudio = this.activeAudio === 'primary' ? this.secondaryAudio : this.primaryAudio;
    
    // Reset the next audio element
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;
    
    // Start playing the next audio
    nextAudio.play();
    
    // Perform crossfade
    const steps = 20;
    const interval = 100; // 100ms intervals
    let step = 0;
    
    const fade = setInterval(() => {
      step++;
      const ratio = step / steps;
      
      // If playback was stopped during crossfade
      if (!this._isPlaying) {
        clearInterval(fade);
        this.crossfading = false;
        return;
      }
      
      // Set volumes based on progress
      const effectiveVolume = this._volume * this._masterVolume;
      nextAudio.volume = effectiveVolume * ratio;
      currentAudio.volume = effectiveVolume * (1 - ratio);
      
      if (step >= steps) {
        clearInterval(fade);
        
        // Switch active audio
        this.activeAudio = this.activeAudio === 'primary' ? 'secondary' : 'primary';
        
        // Stop the previous audio
        currentAudio.pause();
        currentAudio.currentTime = 0;
        
        // Ensure next audio has correct volume
        nextAudio.volume = effectiveVolume;
        
        this.crossfading = false;
      }
    }, interval);
  }
  
  /**
   * Start playback of this track
   */
  public play(): void {
    if (this._isPlaying) return;
    
    this._isPlaying = true;
    
    const currentAudio = this.activeAudio === 'primary' ? this.primaryAudio : this.secondaryAudio;
    currentAudio.play();
  }
  
  /**
   * Pause playback of this track
   */
  public pause(): void {
    if (!this._isPlaying) return;
    
    this._isPlaying = false;
    
    this.primaryAudio.pause();
    this.secondaryAudio.pause();
    this.crossfading = false;
  }
  
  /**
   * Update volumes on both audio elements
   */
  private updateVolumes(): void {
    const effectiveVolume = this._volume * this._masterVolume;
    
    // Only set volume on the currently active audio
    if (this.activeAudio === 'primary') {
      this.primaryAudio.volume = effectiveVolume;
      // Secondary might be silent or crossfading
      if (!this.crossfading) {
        this.secondaryAudio.volume = 0;
      }
    } else {
      this.secondaryAudio.volume = effectiveVolume;
      // Primary might be silent or crossfading
      if (!this.crossfading) {
        this.primaryAudio.volume = 0;
      }
    }
  }
  
  /**
   * Set the volume for this track
   */
  public set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
  }
  
  /**
   * Get the current volume for this track
   */
  public get volume(): number {
    return this._volume;
  }
  
  /**
   * Set the master volume multiplier
   */
  public set masterVolume(value: number) {
    this._masterVolume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
  }
  
  /**
   * Get the sound object for this track
   */
  public get soundData(): Sound {
    return this.sound;
  }
  
  /**
   * Get the playing state of this track
   */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }
  
  /**
   * Release resources used by this track
   */
  public dispose(): void {
    // Stop playback
    this.pause();
    
    // Remove event listeners
    this.primaryAudio.removeEventListener('timeupdate', () => {});
    this.secondaryAudio.removeEventListener('timeupdate', () => {});
    
    // Release audio resources
    this.primaryAudio.src = '';
    this.secondaryAudio.src = '';
  }
}