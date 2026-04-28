import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { formatTemperature, getWeatherIconUrl } from '../../utils/weatherUtils';
import { colors } from '../../styles/colors';
import WeatherAnimation from './WeatherAnimation';

const DailyForecastItem = ({ item, onPress, selected }) => {
  const { dayOfWeek, dateStr, tempMax, tempMin, weather } = item;
  const weatherType = weather.main;

  return (
    <TouchableOpacity 
      style={[styles.itemContainer, selected && styles.selectedItem]}
      onPress={() => onPress && onPress(item)}
    >
      <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
      <Text style={styles.dateStr}>{dateStr}</Text>
      
      <View style={styles.weatherIconContainer}>
        <WeatherAnimation 
          weatherType={weatherType} 
          size="small"
          style={styles.weatherIcon}
        />
      </View>
      
      <Text style={styles.weatherDesc}>{weather.description}</Text>
      
      <View style={styles.tempContainer}>
        <Text style={styles.tempMax}>{formatTemperature(tempMax)}</Text>
        <Text style={styles.tempMin}>{formatTemperature(tempMin)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const DailyForecast = ({ forecastData, onItemPress, selectedIndex }) => {
  if (!forecastData || forecastData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No forecast data available</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }) => (
    <DailyForecastItem 
      item={item} 
      onPress={onItemPress}
      selected={selectedIndex === index}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7-Day Forecast</Text>
      <FlatList
        data={forecastData}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  itemContainer: {
    width: 140,
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayOfWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 5,
  },
  dateStr: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  weatherIconContainer: {
    marginVertical: 10,
  },
  weatherIcon: {
    width: 60,
    height: 60,
  },
  weatherDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  tempContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  tempMax: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tempMin: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  noDataText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: 20,
  },
});

export default DailyForecast;
