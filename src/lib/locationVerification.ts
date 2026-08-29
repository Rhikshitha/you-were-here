import { LocationCoordinates } from '../types/app';
import { calculateHaversineDistance } from './distance';

export interface LocationVerificationResult {
  isUnlocked: boolean;
  distanceMeters: number;
  radiusMeters: number;
  marginMeters: number; // how many meters needed to get inside radius
  accuracyWarning: boolean;
  message: string;
}

export function verifyLocationUnlock(
  userLocation: LocationCoordinates | null,
  placeLocation: { latitude: number; longitude: number },
  radiusMeters: number
): LocationVerificationResult {
  if (!userLocation) {
    return {
      isUnlocked: false,
      distanceMeters: Infinity,
      radiusMeters,
      marginMeters: Infinity,
      accuracyWarning: false,
      message: 'GPS location is required to verify physical presence.',
    };
  }

  const distanceMeters = calculateHaversineDistance(userLocation, placeLocation);
  const isUnlocked = distanceMeters <= radiusMeters;
  const marginMeters = Math.max(0, distanceMeters - radiusMeters);

  // Check if GPS accuracy is too low (> 200m)
  const accuracyWarning = !!(userLocation.accuracy && userLocation.accuracy > 200);

  let message = '';
  if (isUnlocked) {
    message = '📍 YOU WERE HERE — Physical presence verified!';
  } else if (marginMeters < 50) {
    message = `📍 You're so close! Just ${marginMeters} meters closer to unlock this place.`;
  } else {
    message = `📍 You're ${distanceMeters}m away. Get within ${radiusMeters}m to unlock what people left behind here.`;
  }

  return {
    isUnlocked,
    distanceMeters,
    radiusMeters,
    marginMeters,
    accuracyWarning,
    message,
  };
}
