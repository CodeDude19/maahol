# Maahol Sound App: New Audio Architecture

## Components

### 1. AudioTrack Class
- Represents a single sound track
- Uses two HTMLAudioElement instances for crossfading
- Handles volume control and playback state for a single sound
- Simple crossfading with no error recovery

### 2. AudioEngine Class
- Manages multiple AudioTracks
- Controls global playback state and master volume
- Provides API for adding/removing sounds, changing volume
- Manages track limit (max 3 concurrent sounds)

### 3. AudioStateManager Class
- Manages application state related to audio
- Uses reducer pattern for state updates
- Persists state to localStorage
- Handles timer functionality

### 4. AudioStateContext (React Context)
- Provides React components with access to audio state
- Exposes methods for controlling audio
- Handles UI notifications (toasts)

## State Management Flow

```
User Action → React Component → AudioStateContext → AudioStateManager → AudioEngine → AudioTrack
```

## Key Improvements

1. **Simpler Audio Management**:
   - Direct use of HTMLAudioElement without preloading complexity
   - No error recovery mechanism - browser handles failures gracefully
   - Cleaner crossfading implementation

2. **Better State Management**:
   - Clear separation between audio playback and state management
   - Immutable state updates via reducer
   - Predictable state flow

3. **Improved Performance**:
   - No unnecessary error handling or logging
   - Efficient resource management
   - Smoother crossfading

4. **Enhanced Reliability**:
   - Fewer potential failure points
   - No reactive error handling that can cascade
   - Follows standard browser audio patterns