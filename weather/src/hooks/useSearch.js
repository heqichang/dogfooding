import { useState, useEffect, useCallback, useRef } from 'react';
import { searchCities } from '../services/api/weatherApi';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const debouncedSearchRef = useRef(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchCities(query);
        setSearchResults(results);
      } catch (err) {
        setError(err.message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  );

  useEffect(() => {
    debouncedSearchRef.current(searchQuery);
  }, [searchQuery]);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  const addToHistory = useCallback((city) => {
    setSearchHistory(prev => {
      const exists = prev.some(item => 
        item.lat === city.lat && item.lon === city.lon
      );
      
      if (exists) {
        return prev;
      }
      
      const newHistory = [city, ...prev].slice(0, 10);
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchQuery,
    searchResults,
    searchHistory,
    loading,
    error,
    updateSearchQuery,
    clearSearch,
    addToHistory,
    clearHistory,
    clearError,
  };
};
