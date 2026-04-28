import axios from 'axios';
import { API_CONFIG, WEATHER_API_ENDPOINTS } from '../../constants/apiConfig';
import { cacheStorage, generateCacheKey } from '../storage/cacheStorage';

const weatherApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

const geoApi = axios.create({
  baseURL: API_CONFIG.GEO_BASE_URL,
  timeout: 10000,
});

const defaultParams = {
  appid: API_CONFIG.API_KEY,
  units: API_CONFIG.UNITS,
  lang: API_CONFIG.LANGUAGE,
};

export const fetchCurrentWeather = async (lat, lon) => {
  try {
    const cacheKey = generateCacheKey('current_weather', { lat, lon });
    const cachedData = await cacheStorage.get(cacheKey);
    
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }

    const response = await weatherApi.get(WEATHER_API_ENDPOINTS.CURRENT, {
      params: {
        ...defaultParams,
        lat,
        lon,
      },
    });

    await cacheStorage.set(cacheKey, response.data);
    return { data: response.data, fromCache: false };
  } catch (error) {
    handleApiError(error);
  }
};

export const fetchForecast = async (lat, lon) => {
  try {
    const cacheKey = generateCacheKey('forecast', { lat, lon });
    const cachedData = await cacheStorage.get(cacheKey);
    
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }

    const response = await weatherApi.get(WEATHER_API_ENDPOINTS.FORECAST, {
      params: {
        ...defaultParams,
        lat,
        lon,
      },
    });

    await cacheStorage.set(cacheKey, response.data);
    return { data: response.data, fromCache: false };
  } catch (error) {
    handleApiError(error);
  }
};

export const searchCities = async (query, limit = 5) => {
  try {
    const response = await geoApi.get(WEATHER_API_ENDPOINTS.GEO_DIRECT, {
      params: {
        q: query,
        limit,
        appid: API_CONFIG.API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await geoApi.get(WEATHER_API_ENDPOINTS.GEO_REVERSE, {
      params: {
        lat,
        lon,
        limit: 1,
        appid: API_CONFIG.API_KEY,
      },
    });

    return response.data[0];
  } catch (error) {
    handleApiError(error);
  }
};

const handleApiError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        throw new Error('Invalid API key. Please check your configuration.');
      case 404:
        throw new Error('Location not found. Please try a different location.');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error('Weather service is temporarily unavailable. Please try again later.');
      default:
        throw new Error('Failed to fetch weather data. Please try again.');
    }
  } else if (error.request) {
    throw new Error('No response from server. Please check your network connection.');
  } else {
    throw new Error('Failed to fetch weather data. Please try again.');
  }
};
