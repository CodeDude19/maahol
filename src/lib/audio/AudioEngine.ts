import { Sound } from "@/data/sounds";
import { AudioTrack } from "./AudioTrack";

/**
 * Maximum number of concurrent sounds allowed
 */
export const MAX_CONCURRENT_SOUNDS = 3;

/**
 * AudioEngine manages playback of multiple sounds
 */
export class AudioEngine {
  private tracks: Map<string, AudioTrack> = new Map();
  private _masterVolume: number = 0.7;
  private _isPlaying: boolean = false;
  
  /**
   * Add a sound to the engine
   * @returns true if sound was added, false if at maximum sounds
   */
  public addSound(sound: Sound, initialVolume: number = 1): boolean {
    // Check if already added
    if (this.tracks.has(sound.id)) {
      return true;
    }
    
    // Check if at max capacity
    if (this.tracks.size >= MAX_CONCURRENT_SOUNDS) {
      return false;
    }
    
    // Create and configure new track
    const track = new AudioTrack(sound, initialVolume);
    track.masterVolume = this._masterVolume;
    
    // Add to tracks
    this.tracks.set(sound.id, track);
    
    // Start playing if engine is active
    if (this._isPlaying) {
      track.play();
    }
    
    return true;
  }
  
  /**
   * Remove a sound from the engine
   */
  public removeSound(soundId: string): void {
    const track = this.tracks.get(soundId);
    if (!track) return;
    
    // Dispose and remove track
    track.dispose();
    this.tracks.delete(soundId);
  }
  
  /**
   * Check if a sound is currently loaded
   */
  public hasSound(soundId: string): boolean {
    return this.tracks.has(soundId);
  }
  
  /**
   * Set volume for a specific sound
   */
  public setVolume(soundId: string, volume: number): void {
    const track = this.tracks.get(soundId);
    if (track) {
      track.volume = volume;
    }
  }
  
  /**
   * Get volume for a specific sound
   */
  public getVolume(soundId: string): number {
    const track = this.tracks.get(soundId);
    return track ? track.volume : 0;
  }
  
  /**
   * Set master volume for all sounds
   */
  public set masterVolume(value: number) {
    this._masterVolume = Math.max(0, Math.min(1, value));
    
    // Update all tracks
    this.tracks.forEach(track => {
      track.masterVolume = this._masterVolume;
    });
  }
  
  /**
   * Get master volume
   */
  public get masterVolume(): number {
    return this._masterVolume;
  }
  
  /**
   * Start playback for all tracks
   */
  public play(): void {
    if (this._isPlaying) return;
    
    this._isPlaying = true;
    this.tracks.forEach(track => {
      track.play();
    });
  }
  
  /**
   * Pause all tracks
   */
  public pause(): void {
    if (!this._isPlaying) return;
    
    this._isPlaying = false;
    this.tracks.forEach(track => {
      track.pause();
    });
  }
  
  /**
   * Toggle between play and pause
   */
  public togglePlayPause(): void {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * Get all active sounds with their volumes
   */
  public getActiveSounds(): Array<{ sound: Sound, volume: number }> {
    const activeSounds: Array<{ sound: Sound, volume: number }> = [];
    
    this.tracks.forEach(track => {
      activeSounds.push({
        sound: track.soundData,
        volume: track.volume
      });
    });
    
    return activeSounds;
  }
  
  /**
   * Get the current playing state
   */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }
  
  /**
   * Release all resources
   */
  public dispose(): void {
    this.tracks.forEach(track => {
      track.dispose();
    });
    
    this.tracks.clear();
    this._isPlaying = false;
  }
}

// Create and export a singleton instance
export const audioEngine = new AudioEngine();