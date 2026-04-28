import Constants from 'expo-constants';

const getApiKey = () => {
  // 优先从 app.json 的 extra 字段读取
  const extra = Constants.expoConfig?.extra;
  if (extra?.weatherApiKey && extra.weatherApiKey !== 'YOUR_API_KEY_HERE') {
    return extra.weatherApiKey;
  }
  
  // 备用：从环境变量读取
  if (process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== 'YOUR_API_KEY_HERE') {
    return process.env.WEATHER_API_KEY;
  }
  
  // 如果都没有配置，返回默认值（会导致 API 调用失败）
  console.warn('⚠️ 警告：未配置有效的 OpenWeatherMap API 密钥');
  console.warn('⚠️ 请在 app.json 的 extra.weatherApiKey 字段中配置您的 API 密钥');
  return 'YOUR_API_KEY_HERE';
};

export const API_CONFIG = {
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEO_BASE_URL: 'https://api.openweathermap.org/geo/1.0',
  API_KEY: getApiKey(),
  UNITS: 'metric',
  LANGUAGE: 'en',
};

export const WEATHER_API_ENDPOINTS = {
  CURRENT: `${API_CONFIG.BASE_URL}/weather`,
  FORECAST: `${API_CONFIG.BASE_URL}/forecast`,
  GEO_DIRECT: `${API_CONFIG.GEO_BASE_URL}/direct`,
  GEO_REVERSE: `${API_CONFIG.GEO_BASE_URL}/reverse`,
};

// 导出一个函数来检查 API 密钥是否已配置
export const isApiKeyConfigured = () => {
  return API_CONFIG.API_KEY !== 'YOUR_API_KEY_HERE';
};
