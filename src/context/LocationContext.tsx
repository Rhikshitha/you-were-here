import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { LocationCoordinates } from '../types/app';
import { calculateHaversineDistance } from '../lib/distance';

interface LocationContextType {
  location: LocationCoordinates | null;
  permissionGranted: boolean | null;
  isLoading: boolean;
  errorMsg: string | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  getDistanceToPlace: (placeLat: number, placeLng: number) => number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (granted) {
        await refreshLocation();
      } else {
        setErrorMsg('Location access is needed to discover memories around you.');
      }
      return granted;
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not request location permissions.');
      setPermissionGranted(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = async (): Promise<void> => {
    try {
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
        accuracy: currentLoc.coords.accuracy,
      });
    } catch {
      // Fallback default coordinates if location unavailable in simulator/emulator
      if (!location) {
        setLocation({
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: null,
        });
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function checkPermission() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          const granted = status === 'granted';
          setPermissionGranted(granted);
          if (granted) {
            await refreshLocation();
          } else {
            // Provide initial fallback location for testing UI map pins
            setLocation({
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: null,
            });
          }
        }
      } catch {
        if (isMounted) {
          setPermissionGranted(false);
          setLocation({
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: null,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  const getDistanceToPlace = (placeLat: number, placeLng: number): number | null => {
    if (!location) return null;
    return calculateHaversineDistance(location, {
      latitude: placeLat,
      longitude: placeLng,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        permissionGranted,
        isLoading,
        errorMsg,
        requestPermission,
        refreshLocation,
        getDistanceToPlace,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
