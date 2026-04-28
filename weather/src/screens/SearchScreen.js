import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWeather } from '../context/WeatherContext';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/search/SearchBar';
import SearchResultList from '../components/search/SearchResultList';
import { colors } from '../styles/colors';

const SearchScreen = () => {
  const navigation = useNavigation();
  const { 
    getCurrentWeather, 
    getForecast, 
    selectCity,
    selectedCity
  } = useWeather();
  
  const {
    searchQuery,
    searchResults,
    searchHistory,
    loading,
    error,
    updateSearchQuery,
    clearSearch,
    addToHistory,
    clearError
  } = useSearch();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleCitySelect = async (city) => {
    try {
      selectCity({
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon,
      });

      addToHistory({
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon,
      });

      await Promise.all([
        getCurrentWeather(city.lat, city.lon),
        getForecast(city.lat, city.lon),
      ]);

      navigation.goBack();
    } catch (err) {
      console.log('Failed to load city weather:', err);
    }
  };

  const handleHistorySelect = async (historyItem) => {
    await handleCitySelect(historyItem);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search City</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={updateSearchQuery}
          onClear={clearSearch}
          placeholder="Search for a city..."
        />
      </View>

      <View style={styles.resultsContainer}>
        <SearchResultList
          results={searchResults}
          history={searchHistory}
          onSelectCity={handleCitySelect}
          onSelectHistory={handleHistorySelect}
          loading={loading}
          error={error}
          showHistory={!searchQuery}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default SearchScreen;
