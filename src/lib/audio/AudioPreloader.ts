import { Sound } from "@/data/sounds";

// Interface for audio cache entry
interface CacheEntry {
  primary: HTMLAudioElement;
  secondary: HTMLAudioElement;
  isLoading: boolean;
  loadPromise: Promise<void> | null;
  lastAccessed: number; // Timestamp of last access
}

/**
 * AudioPreloader handles preloading and caching of audio files
 */
export class AudioPreloader {
  private static instance: AudioPreloader;
  private audioCache: Map<string, CacheEntry> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;
  private maxConcurrentLoads: number = 2; // Adjust based on performance testing
  private maxCacheSize: number = 10; // Maximum number of audio files to keep in cache
  private cachePruneInterval: number | null = null;
  private cacheTTL: number = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Private constructor for singleton
  private constructor() {
    // Set up periodic cache pruning
    this.startCachePruning();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioPreloader {
    if (!AudioPreloader.instance) {
      AudioPreloader.instance = new AudioPreloader();
    }
    return AudioPreloader.instance;
  }

  /**
   * Check if an audio is cached
   */
  public isCached(soundId: string): boolean {
    const entry = this.audioCache.get(soundId);
    return !!entry && !entry.isLoading;
  }

  /**
   * Preload a list of sounds
   * @returns Promise that resolves when all sounds are loaded
   */
  public preloadSounds(sounds: Sound[]): Promise<void> {
    // Add sounds to preload queue if not already cached
    sounds.forEach(sound => {
      if (!this.audioCache.has(sound.id)) {
        this.preloadQueue.push(sound.id);
        
        // Initialize cache entry
        this.audioCache.set(sound.id, {
          primary: new Audio(),
          secondary: new Audio(),
          isLoading: true,
          loadPromise: null,
          lastAccessed: Date.now()
        });
      }
    });

    // Start preloading process
    this.processPreloadQueue();

    // Return promise that resolves when all sounds are loaded
    return Promise.all(
      sounds.map(sound => this.getLoadPromise(sound.id))
    ).then(() => {});
  }

  /**
   * Process the preload queue
   */
  private processPreloadQueue(): void {
    if (this.isPreloading) return;
    this.isPreloading = true;

    const processNext = () => {
      // If queue is empty, we're done
      if (this.preloadQueue.length === 0) {
        this.isPreloading = false;
        return;
      }

      // Get the next batch to process
      const batch = this.preloadQueue.splice(0, this.maxConcurrentLoads);
      const batchPromises: Promise<void>[] = [];

      // Load each sound in the batch
      batch.forEach(soundId => {
        const sound = sounds.find(s => s.id === soundId);
        if (sound) {
          const loadPromise = this.loadSound(sound);
          batchPromises.push(loadPromise);
        }
      });

      // When batch is done, process next batch
      Promise.all(batchPromises)
        .then(() => processNext())
        .catch(() => processNext()); // Continue even if some fail
    };

    processNext();
  }

  /**
   * Load a specific sound
   */
  private loadSound(sound: Sound): Promise<void> {
    const entry = this.audioCache.get(sound.id);
    if (!entry) return Promise.reject("Cache entry not initialized");

    // Create the load promise if it doesn't exist
    if (!entry.loadPromise) {
      entry.loadPromise = new Promise<void>((resolve, reject) => {
        let loadedCount = 0;
        const onLoaded = () => {
          loadedCount++;
          if (loadedCount === 2) {
            entry.isLoading = false;
            resolve();
          }
        };

        const onError = (e: ErrorEvent) => {
          console.error(`Error loading audio for ${sound.id}:`, e);
          reject(e);
        };

        // Configure primary audio
        entry.primary.src = sound.audioSrc;
        entry.primary.preload = "auto";
        entry.primary.addEventListener("canplaythrough", onLoaded, { once: true });
        entry.primary.addEventListener("error", onError);
        
        // Configure secondary audio
        entry.secondary.src = sound.audioSrc;
        entry.secondary.preload = "auto";
        entry.secondary.addEventListener("canplaythrough", onLoaded, { once: true });
        entry.secondary.addEventListener("error", onError);

        // Start loading
        void entry.primary.load();
        void entry.secondary.load();
      });
    }

    return entry.loadPromise;
  }

  /**
   * Get audio elements for a sound
   * If not cached, it will return new audio elements and start loading in background
   */
  public getAudioElements(sound: Sound): { primary: HTMLAudioElement, secondary: HTMLAudioElement } {
    let entry = this.audioCache.get(sound.id);

    // If not in cache, create new entry and start loading
    if (!entry) {
      entry = {
        primary: new Audio(sound.audioSrc),
        secondary: new Audio(sound.audioSrc),
        isLoading: true,
        loadPromise: null,
        lastAccessed: Date.now()
      };
      this.audioCache.set(sound.id, entry);
      this.loadSound(sound); // Start loading in background
      
      // Check if we need to prune the cache
      this.checkCacheSize();
    } else {
      // Update last accessed time
      entry.lastAccessed = Date.now();
    }

    return {
      primary: entry.primary,
      secondary: entry.secondary
    };
  }

  /**
   * Get the load promise for a sound
   */
  public getLoadPromise(soundId: string): Promise<void> {
    const entry = this.audioCache.get(soundId);
    if (!entry) {
      return Promise.reject(`Sound ${soundId} not found in cache`);
    }
    
    if (!entry.loadPromise) {
      const sound = sounds.find(s => s.id === soundId);
      if (!sound) {
        return Promise.reject(`Sound ${soundId} definition not found`);
      }
      return this.loadSound(sound);
    }
    
    return entry.loadPromise;
  }

  /**
   * Preload most commonly used sounds
   */
  public preloadCommonSounds(): Promise<void> {
    // Choose a subset of common sounds to preload on startup
    const commonSoundIds = ['rain', 'thunder', 'wind', 'cafe', 'birds'];
    const commonSounds = sounds.filter(sound => commonSoundIds.includes(sound.id));
    
    return this.preloadSounds(commonSounds);
  }

  /**
   * Remove a sound from cache
   */
  public removeFromCache(soundId: string): void {
    const entry = this.audioCache.get(soundId);
    if (entry) {
      // Clean up resources
      entry.primary.src = '';
      entry.secondary.src = '';
      this.audioCache.delete(soundId);
    }
  }

  /**
   * Clear the entire cache
   */
  public clearCache(): void {
    this.audioCache.forEach((entry, soundId) => {
      this.removeFromCache(soundId);
    });
    this.audioCache.clear();
  }

  /**
   * Check if a sound is currently loading
   */
  public isLoading(soundId: string): boolean {
    const entry = this.audioCache.get(soundId);
    return !!entry && entry.isLoading;
  }
  
  /**
   * Start periodic cache pruning
   */
  private startCachePruning(): void {
    // Clear any existing interval
    if (this.cachePruneInterval !== null) {
      window.clearInterval(this.cachePruneInterval);
    }
    
    // Set up new interval (every 2 minutes)
    this.cachePruneInterval = window.setInterval(() => {
      this.pruneCache();
    }, 2 * 60 * 1000);
  }
  
  /**
   * Stop periodic cache pruning
   */
  private stopCachePruning(): void {
    if (this.cachePruneInterval !== null) {
      window.clearInterval(this.cachePruneInterval);
      this.cachePruneInterval = null;
    }
  }
  
  /**
   * Prune old items from the cache
   */
  private pruneCache(): void {
    const now = Date.now();
    
    // First, remove any items that haven't been accessed in the TTL period
    this.audioCache.forEach((entry, soundId) => {
      if (now - entry.lastAccessed > this.cacheTTL) {
        this.removeFromCache(soundId);
      }
    });
    
    // If still over max size, remove oldest accessed items
    this.checkCacheSize();
  }
  
  /**
   * Check if cache size exceeds max and prune if needed
   */
  private checkCacheSize(): void {
    if (this.audioCache.size <= this.maxCacheSize) {
      return;
    }
    
    // Get all entries sorted by last accessed time (oldest first)
    const entries = Array.from(this.audioCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries until we're under the limit
    while (entries.length > this.maxCacheSize) {
      const [soundId] = entries.shift()!;
      this.removeFromCache(soundId);
    }
  }
}

// Import sounds at the end to avoid circular dependencies
import { sounds } from "@/data/sounds";

// Export singleton instance
export const audioPreloader = AudioPreloader.getInstance();