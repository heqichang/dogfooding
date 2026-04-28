import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { WeatherProvider } from './src/context/WeatherContext';
import { LocationProvider } from './src/context/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <LocationProvider>
        <WeatherProvider>
          <AppNavigator />
        </WeatherProvider>
      </LocationProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
