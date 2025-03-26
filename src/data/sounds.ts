
export interface Sound {
  id: string;
  name: string;
  description: string;
  audioSrc: string;
  category: 'rain' | 'thunder' | 'nature' | 'ambience';
}

export const sounds: Sound[] = [
  {
    id: 'light-rain',
    name: 'Light Rain',
    description: 'Gentle raindrops on a window',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_8a5e367bb8.mp3?filename=light-rain-ambient-114354.mp3',
    category: 'rain',
  },
  {
    id: 'heavy-rain',
    name: 'Heavy Rain',
    description: 'Intense rainfall on a rooftop',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/09/02/audio_0f2f1bad6b.mp3?filename=heavy-rain-18254.mp3',
    category: 'rain',
  },
  {
    id: 'thunder-storm',
    name: 'Thunderstorm',
    description: 'Lightning and thunder with rain',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39caa985.mp3?filename=thunderstorm-14708.mp3',
    category: 'thunder',
  },
  {
    id: 'distant-thunder',
    name: 'Distant Thunder',
    description: 'Rumbling thunder in the distance',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c1e9c33ecc.mp3?filename=thunder-25689.mp3',
    category: 'thunder',
  },
  {
    id: 'rain-on-umbrella',
    name: 'Rain on Umbrella',
    description: 'Rain hitting an umbrella above you',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_62bc095ef3.mp3?filename=rain-on-umbrella-nature-sounds-8186.mp3',
    category: 'rain',
  },
  {
    id: 'rain-on-tent',
    name: 'Rain on Tent',
    description: 'Raindrops on a tent in nature',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_67f4ebc124.mp3?filename=light-rain-on-tent-nature-sounds-7804.mp3',
    category: 'rain',
  },
  {
    id: 'rain-on-leaves',
    name: 'Rain on Leaves',
    description: 'Rain falling on forest leaves',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/26/audio_27b6926683.mp3?filename=sfx-outdoor-distant-thunder-heavy-rain-cars-passing-by-the-street-park-amb-32879.mp3',
    category: 'rain',
  },
  {
    id: 'rain-on-window',
    name: 'Rain on Window',
    description: 'Raindrops tapping on glass',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_35a7a048e3.mp3?filename=soft-rain-ambient-111154.mp3',
    category: 'rain',
  },
  {
    id: 'forest-rain',
    name: 'Forest Rain',
    description: 'Rainfall in a dense forest',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/04/07/audio_d11856bae4.mp3?filename=rain-in-forest-birds-singing-nature-sounds-8052.mp3',
    category: 'nature',
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Gentle ocean waves on shore',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_17f592b83d.mp3?filename=ocean-waves-112762.mp3',
    category: 'nature',
  },
  {
    id: 'creek',
    name: 'Creek',
    description: 'Flowing creek in nature',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/04/10/audio_b812d9d465.mp3?filename=small-stream-running-nature-sounds-7802.mp3',
    category: 'nature',
  },
  {
    id: 'campfire',
    name: 'Campfire',
    description: 'Crackling campfire sounds',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_e2be9d39a5.mp3?filename=campfire-crackling-fireplace-sound-113767.mp3',
    category: 'nature',
  },
  {
    id: 'night-crickets',
    name: 'Night Crickets',
    description: 'Crickets chirping at night',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/10/25/audio_ed2183c3d6.mp3?filename=crickets-night-116211.mp3',
    category: 'nature',
  },
  {
    id: 'wind-chimes',
    name: 'Wind Chimes',
    description: 'Gentle wind chimes in breeze',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/04/08/audio_9106d4e7a3.mp3?filename=gentle-wind-chimes-112623.mp3',
    category: 'ambience',
  },
  {
    id: 'city-rain',
    name: 'City Rain',
    description: 'Rain in a city with ambient noise',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_2be69a0e4c.mp3?filename=rain-and-thunder-no-wind-14418.mp3',
    category: 'ambience',
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Ambient coffee shop background',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/10/31/audio_f8e24581de.mp3?filename=studying-in-the-coffee-shop-ambient-116284.mp3',
    category: 'ambience',
  },
  {
    id: 'wind-in-trees',
    name: 'Wind in Trees',
    description: 'Wind blowing through leaves',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2021/09/13/audio_22b6a1581d.mp3?filename=windy-trees-113860.mp3',
    category: 'nature',
  },
  {
    id: 'rain-car-interior',
    name: 'Rain on Car',
    description: 'Inside car during rainfall',
    audioSrc: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_e5a2295e6a.mp3?filename=relaxing-in-the-car-with-rain-108590.mp3',
    category: 'rain',
  }
];
