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
  },
  {
    name: "Cozy Winter Evening",
    description: "The warm glow of a fireplace during a winter night",
    sounds: [
      { id: "fireplace", volume: 0.7 },
      { id: "snow", volume: 0.3 },
      { id: "wind", volume: 0.2 }
    ]
  },
  {
    name: "Productive Focus",
    description: "Optimal background sounds for concentration and work",
    sounds: [
      { id: "white-noise", volume: 0.5 },
      { id: "rain", volume: 0.3 },
      { id: "cafe", volume: 0.2 }
    ]
  },
  {
    name: "Tranquil Meditation",
    description: "Peaceful natural sounds for mindfulness and relaxation",
    sounds: [
      { id: "forest", volume: 0.6 },
      { id: "birds", volume: 0.4 },
      { id: "pink-noise", volume: 0.1 }
    ]
  },
  {
    name: "Rainy Train Journey",
    description: "The hypnotic rhythm of a train ride during a rainstorm",
    sounds: [
      { id: "train", volume: 1.0 },
      { id: "rain-window", volume: 0.3 },
      { id: "thunder", volume: 1.0 }
    ]
  },
  {
    name: "Ocean Office",
    description: "Work by the sea with the perfect blend of productivity and relaxation",
    sounds: [
      { id: "beach", volume: 0.7 },
      { id: "cafe", volume: 0.3 },
      { id: "white-noise", volume: 0.1 }
    ]
  },
  {
    name: "Mountain Retreat",
    description: "The serene environment of a mountain hideaway",
    sounds: [
      { id: "wind", volume: 0.5 },
      { id: "forest", volume: 0.4 },
      { id: "birds", volume: 0.2 }
    ]
  }
];