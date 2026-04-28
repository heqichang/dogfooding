import React, { createContext, useContext, useState, useCallback } from 'react';
import { locationService } from '../services/location/locationService';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocationInternal = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentLocation = await locationService.getCurrentPosition();
      setLocation(currentLocation);
      
      const addressInfo = await locationService.getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude
      );
      setAddress(addressInfo);
      
      return currentLocation;
    } catch (err) {
      setError(err.message);
      
      const lastKnown = await locationService.getLastKnownPosition();
      if (lastKnown) {
        setLocation(lastKnown);
        const addressInfo = await locationService.getAddressFromCoordinates(
          lastKnown.latitude,
          lastKnown.longitude
        );
        setAddress(addressInfo);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await locationService.requestForegroundPermissions();
      setPermissionStatus(result.status);
      setCanAskAgain(result.canAskAgain);
      
      let locationResult = null;
      if (result.isGranted) {
        try {
          locationResult = await getCurrentLocationInternal();
        } catch (locError) {
          console.log('Failed to get location after permission granted:', locError);
        }
      }
      
      return {
        ...result,
        location: locationResult
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCurrentLocationInternal]);

  const getCurrentLocation = useCallback(async () => {
    return await getCurrentLocationInternal();
  }, [getCurrentLocationInternal]);

  const refreshLocation = useCallback(async () => {
    return await getCurrentLocationInternal();
  }, [getCurrentLocationInternal]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    location,
    address,
    permissionStatus,
    canAskAgain,
    loading,
    error,
    requestPermissions,
    getCurrentLocation,
    refreshLocation,
    clearError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
