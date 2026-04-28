import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { WEATHER_ANIMATIONS, WEATHER_TYPES } from '../../constants/weatherTypes';

const WeatherEmoji = ({ weatherType, size = 'large' }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [fadeAnim, spinAnim]);

  const getEmoji = () => {
    switch (weatherType) {
      case WEATHER_TYPES.CLEAR:
        return '☀️';
      case WEATHER_TYPES.CLOUDS:
        return '☁️';
      case WEATHER_TYPES.RAIN:
      case WEATHER_TYPES.DRIZZLE:
        return '🌧️';
      case WEATHER_TYPES.THUNDERSTORM:
        return '⛈️';
      case WEATHER_TYPES.SNOW:
        return '❄️';
      case WEATHER_TYPES.MIST:
      case WEATHER_TYPES.FOG:
      case WEATHER_TYPES.HAZE:
        return '🌫️';
      default:
        return '☀️';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 80;
      case 'large':
        return 120;
      default:
        return 120;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'medium':
        return 150;
      case 'large':
        return 250;
      default:
        return 250;
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isRotating = weatherType === WEATHER_TYPES.CLEAR;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: getContainerSize(), 
          height: getContainerSize() 
        }
      ]}
    >
      <Animated.Text
        style={[
          styles.emoji,
          {
            fontSize: getFontSize(),
            opacity: fadeAnim,
            transform: isRotating ? [{ rotate: spin }] : [],
          },
        ]}
      >
        {getEmoji()}
      </Animated.Text>
    </View>
  );
};

const WeatherAnimation = ({ weatherType, style, size = 'large' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const animationSource = WEATHER_ANIMATIONS[weatherType] || WEATHER_ANIMATIONS.default;

  const handleAnimationError = () => {
    console.log('Lottie animation failed to load, using fallback emoji');
    setHasError(true);
    setIsLoading(false);
  };

  const handleAnimationLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return <WeatherEmoji weatherType={weatherType} size={size} />;
  }

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={animationSource}
        autoPlay
        loop
        style={[
          styles.animation,
          size === 'small' && styles.small,
          size === 'medium' && styles.medium,
          size === 'large' && styles.large,
        ]}
        resizeMode="contain"
        onError={handleAnimationError}
        onLayout={handleAnimationLoad}
      />
      {isLoading && (
        <View style={styles.fallbackContainer}>
          <WeatherEmoji weatherType={weatherType} size={size} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  small: {
    width: 80,
    height: 80,
  },
  medium: {
    width: 150,
    height: 150,
  },
  large: {
    width: 250,
    height: 250,
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeatherAnimation;
