import { useState, useCallback, useEffect } from 'react';
import { fetchCurrentWeather, fetchForecast } from '../services/api/weatherApi';
import { processForecastData } from '../utils/weatherUtils';
import { cacheStorage, generateCacheKey } from '../services/storage/cacheStorage';

export const useCurrentWeather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchWeather = useCallback(async (lat, lon) => {
    if (!lat || !lon) {
      setError('Invalid coordinates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCurrentWeather(lat, lon);
      setWeatherData(result.data);
      setFromCache(result.fromCache);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    weatherData,
    loading,
    error,
    fromCache,
    fetchWeather,
    clearError,
  };
};

export const useForecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchForecastData = useCallback(async (lat, lon) => {
    if (!lat || !lon) {
      setError('Invalid coordinates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchForecast(lat, lon);
      const processed = processForecastData(result.data);
      setForecastData(processed);
      setFromCache(result.fromCache);
      return { data: processed, fromCache: result.fromCache };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    forecastData,
    loading,
    error,
    fromCache,
    fetchForecastData,
    clearError,
  };
};

export const useWeatherWithForecast = () => {
  const [combinedData, setCombinedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (lat, lon) => {
    if (!lat || !lon) {
      setError('Invalid coordinates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [weatherResult, forecastResult] = await Promise.all([
        fetchCurrentWeather(lat, lon),
        fetchForecast(lat, lon),
      ]);

      const processedForecast = processForecastData(forecastResult.data);
      
      const result = {
        currentWeather: weatherResult.data,
        forecast: processedForecast,
        fromCache: weatherResult.fromCache || forecastResult.fromCache,
      };

      setCombinedData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    combinedData,
    loading,
    error,
    fetchAll,
    clearError,
  };
};
