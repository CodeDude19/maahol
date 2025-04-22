// AudioManager.ts
// This module provides a robust audio management system with seamless looping and crossfading.

export class ChannelPlayer {
  private audioContext: AudioContext;
  private crossfadeDuration: number;
  private buffer: AudioBuffer | null;
  private channelGain: GainNode;
  private volume: number;
  private isPlaying: boolean;
  private currentSource: AudioBufferSourceNode | null;
  private nextSource: AudioBufferSourceNode | null;
  private nextStartTime: number;
  private scheduleTimeout: NodeJS.Timeout | null;
  private static bufferCache: Map<string, AudioBuffer> = new Map();
  private currentUrl: string | null = null;

  constructor(audioContext: AudioContext, crossfadeDuration: number = 0.1) {
    this.audioContext = audioContext;
    this.crossfadeDuration = crossfadeDuration;
    this.buffer = null;
    this.channelGain = this.audioContext.createGain();
    this.channelGain.connect(this.audioContext.destination);
    this.volume = 1;
    this.isPlaying = false;
    this.currentSource = null;
    this.nextSource = null;
    this.nextStartTime = 0;
    this.scheduleTimeout = null;
  }

  setVolume(volume: number) {
    this.volume = volume;
    // Update the overall gain immediately.
    this.channelGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  async loadBuffer(url: string) {
    this.currentUrl = url;
    // Check if buffer is already in cache
    const cachedBuffer = ChannelPlayer.bufferCache.get(url);
    if (cachedBuffer) {
      this.buffer = cachedBuffer;
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      // Store in cache
      ChannelPlayer.bufferCache.set(url, decodedBuffer);
      // Only set the buffer if the URL hasn't changed during loading
      if (this.currentUrl === url) {
        this.buffer = decodedBuffer;
      }
    } catch (error) {
      console.error(`Failed to load audio buffer for ${url}:`, error);
      throw error;
    }
  }

  start() {
    if (!this.buffer) {
      console.warn("Buffer not loaded for this channel. Attempting to load...");
      if (this.currentUrl) {
        this.loadBuffer(this.currentUrl).then(() => {
          if (this.buffer) this.start();
        }).catch(error => {
          console.error("Failed to load buffer on start:", error);
        });
      }
      return;
    }
    this.isPlaying = true;
    this.scheduleNext();
  }

  stop() {
    this.isPlaying = false;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // ignore if already stopped
      }
      this.currentSource = null;
    }
    if (this.nextSource) {
      try {
        this.nextSource.stop();
      } catch (e) {}
      this.nextSource = null;
    }
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
  }

  // This function schedules playback with crossfade.
  private scheduleNext() {
    if (!this.isPlaying || !this.buffer) return;
    const currentTime = this.audioContext.currentTime;

    try {
      // If no current source exists, start one immediately
      if (!this.currentSource) {
        this.currentSource = this.createSource(currentTime);
        this.currentSource.start(currentTime);
        // Calculate when to start the next source (buffer duration minus crossfade)
        this.nextStartTime = currentTime + this.buffer.duration - this.crossfadeDuration;
      }

      // Schedule the next source slightly earlier to ensure no gaps
      if (!this.nextSource) {
        // Add a small buffer to prevent timing issues
        const scheduleAheadTime = 0.1;
        this.nextSource = this.createSource(this.nextStartTime - scheduleAheadTime);
        this.nextSource.start(this.nextStartTime);

        // Set up crossfade automation
        const currentGainNode = (this.currentSource as any).gainNode;
        const nextGainNode = (this.nextSource as any).gainNode;

        // Ensure initial volumes are correct
        currentGainNode.gain.setValueAtTime(this.volume, currentTime);
        nextGainNode.gain.setValueAtTime(0, currentTime);

        // Crossfade setup
        currentGainNode.gain.setValueAtTime(this.volume, this.nextStartTime);
        currentGainNode.gain.linearRampToValueAtTime(0, this.nextStartTime + this.crossfadeDuration);
        nextGainNode.gain.setValueAtTime(0, this.nextStartTime);
        nextGainNode.gain.linearRampToValueAtTime(this.volume, this.nextStartTime + this.crossfadeDuration);
      }

      // Schedule the swap slightly before the crossfade completes
      const timeUntilSwap = (this.nextStartTime + this.crossfadeDuration) - currentTime;
      this.scheduleTimeout = setTimeout(() => {
        try {
          if (this.currentSource) {
            this.currentSource.stop();
          }
          this.currentSource = this.nextSource;
          this.nextSource = null;
          // Update nextStartTime for the new cycle
          this.nextStartTime += this.buffer.duration - this.crossfadeDuration;
          // Immediately schedule the next iteration
          this.scheduleNext();
        } catch (error) {
          console.error('Error during source swap:', error);
          // Attempt recovery by restarting playback
          this.stop();
          this.start();
        }
      }, Math.max(0, timeUntilSwap * 1000)); // Ensure timeout is never negative
    } catch (error) {
      console.error('Error in scheduleNext:', error);
      // Attempt recovery
      this.stop();
      this.start();
    }
  }

  // Creates a new buffer source with its own gain node for crossfade control.
  private createSource(startTime: number): AudioBufferSourceNode {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.loop = false; // manual looping with crossfade
    // Create a sub-gain node to handle crossfade automation.
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.volume, startTime);
    source.connect(gainNode);
    gainNode.connect(this.channelGain);
    // Attach the gain node to the source for later automation.
    (source as any).gainNode = gainNode;
    return source;
  }

  // Replaces the current sound buffer with a new one.
  // If the channel is playing, it stops and restarts the scheduling.
  async replaceBuffer(url: string) {
    const wasPlaying = this.isPlaying;
    this.stop();
    await this.loadBuffer(url);
    if (wasPlaying) {
      this.start();
    }
  }
}

export class AudioManager {
  private audioContext: AudioContext;
  private channels: ChannelPlayer[];

  constructor(numChannels: number = 3, crossfadeDuration: number = 0.1) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.channels = Array(numChannels).fill(null).map(() => new ChannelPlayer(this.audioContext, crossfadeDuration));
  }

  async loadSound(channelIndex: number, url: string) {
    if (channelIndex >= 0 && channelIndex < this.channels.length) {
      await this.channels[channelIndex].loadBuffer(url);
    }
  }

  play(channelIndex: number | null = null) {
    if (channelIndex === null) {
      this.channels.forEach(channel => channel.start());
    } else if (channelIndex >= 0 && channelIndex < this.channels.length) {
      this.channels[channelIndex].start();
    }
  }

  pause(channelIndex: number | null = null) {
    if (channelIndex === null) {
      this.channels.forEach(channel => channel.stop());
    } else if (channelIndex >= 0 && channelIndex < this.channels.length) {
      this.channels[channelIndex].stop();
    }
  }

  setVolume(channelIndex: number, volume: number) {
    if (channelIndex >= 0 && channelIndex < this.channels.length) {
      this.channels[channelIndex].setVolume(volume);
    }
  }

  async replaceSound(channelIndex: number, url: string) {
    if (channelIndex >= 0 && channelIndex < this.channels.length) {
      await this.channels[channelIndex].replaceBuffer(url);
    }
  }
}