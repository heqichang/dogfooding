import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWeather } from '../context/WeatherContext';
import { useLocation } from '../context/LocationContext';
import CurrentWeather from '../components/weather/CurrentWeather';
import DailyForecast from '../components/weather/DailyForecast';
import { colors } from '../styles/colors';
import { WEATHER_BACKGROUND_COLORS } from '../constants/weatherTypes';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { 
    currentWeather, 
    forecast, 
    loading, 
    error, 
    selectedCity,
    getCurrentWeather,
    getForecast,
    refreshWeather,
    clearError
  } = useWeather();
  
  const { 
    location, 
    address, 
    permissionStatus,
    loading: locationLoading,
    error: locationError,
    requestPermissions,
    getCurrentLocation
  } = useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const [bgColors, setBgColors] = useState(WEATHER_BACKGROUND_COLORS.default);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (currentWeather) {
      const weatherType = currentWeather.weather[0].main;
      const bgColorsArray = WEATHER_BACKGROUND_COLORS[weatherType] || WEATHER_BACKGROUND_COLORS.default;
      setBgColors(bgColorsArray);
    }
  }, [currentWeather]);

  useEffect(() => {
    if (hasInitialized) return;
    
    initializeApp();
  }, [hasInitialized]);

  useEffect(() => {
    if (location && permissionStatus === 'granted' && !currentWeather && !loading) {
      loadWeatherData(location.latitude, location.longitude);
    }
  }, [location, permissionStatus, currentWeather, loading]);

  const initializeApp = async () => {
    setHasInitialized(true);
    
    try {
      const permissionResult = await requestPermissions();
      
      if (permissionResult.isGranted && permissionResult.location) {
        await loadWeatherData(permissionResult.location.latitude, permissionResult.location.longitude);
      }
    } catch (err) {
      console.log('Initialization error:', err);
    }
  };

  const loadWeatherData = async (lat, lon) => {
    try {
      await Promise.all([
        getCurrentWeather(lat, lon),
        getForecast(lat, lon),
      ]);
    } catch (err) {
      console.log('Failed to load weather data:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      if (selectedCity) {
        await refreshWeather();
      } else if (location) {
        await loadWeatherData(location.latitude, location.longitude);
      } else {
        const loc = await getCurrentLocation();
        if (loc) {
          await loadWeatherData(loc.latitude, loc.longitude);
        }
      }
    } catch (err) {
      console.log('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handlePermissionGrant = async () => {
    const permissionResult = await requestPermissions();
    
    if (permissionResult.isGranted && permissionResult.location) {
      await loadWeatherData(permissionResult.location.latitude, permissionResult.location.longitude);
    }
  };

  if (locationLoading || (loading && !currentWeather)) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (permissionStatus !== 'granted' && !selectedCity) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionDescription}>
          We need your location to show you accurate weather information. 
          You can also search for cities manually.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={handlePermissionGrant}
        >
          <Text style={styles.permissionButtonText}>Grant Location Access</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Text style={styles.searchButtonText}>Search for a City</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWeather) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.noDataTitle}>No Weather Data</Text>
        <Text style={styles.noDataDescription}>
          Please check your internet connection or try searching for a city.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Text style={styles.searchButtonText}>Search for a City</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColors[0] }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.searchIconButton}
            onPress={handleSearchPress}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        <CurrentWeather 
          weatherData={currentWeather}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {forecast && (
          <DailyForecast 
            forecastData={forecast}
          />
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  searchIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 22,
  },
  searchIcon: {
    fontSize: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  noDataDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 15,
    margin: 20,
    alignItems: 'center',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  dismissText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;
