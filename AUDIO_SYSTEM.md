# Maahol Audio System Documentation

## Overview

The Maahol Audio System is a clean, maintainable implementation for ambient sound playback with crossfading. This documentation outlines the architecture, components, and usage patterns.

## Architecture

The system follows a clean architecture with separation of concerns:

```
AudioEngine (core audio playback) ← AudioStateManager (state) ← AudioStateContext (React integration)
```

### Key Components

#### 1. AudioTrack

`AudioTrack` handles a single sound with seamless looping via crossfading.

**Key Features:**
- Uses two HTMLAudioElement instances for seamless loop transitions
- Implements clean crossfading without error recovery mechanisms
- Manages volume control and playback state

```typescript
const track = new AudioTrack(sound, initialVolume);
track.play();
track.pause();
track.volume = 0.5;
track.masterVolume = 0.8;
track.dispose();
```

#### 2. AudioEngine

`AudioEngine` manages multiple AudioTracks.

**Key Features:**
- Centralizes control of all audio playback
- Enforces the maximum concurrent sounds limit (3)
- Controls master volume
- Provides a simple API for adding/removing sounds

```typescript
audioEngine.addSound(sound, volume);
audioEngine.removeSound(soundId);
audioEngine.setVolume(soundId, volume);
audioEngine.masterVolume = 0.7;
audioEngine.play();
audioEngine.pause();
```

#### 3. AudioStateManager

`AudioStateManager` handles the application state using a reducer pattern.

**Key Features:**
- Uses reducer pattern for state management
- Persists state to localStorage
- Manages timer functionality
- Handles sound mix presets

```typescript
audioStateManager.toggleSound(sound);
audioStateManager.setVolumeForSound(soundId, volume);
audioStateManager.togglePlayPause();
audioStateManager.setTimer('30min');
audioStateManager.applyMix(mix);
```

#### 4. AudioStateContext

`AudioStateContext` is a React Context that provides components with access to audio state.

**Key Features:**
- Exposes audio state and methods to React components
- Handles UI notifications (toasts)
- Provides derived data (e.g., active sounds, mix status)

```typescript
const {
  isPlaying,
  soundStates,
  masterVolume,
  toggleSound,
  setVolumeForSound
} = useAudioState();
```

## State Management Flow

1. User interacts with a React component
2. Component calls a method from AudioStateContext
3. AudioStateContext calls a method on AudioStateManager
4. AudioStateManager dispatches an action to the reducer
5. Reducer updates the state and calls methods on AudioEngine
6. AudioEngine updates audio playback
7. State changes are propagated back to components

## Key Features

### 1. Seamless Crossfading

The system implements seamless crossfading between loops to prevent audio gaps:

```typescript
// When the current audio is close to ending
if (timeLeft <= 2) {
  // Start the next instance and crossfade
  nextAudio.play();
  // Gradually fade between the two instances
}
```

### 2. Timer Functionality

The system supports automatic shutdown with a configurable timer:

```typescript
// Set timer for 30 minutes
audioStateManager.setTimer('30min');

// Cancel timer
audioStateManager.cancelTimer();
```

### 3. Sound Mixes

The system supports predefined and custom sound mixes:

```typescript
// Apply a sound mix
audioStateManager.applyMix({
  name: "Rainy Night",
  description: "Perfect for sleeping",
  sounds: [
    { id: "rain", volume: 0.8 },
    { id: "thunder", volume: 0.4 }
  ]
});

// Save a custom mix
audioStateManager.saveCustomMix(customMix);
```

## Best Practices

1. **Resource Management**: Always dispose of audio resources when not needed
2. **State Updates**: Use the reducer pattern for predictable state changes
3. **Volume Control**: Apply volume changes through the API, not directly on audio elements
4. **Error Handling**: Let browsers handle playback failures natively

## Implementation Notes

- No preloading mechanism is used - audio is loaded when needed
- No error recovery mechanism is needed - browser handles failures gracefully
- Direct use of HTMLAudioElement instead of Web Audio API for simplicity
- Seamless crossfading implemented through time-based detection

## Browser Compatibility

The system uses standard web APIs and should work on all major browsers:
- Chrome 50+
- Firefox 55+
- Safari 11+
- Edge 79+