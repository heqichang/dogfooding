import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { formatTemperature, getWeatherIconUrl, formatWindSpeed, formatHumidity } from '../../utils/weatherUtils';
import { colors } from '../../styles/colors';
import WeatherAnimation from './WeatherAnimation';

const CurrentWeather = ({ weatherData, onRefresh, loading }) => {
  if (!weatherData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No weather data available</Text>
      </View>
    );
  }

  const { name, main, weather, wind, sys } = weatherData;
  const currentWeather = weather[0];
  const weatherType = currentWeather.main;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.cityName}>{name}</Text>
        {sys && (
          <Text style={styles.country}>{sys.country}</Text>
        )}
      </View>

      <View style={styles.weatherContainer}>
        <WeatherAnimation 
          weatherType={weatherType} 
          style={styles.animation}
        />
      </View>

      <View style={styles.temperatureContainer}>
        <Text style={styles.temperature}>{formatTemperature(main.temp)}</Text>
        <Text style={styles.weatherDescription}>{currentWeather.description}</Text>
      </View>

      <View style={styles.feelsLikeContainer}>
        <Text style={styles.feelsLike}>Feels like {formatTemperature(main.feels_like)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{formatHumidity(main.humidity)}</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{formatWindSpeed(wind.speed)}</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pressure</Text>
          <Text style={styles.detailValue}>{main.pressure} hPa</Text>
        </View>
      </View>

      {onRefresh && (
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
  },
  country: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  weatherContainer: {
    marginVertical: 20,
  },
  animation: {
    width: 200,
    height: 200,
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  temperature: {
    fontSize: 72,
    fontWeight: '300',
    color: colors.text.primary,
  },
  weatherDescription: {
    fontSize: 20,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  feelsLikeContainer: {
    marginBottom: 20,
  },
  feelsLike: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  detailsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detailSeparator: {
    width: 1,
    backgroundColor: colors.gray[300],
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
});

export default CurrentWeather;
