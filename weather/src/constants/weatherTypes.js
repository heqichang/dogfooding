export const WEATHER_TYPES = {
  CLEAR: 'Clear',
  CLOUDS: 'Clouds',
  RAIN: 'Rain',
  DRIZZLE: 'Drizzle',
  THUNDERSTORM: 'Thunderstorm',
  SNOW: 'Snow',
  MIST: 'Mist',
  FOG: 'Fog',
  HAZE: 'Haze',
};

export const WEATHER_ANIMATIONS = {
  [WEATHER_TYPES.CLEAR]: require('../../assets/animations/sunny.json'),
  [WEATHER_TYPES.CLOUDS]: require('../../assets/animations/cloudy.json'),
  [WEATHER_TYPES.RAIN]: require('../../assets/animations/rainy.json'),
  [WEATHER_TYPES.DRIZZLE]: require('../../assets/animations/rainy.json'),
  [WEATHER_TYPES.THUNDERSTORM]: require('../../assets/animations/thunderstorm.json'),
  [WEATHER_TYPES.SNOW]: require('../../assets/animations/snowy.json'),
  [WEATHER_TYPES.MIST]: require('../../assets/animations/foggy.json'),
  [WEATHER_TYPES.FOG]: require('../../assets/animations/foggy.json'),
  [WEATHER_TYPES.HAZE]: require('../../assets/animations/foggy.json'),
  default: require('../../assets/animations/sunny.json'),
};

export const WEATHER_BACKGROUND_COLORS = {
  [WEATHER_TYPES.CLEAR]: ['#87CEEB', '#E0F6FF'],
  [WEATHER_TYPES.CLOUDS]: ['#B0C4DE', '#D3D3D3'],
  [WEATHER_TYPES.RAIN]: ['#4682B4', '#708090'],
  [WEATHER_TYPES.DRIZZLE]: ['#87CEFA', '#B0C4DE'],
  [WEATHER_TYPES.THUNDERSTORM]: ['#2C3E50', '#34495E'],
  [WEATHER_TYPES.SNOW]: ['#E0FFFF', '#F0F8FF'],
  [WEATHER_TYPES.MIST]: ['#DCDCDC', '#F5F5F5'],
  [WEATHER_TYPES.FOG]: ['#E8E8E8', '#F0F0F0'],
  [WEATHER_TYPES.HAZE]: ['#D3D3D3', '#E8E8E8'],
  default: ['#87CEEB', '#E0F6FF'],
};
