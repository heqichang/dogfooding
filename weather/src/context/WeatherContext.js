import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchCurrentWeather, fetchForecast, searchCities, reverseGeocode } from '../services/api/weatherApi';
import { processForecastData } from '../utils/weatherUtils';

const WeatherContext = createContext();

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export const WeatherProvider = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const getCurrentWeather = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCurrentWeather(lat, lon);
      setCurrentWeather(result.data);
      
      const cityInfo = await reverseGeocode(lat, lon);
      if (cityInfo) {
        setSelectedCity({
          name: cityInfo.name,
          country: cityInfo.country,
          lat: cityInfo.lat,
          lon: cityInfo.lon,
        });
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getForecast = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchForecast(lat, lon);
      const processedForecast = processForecastData(result.data);
      setForecast(processedForecast);
      return { data: processedForecast, fromCache: result.fromCache };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchForCities = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }
    
    try {
      const results = await searchCities(query);
      setSearchResults(results);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const selectCity = useCallback((city) => {
    setSelectedCity(city);
    setSearchResults([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshWeather = useCallback(async () => {
    if (!selectedCity) {
      throw new Error('No city selected');
    }
    
    await Promise.all([
      getCurrentWeather(selectedCity.lat, selectedCity.lon),
      getForecast(selectedCity.lat, selectedCity.lon),
    ]);
  }, [selectedCity, getCurrentWeather, getForecast]);

  const value = {
    currentWeather,
    forecast,
    searchResults,
    loading,
    error,
    selectedCity,
    getCurrentWeather,
    getForecast,
    searchForCities,
    selectCity,
    clearError,
    refreshWeather,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};
