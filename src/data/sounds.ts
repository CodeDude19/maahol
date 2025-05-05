export interface Sound {
  id: string;
  name: string;
  description: string;
  audioSrc: string;
  category: 'rain' | 'thunder' | 'nature' | 'ambience';
  iconPath: string;
  color: string;
}

// Helper function to determine correct audio format by browser
const getAudioFormat = (): 'ogg' | 'mp3' => {
  // Check if Safari or iOS
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                  /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isSafari ? 'mp3' : 'ogg';
};

// Get the correct audio src based on browser
const getAudioSrc = (soundName: string): string => {
  const format = getAudioFormat();
  return `/maahol/sounds/${soundName}.${format}`;
};

export const sounds: Sound[] = [
  {
    id: 'beach',
    name: 'Beach',
    description: 'Relaxing beach waves',
    audioSrc: getAudioSrc('beach'),
    category: 'nature',
    iconPath: '/maahol/images/Beach-W.png',
    color: '#099FFF',
  },
  {
    id: 'birds',
    name: 'Birds',
    description: 'Birds chirping in nature',
    audioSrc: getAudioSrc('birds'),
    category: 'nature',
    iconPath: '/maahol/images/Birds-W.png',
    color: '#4D7902',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    description: 'Ambient cafe atmosphere',
    audioSrc: getAudioSrc('cafe'),
    category: 'ambience',
    iconPath: '/maahol/images/Cafe-W.png',
    color: '#E6FB04',
  },
  {
    id: 'rain',
    name: 'Rain',
    description: 'Gentle rainfall sounds',
    audioSrc: getAudioSrc('rain'),
    category: 'rain',
    iconPath: '/maahol/images/Rain-W.png',
    color: '#0062FF',
  },
  {
    id: 'rain-window',
    name: 'Rain\nWindshield',
    description: 'Rain on a Car Windshield',
    audioSrc: getAudioSrc('rain-car'),
    category: 'rain',
    iconPath: '/maahol/images/Rain_Windshield-W.png',
    color: '#00FFFF',
  },
  {
    id: 'rain-camping',
    name: 'Rain\nCamping',
    description: 'Rain on camping tent',
    audioSrc: getAudioSrc('rain-camping'),
    category: 'rain',
    iconPath: '/maahol/images/Rain_Camping-W.png',
    color: '#008080',
  },
  {
    id: 'heavy-rain',
    name: 'Rain\nHeavy',
    description: 'Heavy rainfall sounds',
    audioSrc: getAudioSrc('heavy-rain'),
    category: 'rain',
    iconPath: '/maahol/images/Rain_Heavy-W.png',
    color: '#7F00FF',
  },
  {
    id: 'thunder',
    name: 'Thunder',
    description: 'Thunder and storm sounds',
    audioSrc: getAudioSrc('thunder'),
    category: 'thunder',
    iconPath: '/maahol/images/Thunder-W.png',
    color: '#3f7db2',
  },
  {
    id: 'wind',
    name: 'Wind',
    description: 'Wind blowing sounds',
    audioSrc: getAudioSrc('wind'),
    category: 'nature',
    iconPath: '/maahol/images/Wind-W.png',
    color: '#00FF33',
  },
  {
    id: 'campfire',
    name: 'Campfire',
    description: 'Crackling campfire sounds',
    audioSrc: getAudioSrc('campfire'),
    category: 'nature',
    iconPath: '/maahol/images/Campfire-W.png',
    color: '#FF6600',
  },
  {
    id: 'city',
    name: 'City',
    description: 'Urban city ambience',
    audioSrc: getAudioSrc('city'),
    category: 'ambience',
    iconPath: '/maahol/images/City-W.png',
    color: '#E1C699',
  },
  {
    id: 'night',
    name: 'Night',
    description: 'Night crickets and ambience',
    audioSrc: getAudioSrc('night-crickets'),
    category: 'nature',
    iconPath: '/maahol/images/Night-W.png',
    color: '#1F51FF',
  },
  {
    id: 'white-noise',
    name: 'White\nNoise',
    description: 'White noise ambience',
    audioSrc: getAudioSrc('white-noise'),
    category: 'ambience',
    iconPath: '/maahol/images/Noise-W.png',
    color: '#FFFFFF',
  },
  {
    id: 'brown-noise',
    name: 'Brown\nNoise',
    description: 'Brown noise ambience',
    audioSrc: getAudioSrc('brown-noise'),
    category: 'ambience',
    iconPath: '/maahol/images/Noise-W.png',
    color: '#A52A2A',
  },
  {
    id: 'pink-noise',
    name: 'Pink\nNoise',
    description: 'Pink noise ambience',
    audioSrc: getAudioSrc('pink-noise'),
    category: 'ambience',
    iconPath: '/maahol/images/Noise-W.png',
    color: '#cc0e74',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Cozy fireplace sounds',
    audioSrc: getAudioSrc('fireplace'),
    category: 'nature',
    iconPath: '/maahol/images/Fireplace-W.png',
    color: '#FF0000',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Peaceful forest ambience',
    audioSrc: getAudioSrc('forest'),
    category: 'nature',
    iconPath: '/maahol/images/Forest-W.png',
    color: '#33FF00',
  },
  {
    id: 'snow',
    name: 'Snow',
    description: 'Peaceful snow ambience',
    audioSrc: getAudioSrc('snow'),
    category: 'nature',
    iconPath: '/maahol/images/Snow-W.png',
    color: '#E2E2E2',
  },
  {
    id: 'train',
    name: 'Train',
    description: 'Train journey ambience',
    audioSrc: getAudioSrc('train'),
    category: 'ambience',
    iconPath: '/maahol/images/Train-W.png',
    color: '#FFFF00',
  },
  // {
  //   id: 'Debug',
  //   name: 'Debug',
  //   description: 'Debugging sounds',
  //   audioSrc: getAudioSrc('debug'),
  //   category: 'ambience',
  //   iconPath: '/maahol/images/Debug-W.png',
  //   color: '#FFFF00',
  // }
];
