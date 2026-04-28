import * as Location from 'expo-location';

export const locationService = {
  async requestForegroundPermissions() {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      return {
        status,
        canAskAgain,
        isGranted: status === 'granted',
      };
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      throw new Error('Failed to request location permissions');
    }
  },

  async getCurrentPosition(options = {}) {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        ...options,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Failed to get current position:', error);
      
      if (error.code === 'E_LOCATION_PERMISSION_DENIED') {
        throw new Error('Location permission denied');
      } else if (error.code === 'TIMEOUT') {
        throw new Error('Location request timed out');
      } else {
        throw new Error('Failed to get current location');
      }
    }
  },

  async getLastKnownPosition() {
    try {
      const location = await Location.getLastKnownPositionAsync();
      
      if (!location) {
        return null;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Failed to get last known position:', error);
      return null;
    }
  },

  async watchPosition(callback, options = {}) {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
          ...options,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Failed to watch position:', error);
      throw new Error('Failed to watch position');
    }
  },

  async getAddressFromCoordinates(lat, lon) {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      if (!address) {
        return null;
      }

      return {
        city: address.city || address.subregion || address.region,
        country: address.country,
        region: address.region,
        street: address.street,
        postalCode: address.postalCode,
        formattedAddress: [address.street, address.city, address.region, address.country]
          .filter(Boolean)
          .join(', '),
      };
    } catch (error) {
      console.error('Failed to get address from coordinates:', error);
      return null;
    }
  },
};
