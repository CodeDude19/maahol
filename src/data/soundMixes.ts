import { SoundMix } from "@/lib/AudioStateManager";

// Sound mixes definition
export const soundMixes: SoundMix[] = [
  {
    name: "Snowy Night & Camping",
    description: "Cozy winter camping under the starlit sky",
    sounds: [
      { id: "campfire", volume: 0.6 },
      { id: "snow", volume: 0.4 },
      { id: "wind", volume: 0.2 }
    ]
  },
  {
    name: "Late Night Storm",
    description: "Intense thunderstorm in the dark of night",
    sounds: [
      { id: "thunder", volume: 1.0 },
      { id: "heavy-rain", volume: 0.3 },
      { id: "rain-window", volume: 0.8 }
    ]
  },
  {
    name: "Sleepless Night City",
    description: "Urban ambience with passing trains in the night",
    sounds: [
      { id: "night", volume: 0.4 },
      { id: "city", volume: 0.6 },
      { id: "train", volume: 0.2 }
    ]
  },
  {
    name: "At a Beach Cafe",
    description: "Relaxing cafe atmosphere by the seaside",
    sounds: [
      { id: "cafe", volume: 0.8 },
      { id: "beach", volume: 0.3 }
    ]
  },
  {
    name: "Forest Canopy Rain",
    description: "Peaceful rain shower in a bird-filled forest",
    sounds: [
      { id: "forest", volume: 0.3 },
      { id: "rain-camping", volume: 0.6 },
      { id: "birds", volume: 0.2 }
    ]
  },
  {
    name: "Skyline Breeze",
    description: "Gentle wind flowing through the city",
    sounds: [
      { id: "city", volume: 0.65 },
      { id: "wind", volume: 0.8 }
    ]
  }
];